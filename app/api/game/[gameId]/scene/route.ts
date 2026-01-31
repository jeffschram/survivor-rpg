import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import OpenAI from 'openai'
import {
  getCurrentScene,
  getSceneSequence,
  pick,
  MERGED_NAMES,
  SceneType,
} from '@/lib/game-logic'
import {
  getChoicesForScene,
  determineChallengeOutcome,
  determineTribalOutcome,
  applyStatEffects,
  buildNarrativeFacts,
  buildNarrativePrompt,
  SceneContext,
  Choice,
  ChallengeOutcome,
  TribalOutcome,
} from '@/lib/game-engine'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface GameState {
  gameId: string
  playerName: string
  location: string
  playerTribe: string
  opposingTribe: string
  tribeColors: {
    tribe1Name: string
    tribe1Color: string
    tribe2Name: string
    tribe2Color: string
  }
  tribes: {
    tribe1: string[]
    tribe2: string[]
  }
  eliminated: string[]
  jury: string[]
  day: number
  phase: string
  merged: boolean
  mergedTribeName?: string
  sceneCount: number
  sceneIndexInDay: number
  lastSceneType?: string
  lastChallengeWon?: boolean
  pendingOpposingElimination?: string
  stats: {
    Social: number
    Strategy: number
    Challenge: number
    Threat: number
  }
  history: { role: string; content: string }[]
}

// Get active players from this game's tribes (excluding player)
function getActivePlayersFromGame(game: GameState): string[] {
  const allGamePlayers = [...game.tribes.tribe1, ...game.tribes.tribe2]
  return allGamePlayers.filter((p) => !game.eliminated.includes(p) && p !== game.playerName)
}

// Get tribe members excluding eliminated
function getActiveTribeMembers(tribe: string[], eliminated: string[]): string[] {
  return tribe.filter(p => !eliminated.includes(p))
}

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params
    const body = await request.json()
    const choiceId = body.choiceId as string | undefined
    const customResponse = body.customResponse as string | undefined

    // Get game from Convex
    const game = await convex.query(api.games.getGame, { gameId })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const gameState: GameState = {
      ...game,
      lastChallengeWon: game.lastChallengeWon ?? undefined,
      pendingOpposingElimination: game.pendingOpposingElimination ?? undefined,
      mergedTribeName: game.mergedTribeName ?? undefined,
      lastSceneType: game.lastSceneType ?? undefined,
    }

    const currentScene = getCurrentScene(
      gameState.day,
      gameState.sceneIndexInDay,
      gameState.lastChallengeWon ?? null
    )

    console.log(`Day ${gameState.day} | Scene ${gameState.sceneIndexInDay} | Type: ${currentScene.scene_type}`)
    console.log(`Description: ${currentScene.scene_description}`)

    // =========================================================================
    // GAME ENGINE: Determine outcomes BEFORE calling AI
    // =========================================================================
    
    const playerTribeMembers = getActiveTribeMembers(gameState.tribes.tribe1, gameState.eliminated)
    const opposingTribeMembers = getActiveTribeMembers(gameState.tribes.tribe2, gameState.eliminated)
    
    // Find the choice the player made (if any)
    let selectedChoice: Choice | undefined
    let customAction: string | undefined
    
    if (choiceId) {
      // Get choices for the PREVIOUS scene to find what they selected
      const prevSceneContext: SceneContext = {
        sceneType: (gameState.lastSceneType || 'camp') as SceneType,
        sceneDescription: '', // Not needed for choice lookup
        day: gameState.day,
        phase: gameState.phase as 'pre-merge' | 'merged',
        playerName: gameState.playerName,
        playerTribe: gameState.playerTribe,
        opposingTribe: gameState.opposingTribe,
        tribeMembers: playerTribeMembers.filter(m => m !== gameState.playerName),
        opposingMembers: opposingTribeMembers,
        playerStats: gameState.stats,
        eliminated: gameState.eliminated,
      }
      const prevChoices = getChoicesForScene(prevSceneContext)
      selectedChoice = prevChoices.find(c => c.id === choiceId)
    } else if (customResponse) {
      // Player wrote their own action
      customAction = customResponse
    }

    // Apply stat effects from player's choice
    let newStats = { ...gameState.stats }
    if (selectedChoice) {
      newStats = applyStatEffects(newStats, selectedChoice.effects)
      console.log(`Applied choice effects:`, selectedChoice.effects)
    } else if (customAction) {
      // Custom actions get a small Strategy boost for creativity
      newStats = applyStatEffects(newStats, { Strategy: 1 })
      console.log(`Custom action: "${customAction}" - applied Strategy +1`)
    }

    // Determine challenge outcome (BEFORE AI call)
    let challengeOutcome: ChallengeOutcome | undefined
    const isResultsScene = currentScene.scene_type === 'reward_challenge_results' || 
                           currentScene.scene_type === 'immunity_challenge_results'
    if (isResultsScene) {
      challengeOutcome = determineChallengeOutcome(
        newStats,
        gameState.playerTribe,
        playerTribeMembers,
        opposingTribeMembers,
        gameState.phase as 'pre-merge' | 'merged'
      )
      console.log(`Challenge outcome:`, challengeOutcome)
    }

    // Determine tribal outcome (BEFORE AI call)
    let tribalOutcome: TribalOutcome | undefined
    if (currentScene.scene_type === 'tribal_results') {
      const isPlayerTribe = !gameState.lastChallengeWon
      tribalOutcome = determineTribalOutcome(
        isPlayerTribe ? playerTribeMembers : opposingTribeMembers,
        newStats,
        isPlayerTribe
      )
      console.log(`Tribal outcome:`, tribalOutcome)
    }

    // =========================================================================
    // BUILD SCENE CONTEXT
    // =========================================================================
    
    const sceneContext: SceneContext = {
      sceneType: currentScene.scene_type as SceneType,
      sceneDescription: currentScene.scene_description,
      day: gameState.day,
      phase: gameState.phase as 'pre-merge' | 'merged',
      playerName: gameState.playerName,
      playerTribe: gameState.playerTribe,
      opposingTribe: gameState.opposingTribe,
      tribeMembers: playerTribeMembers.filter(m => m !== gameState.playerName), // Exclude player
      opposingMembers: opposingTribeMembers,
      playerStats: newStats,
      eliminated: gameState.eliminated,
      lastChoice: selectedChoice,
      customAction,
      challengeOutcome,
      tribalOutcome,
      pendingReveal: gameState.pendingOpposingElimination,
    }

    // =========================================================================
    // GENERATE NARRATIVE (AI only writes story, not outcomes)
    // =========================================================================
    
    const narrativeFacts = buildNarrativeFacts(sceneContext)
    const narrativePrompt = buildNarrativePrompt(sceneContext, narrativeFacts, gameState.location)

    // ∆ Scene Description
    // Call OpenAI for narrative only
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: narrativePrompt },
        { role: 'user', content: 'Write the scene. Keep it to just 1 paragraph after the title. Be dramatic and immersive.' },
      ],
      temperature: 0.85,
      max_tokens: 280,
    })

    const rawMessage = response.choices[0]?.message?.content || ''

    // =========================================================================
    // GAME STATE UPDATES (deterministic, not from AI)
    // =========================================================================

    let newSceneIndexInDay = gameState.sceneIndexInDay + 1
    let newDay = gameState.day
    let newMerged = gameState.merged
    let newMergedTribeName = gameState.mergedTribeName
    let newPhase = gameState.phase

    // Use challenge outcome to determine win/loss for scene sequence
    const challengeWon = challengeOutcome?.playerTribeWins ?? gameState.lastChallengeWon
    const sequence = getSceneSequence(gameState.day, challengeWon ?? null)

    if (newSceneIndexInDay >= sequence.length) {
      newDay++
      newSceneIndexInDay = 0

      // Check for merge
      if (newDay === 25 && !newMerged) {
        newMerged = true
        newMergedTribeName = pick(MERGED_NAMES)
        newPhase = 'merged'
      }
    }

    // Handle eliminations
    let newPendingElimination = gameState.pendingOpposingElimination
    let newEliminated = [...gameState.eliminated]
    let newJury = [...gameState.jury]
    const tribe1 = [...gameState.tribes.tribe1]
    const tribe2 = [...gameState.tribes.tribe2]

    // Reveal pending elimination at any challenge (both tribes meet)
    const isChallengeScene = currentScene.scene_type === 'reward_challenge' || 
                             currentScene.scene_type === 'immunity_challenge'
    if (isChallengeScene && gameState.pendingOpposingElimination) {
      newEliminated.push(gameState.pendingOpposingElimination)
      const idx = tribe2.indexOf(gameState.pendingOpposingElimination)
      if (idx !== -1) tribe2.splice(idx, 1)
      newPendingElimination = undefined
    }

    // Handle tribal results elimination
    if (tribalOutcome && tribalOutcome.eliminated !== 'PLAYER') {
      newEliminated.push(tribalOutcome.eliminated)
      // Add to jury if post-merge
      if (gameState.merged || gameState.day >= 20) {
        newJury.push(tribalOutcome.eliminated)
      }
      // Remove from appropriate tribe
      const idx1 = tribe1.indexOf(tribalOutcome.eliminated)
      const idx2 = tribe2.indexOf(tribalOutcome.eliminated)
      if (idx1 !== -1) tribe1.splice(idx1, 1)
      if (idx2 !== -1) tribe2.splice(idx2, 1)
    }

    // Set pending elimination if player won IMMUNITY challenge (pre-merge)
    // Only immunity challenges lead to tribal council for the losing tribe
    if (currentScene.scene_type === 'immunity_challenge_results' && 
        challengeOutcome?.playerTribeWins && 
        !gameState.merged) {
      if (tribe2.length > 0 && !newPendingElimination) {
        // Determine who opponent tribe eliminates at their tribal council
        const oppTribalOutcome = determineTribalOutcome(
          getActiveTribeMembers(tribe2, newEliminated),
          newStats,
          false
        )
        newPendingElimination = oppTribalOutcome.eliminated
        console.log(`[PENDING ELIMINATION] ${newPendingElimination} from opposing tribe`)
      }
    }

    // Update history (simplified - just track for context)
    const newHistory = [...gameState.history]
    if (selectedChoice) {
      newHistory.push({ role: 'user', content: `Player chose: ${selectedChoice.text}` })
    }
    newHistory.push({ role: 'assistant', content: rawMessage })
    // Keep history manageable
    if (newHistory.length > 20) {
      newHistory.splice(0, newHistory.length - 20)
    }

    // Update game in Convex
    await convex.mutation(api.games.updateGame, {
      gameId,
      updates: {
        sceneCount: gameState.sceneCount + 1,
        sceneIndexInDay: newSceneIndexInDay,
        day: newDay,
        lastSceneType: currentScene.scene_type,
        lastChallengeWon: challengeOutcome?.playerTribeWins ?? gameState.lastChallengeWon,
        pendingOpposingElimination: newPendingElimination,
        eliminated: newEliminated,
        jury: newJury,
        merged: newMerged,
        mergedTribeName: newMergedTribeName,
        phase: newPhase,
        stats: newStats,
        tribes: { tribe1, tribe2 },
        history: newHistory,
      },
    })

    // =========================================================================
    // GET CHOICES FOR NEXT SCENE (deterministic, not from AI)
    // =========================================================================
    
    // Update context for choice generation
    sceneContext.playerStats = newStats
    sceneContext.challengeOutcome = challengeOutcome
    const choices = getChoicesForScene(sceneContext)

    // =========================================================================
    // RESPONSE
    // =========================================================================

    // Check if player was eliminated
    const playerEliminated = tribalOutcome?.eliminated === 'PLAYER'

    return NextResponse.json({
      message: rawMessage.trim(),
      sceneType: currentScene.scene_type,
      sceneDescription: currentScene.scene_description,
      sceneIndex: newSceneIndexInDay,
      stats: newStats,
      day: newDay,
      phase: newPhase,
      playerTribe: gameState.playerTribe,
      opposingTribe: gameState.opposingTribe,
      tribeColors: {
        [gameState.tribeColors.tribe1Name]: gameState.tribeColors.tribe1Color,
        [gameState.tribeColors.tribe2Name]: gameState.tribeColors.tribe2Color,
      },
      tribes: {
        [gameState.playerTribe]: tribe1.map((name) => ({
          name,
          eliminated: newEliminated.includes(name),
        })),
        [gameState.opposingTribe]: tribe2.map((name) => ({
          name,
          eliminated: newEliminated.includes(name),
        })),
      },
      // NEW: App-generated choices
      choices: playerEliminated ? [] : choices.map(c => ({
        id: c.id,
        text: c.text,
      })),
      // NEW: Game over state
      gameOver: playerEliminated,
      gameOverReason: playerEliminated ? 'You have been voted out. The tribe has spoken.' : undefined,
    })
  } catch (error) {
    console.error('Scene generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate scene' },
      { status: 500 }
    )
  }
}
