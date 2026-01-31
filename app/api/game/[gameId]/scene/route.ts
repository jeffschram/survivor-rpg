import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import OpenAI from 'openai'
import {
  getDaySchedule,
  getCurrentScene,
  getSceneSequence,
  isImmunityDay,
  pick,
  MERGED_NAMES,
} from '@/lib/game-logic'

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

// Get active players from this game's tribes (not the full ALL_STARS pool)
function getActivePlayersFromGame(game: GameState): string[] {
  const allGamePlayers = [...game.tribes.tribe1, ...game.tribes.tribe2]
  return allGamePlayers.filter((p) => !game.eliminated.includes(p) && p !== game.playerName)
}

function buildPrompt(game: GameState, sceneDirective: string): string {
  const active = getActivePlayersFromGame(game)

  return `You are the Game Master for a Survivor RPG. The player competes against Survivor all-stars.

PLAYER: ${game.playerName}
LOCATION: ${game.location}
DAY: ${game.day}
PHASE: ${game.phase}
TRIBES: ${game.playerTribe} (player's tribe) vs ${game.opposingTribe}
${game.merged ? `MERGED TRIBE: ${game.mergedTribeName}` : ''}

ACTIVE ALL-STARS (${active.length}): ${active.join(', ')}
${game.eliminated.length ? `ELIMINATED: ${game.eliminated.join(', ')}` : ''}
${game.jury.length ? `JURY: ${game.jury.join(', ')}` : ''}

${sceneDirective}

RESPONSE FORMAT:
1. Scene title as a markdown heading (### Title Here)
2. Narrative: 1-2 SHORT paragraphs MAXIMUM. Be concise. No long descriptions.
3. Four choices labeled A) B) C) D) - one line each
4. End with SCENE_TYPE: [type] and optionally STAT_UPDATES: {...}

Always address the player as "you" not by name. Keep responses under 150 words.`
}

function getSceneDirective(game: GameState): string {
  const currentScene = getCurrentScene(
    game.day,
    game.sceneIndexInDay,
    game.lastChallengeWon ?? null
  )
  const dayData = getDaySchedule(game.day)
  const remaining = getActivePlayersFromGame(game).length + 1  // +1 for player

  const tribeInfo = game.merged
    ? `Merged tribe: ${game.mergedTribeName}. Individual game.`
    : `Tribes: ${game.playerTribe} vs ${game.opposingTribe}`

  // Special handling for Day 1 premiere
  if (game.day === 1 && game.sceneIndexInDay === 0) {
    return `SCENE TYPE: PREMIERE (Day 1)

This is the game premiere! Jeff Probst introduces Survivor: All-Stars in ${game.location}. The two tribes are formed: ${game.playerTribe} and ${game.opposingTribe}. 

Scene focus: ${currentScene.scene_description}

Introduce the all-star players dramatically. Set the stage for the season.
${remaining} contestants. ${tribeInfo}

SCENE_TYPE must be: ${currentScene.scene_type}`
  }

  // Challenge scenes
  if (currentScene.scene_type === 'challenge') {
    const isImmunity = isImmunityDay(game.day) || game.merged
    const challengeType = isImmunity ? 'IMMUNITY' : 'REWARD'

    const revealElimination = game.pendingOpposingElimination
      ? `\n\nIMPORTANT: As the tribes arrive, the player notices ${game.pendingOpposingElimination} is missing from the ${game.opposingTribe} tribe. They were voted out at the last Tribal Council. Mention this observation naturally.`
      : ''

    return `SCENE TYPE: ${challengeType} CHALLENGE (Day ${game.day})

Scene focus: ${currentScene.scene_description}

Generate ${game.merged ? 'an INDIVIDUAL' : 'a TRIBE'} ${challengeType} CHALLENGE. Describe the challenge setup and let the player choose their approach. Do NOT reveal the winner yet - that comes in the next scene.${revealElimination}

${remaining} players remain. ${tribeInfo}

SCENE_TYPE must be: challenge`
  }

  // Challenge results
  if (currentScene.scene_type === 'challenge_results') {
    const isImmunity = isImmunityDay(game.day) || game.merged
    const playerWins = Math.random() > 0.45

    if (!game.merged) {
      if (playerWins) {
        return `SCENE TYPE: CHALLENGE RESULTS - VICTORY (Day ${game.day})

Scene focus: ${currentScene.scene_description}

The ${game.playerTribe} tribe WINS ${isImmunity ? 'immunity' : 'the reward'}! Show the celebration and relief. The ${game.opposingTribe} tribe ${isImmunity ? 'must go to Tribal Council tonight' : 'gets nothing'}.

${isImmunity ? "The player won't see what happens at the other tribe's Tribal - they'll discover who was voted off at the next challenge." : ''}

SCENE_TYPE must be: challenge_results`
      } else {
        return `SCENE TYPE: CHALLENGE RESULTS - DEFEAT (Day ${game.day})

Scene focus: ${currentScene.scene_description}

The ${game.playerTribe} tribe LOSES. Show the disappointment. ${isImmunity ? 'They must go to Tribal Council tonight. Someone is going home.' : `The ${game.opposingTribe} tribe wins the reward.`}

SCENE_TYPE must be: challenge_results`
      }
    } else {
      if (playerWins) {
        return `SCENE TYPE: CHALLENGE RESULTS - PLAYER WINS IMMUNITY (Day ${game.day})

Scene focus: ${currentScene.scene_description}

The player WINS individual immunity! Show the victory moment as Jeff places the immunity necklace on them. They are safe tonight.

SCENE_TYPE must be: challenge_results`
      } else {
        const activePlayers = getActivePlayersFromGame(game)
        const winner = activePlayers[Math.floor(Math.random() * activePlayers.length)]
        return `SCENE TYPE: CHALLENGE RESULTS - ${winner.toUpperCase()} WINS (Day ${game.day})

Scene focus: ${currentScene.scene_description}

${winner} wins individual immunity! The player does not have immunity and could be voted out tonight.

SCENE_TYPE must be: challenge_results`
      }
    }
  }

  // Tribal council
  if (currentScene.scene_type === 'tribal') {
    return `SCENE TYPE: TRIBAL COUNCIL (Day ${game.day})

Scene focus: ${currentScene.scene_description}

Tribal Council. Jeff Probst asks probing questions. Tensions run high. The player must choose who to vote for.

Show the atmosphere, the conversations, Jeff's questions. Let the player make their voting choice. Do NOT reveal who goes home yet.

SCENE_TYPE must be: tribal`
  }

  // Tribal results
  if (currentScene.scene_type === 'tribal_results') {
    return `SCENE TYPE: TRIBAL RESULTS (Day ${game.day})

Scene focus: ${currentScene.scene_description}

The votes are read. Jeff reads them one by one, building tension. Someone's torch is snuffed.

Pick a logical elimination target (not the player unless they've made major strategic errors). Show the torch snuffing and "The tribe has spoken."

${remaining - 1} will remain after this vote.

SCENE_TYPE must be: tribal_results`
  }

  // Camp scenes - default
  return `SCENE TYPE: CAMP (Day ${game.day})

Scene focus: ${currentScene.scene_description}

${remaining} players remain. ${tribeInfo}
Game phase: ${dayData.game_phase}

SCENE_TYPE must be: camp`
}

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params
    const body = await request.json()

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

    console.log(`Day ${gameState.day} | Scene ${gameState.sceneIndexInDay} | route1* Type: ${currentScene.scene_type}`)
    console.log(`Description: ${currentScene.scene_description}`)

    const sceneDirective = getSceneDirective(gameState)
    const systemPrompt = buildPrompt(gameState, sceneDirective)

    // Build messages for OpenAI
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...gameState.history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // Add user input if provided
    if (body.userInput) {
      messages.push({ role: 'user', content: body.userInput })
    } else {
      messages.push({
        role: 'user',
        content: `[GM Note: Generate the next ${currentScene.scene_type.toUpperCase()} scene.]`,
      })
    }

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.85,
      max_tokens: 300,
    })

    const rawMessage = response.choices[0]?.message?.content || ''

    // Parse scene type from response
    const sceneTypeMatch = rawMessage.match(/SCENE_TYPE:\s*(\w+)/i)
    const sceneType = sceneTypeMatch ? sceneTypeMatch[1].toLowerCase() : currentScene.scene_type

    // Parse stat updates
    const statMatch = rawMessage.match(/STAT_UPDATES:\s*(\{[^}]+\})/i)
    let statUpdates: Record<string, number> = {}
    if (statMatch) {
      try {
        statUpdates = JSON.parse(statMatch[1])
      } catch {
        // Ignore parse errors
      }
    }

    // Update stats
    const newStats = { ...gameState.stats }
    for (const [key, value] of Object.entries(statUpdates)) {
      if (key in newStats && typeof value === 'number') {
        newStats[key as keyof typeof newStats] = Math.max(
          1,
          Math.min(5, newStats[key as keyof typeof newStats] + value)
        )
      }
    }

    // Determine challenge outcome for challenge_results scenes
    let challengeWon: boolean | undefined = undefined
    if (sceneType === 'challenge_results') {
      challengeWon = rawMessage.toLowerCase().includes('win') || 
                     rawMessage.toLowerCase().includes('victory')
    }

    // Calculate new scene index and day
    let newSceneIndexInDay = gameState.sceneIndexInDay + 1
    let newDay = gameState.day
    let newMerged = gameState.merged
    let newMergedTribeName = gameState.mergedTribeName
    let newPhase = gameState.phase

    const sequence = getSceneSequence(gameState.day, challengeWon ?? gameState.lastChallengeWon ?? null)

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

    // Handle pending eliminations
    let newPendingElimination = gameState.pendingOpposingElimination
    let newEliminated = [...gameState.eliminated]
    const tribe1 = [...gameState.tribes.tribe1]
    const tribe2 = [...gameState.tribes.tribe2]

    // If challenge scene and there's a pending elimination, reveal and eliminate
    if (sceneType === 'challenge' && gameState.pendingOpposingElimination) {
      newEliminated.push(gameState.pendingOpposingElimination)
      const idx = tribe2.indexOf(gameState.pendingOpposingElimination)
      if (idx !== -1) tribe2.splice(idx, 1)
      newPendingElimination = undefined
    }

    // If player won immunity, mark random opposing member for elimination
    if (sceneType === 'challenge_results' && challengeWon && !gameState.merged && isImmunityDay(gameState.day)) {
      if (tribe2.length > 0 && !newPendingElimination) {
        const eliminated = tribe2[Math.floor(Math.random() * tribe2.length)]
        newPendingElimination = eliminated
        console.log(`[PENDING ELIMINATION] ${eliminated} from opposing tribe`)
      }
    }

    // Update history
    const newHistory = [...gameState.history]
    if (body.userInput) {
      newHistory.push({ role: 'user', content: body.userInput })
    }
    newHistory.push({ role: 'assistant', content: rawMessage })

    // Update game in Convex
    await convex.mutation(api.games.updateGame, {
      gameId,
      updates: {
        sceneCount: gameState.sceneCount + 1,
        sceneIndexInDay: newSceneIndexInDay,
        day: newDay,
        lastSceneType: sceneType,
        lastChallengeWon: challengeWon ?? gameState.lastChallengeWon,
        pendingOpposingElimination: newPendingElimination,
        eliminated: newEliminated,
        merged: newMerged,
        mergedTribeName: newMergedTribeName,
        phase: newPhase,
        stats: newStats,
        tribes: { tribe1, tribe2 },
        history: newHistory,
      },
    })

    // Clean message for display
    const cleanMessage = rawMessage
      .replace(/SCENE_TYPE:\s*\w+/gi, '')
      .replace(/STAT_UPDATES:\s*\{[^}]+\}/gi, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim()

    return NextResponse.json({
      message: cleanMessage,
      sceneType,
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
    })
  } catch (error) {
    console.error('Scene generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate scene' },
      { status: 500 }
    )
  }
}
