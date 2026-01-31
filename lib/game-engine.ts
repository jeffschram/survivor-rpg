/**
 * Game Engine - All deterministic game logic
 * The AI only generates narrative text based on the outcomes determined here.
 */

import { SceneType, pick, shuffle, isImmunityDay } from './game-logic'

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerStats {
  Social: number
  Strategy: number
  Challenge: number
  Threat: number
}

export interface Choice {
  id: string
  text: string
  effects: Partial<PlayerStats>
  relationshipEffect?: { target: 'random' | 'ally' | 'rival', change: number }
}

export interface ChallengeOutcome {
  playerTribeWins: boolean
  margin: 'dominant' | 'close' | 'narrow'
  playerPerformance: 'poor' | 'average' | 'good' | 'excellent'
  mvp?: string  // Most valuable player in the challenge
}

export interface TribalOutcome {
  eliminated: string
  voteCounts: { [player: string]: number }
  wasBlindside: boolean
  idolPlayed?: string
}

export interface SceneContext {
  sceneType: SceneType
  day: number
  phase: 'pre-merge' | 'merged'
  playerTribe: string
  opposingTribe: string
  tribeMembers: string[]
  opposingMembers: string[]
  playerStats: PlayerStats
  eliminated: string[]
  // Dynamic context based on player's last choice
  lastChoice?: Choice
  challengeOutcome?: ChallengeOutcome
  tribalOutcome?: TribalOutcome
  pendingReveal?: string  // Player eliminated from opposing tribe to reveal
}

export interface NarrativeFacts {
  situation: string[]
  characters: string[]
  outcomes: string[]
}

// ============================================================================
// CHOICE TEMPLATES
// ============================================================================

export const CHOICE_TEMPLATES: Record<string, Choice[]> = {
  // Day 1 - Game intro
  'camp_intro': [
    { 
      id: 'strong_alliance', 
      text: 'Approach the biggest physical threats to form an early alliance',
      effects: { Strategy: 1, Threat: 1 },
      relationshipEffect: { target: 'random', change: 2 }
    },
    { 
      id: 'social_bonds', 
      text: 'Focus on building genuine connections with everyone',
      effects: { Social: 1 },
      relationshipEffect: { target: 'random', change: 1 }
    },
    { 
      id: 'camp_work', 
      text: 'Take charge of building shelter and starting fire',
      effects: { Challenge: 1 },
    },
    { 
      id: 'observe', 
      text: 'Hang back and observe the dynamics forming',
      effects: { Strategy: 1, Threat: -1 },
    }
  ],

  // Early camp scenes (Days 1-10)
  'camp_early': [
    { 
      id: 'form_alliance', 
      text: 'Pull someone aside to discuss forming a tight alliance',
      effects: { Strategy: 1, Social: 1 },
      relationshipEffect: { target: 'random', change: 2 }
    },
    { 
      id: 'gather_info', 
      text: 'Casually try to find out what others are thinking',
      effects: { Strategy: 1 },
    },
    { 
      id: 'work_around_camp', 
      text: 'Help around camp to build goodwill',
      effects: { Social: 1, Threat: -1 },
    },
    { 
      id: 'rest_conserve', 
      text: 'Rest and conserve energy for challenges',
      effects: { Challenge: 1 },
    }
  ],

  // Camp scenes during mid-game (Days 11-24)
  'camp_mid': [
    { 
      id: 'solidify_alliance', 
      text: 'Meet with your allies to confirm voting plans',
      effects: { Strategy: 1 },
      relationshipEffect: { target: 'ally', change: 1 }
    },
    { 
      id: 'flip_target', 
      text: 'Consider flipping on your alliance for a better position',
      effects: { Strategy: 2, Social: -1 },
    },
    { 
      id: 'idol_hunt', 
      text: 'Sneak away to search for a hidden immunity idol',
      effects: { Strategy: 1, Threat: 1 },
    },
    { 
      id: 'stay_calm', 
      text: 'Keep things calm and avoid making waves',
      effects: { Social: 1, Threat: -1 },
    }
  ],

  // Camp scenes during endgame (Days 25+)
  'camp_late': [
    { 
      id: 'resume_pitch', 
      text: 'Start building your case for why you deserve to win',
      effects: { Social: 1, Strategy: 1 },
    },
    { 
      id: 'cut_threat', 
      text: 'Campaign to vote out the biggest threat',
      effects: { Strategy: 1, Threat: 1 },
    },
    { 
      id: 'goat_strategy', 
      text: 'Position yourself next to players the jury dislikes',
      effects: { Strategy: 2, Social: -1 },
    },
    { 
      id: 'immunity_focus', 
      text: 'Focus entirely on winning the next immunity challenge',
      effects: { Challenge: 1 },
    }
  ],

  // Challenge scenes
  'challenge': [
    { 
      id: 'all_out', 
      text: 'Give it everything you have - go all out',
      effects: { Challenge: 1, Threat: 1 },
    },
    { 
      id: 'steady_pace', 
      text: 'Pace yourself and stay focused',
      effects: { Challenge: 1 },
    },
    { 
      id: 'strategic_effort', 
      text: 'Contribute but let others shine',
      effects: { Threat: -1 },
    },
    { 
      id: 'throw_challenge', 
      text: 'Subtly throw the challenge to change tribal dynamics',
      effects: { Strategy: 1, Social: -1 },
    }
  ],

  // Challenge results (win)
  'challenge_results_win': [
    { 
      id: 'celebrate_humble', 
      text: 'Celebrate with your tribe but stay humble',
      effects: { Social: 1 },
    },
    { 
      id: 'celebrate_big', 
      text: 'Celebrate loudly - you earned this',
      effects: { Challenge: 1, Social: -1 },
    },
    { 
      id: 'comfort_losers', 
      text: 'Show good sportsmanship to the losing tribe',
      effects: { Social: 1, Threat: -1 },
    },
    { 
      id: 'strategize', 
      text: 'Immediately start strategizing for what comes next',
      effects: { Strategy: 1 },
    }
  ],

  // Challenge results (loss)
  'challenge_results_loss': [
    { 
      id: 'accept_gracefully', 
      text: 'Accept the loss gracefully and regroup',
      effects: { Social: 1 },
    },
    { 
      id: 'blame_others', 
      text: 'Point out who cost you the challenge',
      effects: { Strategy: 1, Social: -1 },
    },
    { 
      id: 'target_weak', 
      text: 'Suggest voting out whoever performed worst',
      effects: { Strategy: 1 },
    },
    { 
      id: 'scramble', 
      text: 'Start scrambling to make sure you\'re safe',
      effects: { Strategy: 1, Threat: 1 },
    }
  ],

  // Pre-tribal council
  'tribal_prep': [
    { 
      id: 'stick_plan', 
      text: 'Confirm the voting plan with your allies',
      effects: { Strategy: 1 },
      relationshipEffect: { target: 'ally', change: 1 }
    },
    { 
      id: 'last_minute_flip', 
      text: 'Consider a last-minute flip to the other side',
      effects: { Strategy: 2, Social: -2 },
    },
    { 
      id: 'play_both_sides', 
      text: 'Tell both sides what they want to hear',
      effects: { Strategy: 1, Social: -1 },
    },
    { 
      id: 'lay_low', 
      text: 'Stay quiet and let others seal their fate',
      effects: { Threat: -1 },
    }
  ],

  // At tribal council
  'tribal': [
    { 
      id: 'honest_answers', 
      text: 'Answer Jeff\'s questions honestly',
      effects: { Social: 1 },
    },
    { 
      id: 'deflect', 
      text: 'Deflect attention onto someone else',
      effects: { Strategy: 1, Social: -1 },
    },
    { 
      id: 'stay_quiet', 
      text: 'Give short answers and avoid the spotlight',
      effects: { Threat: -1 },
    },
    { 
      id: 'play_idol', 
      text: 'Play your hidden immunity idol (if you have one)',
      effects: { Strategy: 1, Threat: 1 },
    }
  ],

  // Tribal results
  'tribal_results': [
    { 
      id: 'gracious', 
      text: 'Be gracious as the votes are read',
      effects: { Social: 1 },
    },
    { 
      id: 'relieved', 
      text: 'Show visible relief that you survived',
      effects: { },
    },
    { 
      id: 'poker_face', 
      text: 'Keep a poker face regardless of the outcome',
      effects: { Strategy: 1 },
    },
    { 
      id: 'comfort_eliminated', 
      text: 'Give the eliminated player a heartfelt goodbye',
      effects: { Social: 1 },
    }
  ],

  // Post-merge individual immunity
  'challenge_individual': [
    { 
      id: 'win_immunity', 
      text: 'Do whatever it takes to win immunity',
      effects: { Challenge: 1, Threat: 1 },
    },
    { 
      id: 'try_best', 
      text: 'Try your best but don\'t burn yourself out',
      effects: { Challenge: 1 },
    },
    { 
      id: 'strategic_loss', 
      text: 'Let someone else win to keep your threat level low',
      effects: { Threat: -1, Strategy: 1 },
    },
    { 
      id: 'observe_others', 
      text: 'Use the challenge to observe your competitors',
      effects: { Strategy: 1 },
    }
  ],

  // Final tribal council
  'tribal_final': [
    { 
      id: 'own_game', 
      text: 'Own every move you made and explain your strategy',
      effects: { Strategy: 1 },
    },
    { 
      id: 'apologetic', 
      text: 'Apologize for the moves that hurt people',
      effects: { Social: 1 },
    },
    { 
      id: 'attack_opponents', 
      text: 'Point out why the other finalists don\'t deserve to win',
      effects: { Strategy: 1, Social: -1 },
    },
    { 
      id: 'humble_plea', 
      text: 'Make a humble plea about what winning would mean to you',
      effects: { Social: 1 },
    }
  ]
}

// ============================================================================
// GAME ENGINE FUNCTIONS
// ============================================================================

/**
 * Get appropriate choices for the current scene
 */
export function getChoicesForScene(context: SceneContext): Choice[] {
  const { sceneType, day, phase, challengeOutcome } = context
  
  // Determine which choice template to use
  let templateKey: string

  switch (sceneType) {
    case 'camp':
      if (day === 1) {
        templateKey = 'camp_intro'
      } else if (day < 11) {
        templateKey = 'camp_early'
      } else if (phase === 'pre-merge') {
        templateKey = 'camp_mid'
      } else {
        templateKey = 'camp_late'
      }
      break

    case 'challenge':
      templateKey = phase === 'merged' ? 'challenge_individual' : 'challenge'
      break

    case 'challenge_results':
      templateKey = challengeOutcome?.playerTribeWins 
        ? 'challenge_results_win' 
        : 'challenge_results_loss'
      break

    case 'tribal':
      if (day === 39) {
        templateKey = 'tribal_final'
      } else {
        templateKey = 'tribal'
      }
      break

    case 'tribal_results':
      templateKey = 'tribal_results'
      break

    default:
      templateKey = 'camp_early'
  }

  const choices = CHOICE_TEMPLATES[templateKey] || CHOICE_TEMPLATES['camp_early']
  
  // Customize choices with character names from context
  return customizeChoices(choices, context)
}

/**
 * Customize generic choices with actual player names and context
 */
function customizeChoices(choices: Choice[], context: SceneContext): Choice[] {
  const { tribeMembers, opposingMembers } = context
  
  return choices.map(choice => {
    let text = choice.text
    
    // Replace placeholders with actual names
    if (text.includes('someone')) {
      const target = pick(tribeMembers)
      text = text.replace('someone', target)
    }
    
    return { ...choice, text }
  })
}

/**
 * Determine challenge outcome based on player stats and tribe composition
 */
export function determineChallengeOutcome(
  playerStats: PlayerStats,
  playerTribeName: string,
  playerTribeMembers: string[],
  opposingTribeMembers: string[],
  phase: 'pre-merge' | 'merged'
): ChallengeOutcome {
  // Base win chance
  let winChance = 0.45
  
  // Player's Challenge stat affects outcome (0-5 scale, each point = +5%)
  winChance += (playerStats.Challenge - 3) * 0.05
  
  // Tribe size advantage (pre-merge only)
  if (phase === 'pre-merge') {
    const sizeDiff = playerTribeMembers.length - opposingTribeMembers.length
    winChance += sizeDiff * 0.05
  }
  
  // Clamp between 25% and 75%
  winChance = Math.max(0.25, Math.min(0.75, winChance))
  
  const playerTribeWins = Math.random() < winChance
  
  // Determine margin based on roll
  const marginRoll = Math.random()
  let margin: 'dominant' | 'close' | 'narrow'
  if (marginRoll < 0.2) margin = 'dominant'
  else if (marginRoll < 0.6) margin = 'close'
  else margin = 'narrow'
  
  // Player performance based on their Challenge stat
  const perfRoll = Math.random() + (playerStats.Challenge / 10)
  let playerPerformance: 'poor' | 'average' | 'good' | 'excellent'
  if (perfRoll < 0.3) playerPerformance = 'poor'
  else if (perfRoll < 0.6) playerPerformance = 'average'
  else if (perfRoll < 0.85) playerPerformance = 'good'
  else playerPerformance = 'excellent'
  
  // MVP (random from winning tribe, or player if excellent performance)
  let mvp: string | undefined
  if (playerPerformance === 'excellent' && playerTribeWins) {
    mvp = 'you'
  } else if (playerTribeWins && playerTribeMembers.length > 0) {
    mvp = pick(playerTribeMembers)
  } else if (!playerTribeWins && opposingTribeMembers.length > 0) {
    mvp = pick(opposingTribeMembers)
  }
  
  return {
    playerTribeWins,
    margin,
    playerPerformance,
    mvp
  }
}

/**
 * Determine who gets eliminated at tribal council
 */
export function determineTribalOutcome(
  tribeMembers: string[],
  playerStats: PlayerStats,
  isPlayerTribe: boolean
): TribalOutcome {
  if (!isPlayerTribe) {
    // Opposing tribe - random elimination (player doesn't see voting)
    const eliminated = pick(tribeMembers)
    return {
      eliminated,
      voteCounts: { [eliminated]: tribeMembers.length - 1 },
      wasBlindside: Math.random() > 0.7
    }
  }
  
  // Player's tribe - weight by threat level and inverse of social
  // Players with high threat and low social are more likely to go
  const weights: { member: string; weight: number }[] = tribeMembers.map(member => {
    let weight = 1
    // The player has stats, NPCs are randomized
    // For now, use random weights for NPCs
    weight += Math.random() * 2
    return { member, weight }
  })
  
  // Player's own risk based on their stats
  // High threat = more risk, high social = less risk
  const playerWeight = 1 + (playerStats.Threat / 5) - (playerStats.Social / 10)
  
  // 20% base chance player could be eliminated, modified by stats
  const playerEliminated = Math.random() < Math.min(0.3, Math.max(0.05, playerWeight * 0.1))
  
  if (playerEliminated) {
    return {
      eliminated: 'PLAYER',
      voteCounts: { 'PLAYER': Math.ceil(tribeMembers.length / 2) },
      wasBlindside: true
    }
  }
  
  // Otherwise, eliminate weighted random NPC
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
  let roll = Math.random() * totalWeight
  
  for (const { member, weight } of weights) {
    roll -= weight
    if (roll <= 0) {
      const votes = Math.ceil(tribeMembers.length / 2) + Math.floor(Math.random() * 2)
      return {
        eliminated: member,
        voteCounts: { [member]: votes },
        wasBlindside: Math.random() > 0.6
      }
    }
  }
  
  // Fallback
  const eliminated = pick(tribeMembers)
  return {
    eliminated,
    voteCounts: { [eliminated]: Math.ceil(tribeMembers.length / 2) },
    wasBlindside: false
  }
}

/**
 * Apply stat effects from a choice
 */
export function applyStatEffects(
  currentStats: PlayerStats,
  effects: Partial<PlayerStats>
): PlayerStats {
  const newStats = { ...currentStats }
  
  for (const [key, value] of Object.entries(effects)) {
    if (key in newStats && typeof value === 'number') {
      const statKey = key as keyof PlayerStats
      // Stats are clamped between 1 and 5
      newStats[statKey] = Math.max(1, Math.min(5, newStats[statKey] + value))
    }
  }
  
  return newStats
}

/**
 * Build narrative facts for the AI prompt based on scene context
 */
export function buildNarrativeFacts(context: SceneContext): NarrativeFacts {
  const facts: NarrativeFacts = {
    situation: [],
    characters: [],
    outcomes: []
  }
  
  const { sceneType, day, playerTribe, opposingTribe, tribeMembers, opposingMembers, lastChoice, challengeOutcome, tribalOutcome, pendingReveal } = context
  
  // Base situation
  facts.situation.push(`Day ${day} in ${context.phase === 'merged' ? 'the merged tribe' : `the ${playerTribe} camp`}`)
  
  // Scene-specific facts
  switch (sceneType) {
    case 'camp':
      if (day === 1) {
        facts.situation.push('This is the premiere - tribes have just been formed')
        facts.situation.push(`The player's tribe is ${playerTribe}. The opposing tribe is ${opposingTribe}.`)
      }
      if (lastChoice) {
        facts.outcomes.push(`The player chose to: ${lastChoice.text}`)
        // Describe effect narratively
        const effectDesc = describeStatEffects(lastChoice.effects)
        if (effectDesc) facts.outcomes.push(effectDesc)
      }
      break
      
    case 'challenge':
      facts.situation.push(`It's time for a ${isImmunityDay(day) ? 'immunity' : 'reward'} challenge`)
      if (pendingReveal) {
        facts.situation.push(`As tribes arrive, the player notices ${pendingReveal} is missing from ${opposingTribe} - they were voted out`)
      }
      if (lastChoice) {
        facts.outcomes.push(`The player's strategy: ${lastChoice.text}`)
      }
      break
      
    case 'challenge_results':
      if (challengeOutcome) {
        const winner = challengeOutcome.playerTribeWins ? playerTribe : opposingTribe
        facts.outcomes.push(`${winner} WINS the challenge!`)
        facts.outcomes.push(`Victory margin: ${challengeOutcome.margin}`)
        facts.outcomes.push(`The player performed ${challengeOutcome.playerPerformance}ly`)
        if (challengeOutcome.mvp) {
          facts.outcomes.push(`MVP of the challenge: ${challengeOutcome.mvp}`)
        }
        if (!challengeOutcome.playerTribeWins && isImmunityDay(day)) {
          facts.outcomes.push(`${playerTribe} must go to Tribal Council tonight`)
        }
      }
      break
      
    case 'tribal':
      facts.situation.push('Tribal Council begins - someone is going home')
      facts.characters.push(`Remaining tribe members: ${tribeMembers.join(', ')}`)
      break
      
    case 'tribal_results':
      if (tribalOutcome) {
        if (tribalOutcome.eliminated === 'PLAYER') {
          facts.outcomes.push('THE PLAYER HAS BEEN VOTED OUT')
          facts.outcomes.push('The tribe has spoken. The player\'s torch is snuffed.')
        } else {
          facts.outcomes.push(`${tribalOutcome.eliminated} has been voted out`)
          const votes = Object.values(tribalOutcome.voteCounts)[0]
          facts.outcomes.push(`Vote count: ${votes} votes against ${tribalOutcome.eliminated}`)
          if (tribalOutcome.wasBlindside) {
            facts.outcomes.push('It was a blindside - they never saw it coming')
          }
        }
      }
      break
  }
  
  // Add key characters
  if (tribeMembers.length > 0) {
    const featured = shuffle(tribeMembers).slice(0, 3)
    facts.characters.push(`Key tribemates to feature: ${featured.join(', ')}`)
  }
  
  return facts
}

/**
 * Describe stat effects in narrative form
 */
function describeStatEffects(effects: Partial<PlayerStats>): string {
  const descriptions: string[] = []
  
  if (effects.Social && effects.Social > 0) descriptions.push('improved social standing')
  if (effects.Social && effects.Social < 0) descriptions.push('strained some relationships')
  if (effects.Strategy && effects.Strategy > 0) descriptions.push('demonstrated strategic thinking')
  if (effects.Challenge && effects.Challenge > 0) descriptions.push('showed physical prowess')
  if (effects.Threat && effects.Threat > 0) descriptions.push('raised their threat level')
  if (effects.Threat && effects.Threat < 0) descriptions.push('stayed under the radar')
  
  if (descriptions.length === 0) return ''
  return `This ${descriptions.join(' and ')}.`
}

/**
 * Build the simplified AI prompt for narrative generation
 */
export function buildNarrativePrompt(
  context: SceneContext,
  facts: NarrativeFacts,
  location: string
): string {
  const sceneEmoji: Record<SceneType, string> = {
    'camp': '🏕️',
    'challenge': '🏆',
    'challenge_results': '🏆',
    'tribal': '🔥',
    'tribal_results': '🔥'
  }
  
  return `You are the narrator for a Survivor reality TV game. Write an immersive scene.

LOCATION: ${location}
DAY: ${context.day}
SCENE TYPE: ${sceneEmoji[context.sceneType]} ${context.sceneType.toUpperCase()}

SITUATION:
${facts.situation.map(s => `- ${s}`).join('\n')}

${facts.characters.length > 0 ? `CHARACTERS TO FEATURE:\n${facts.characters.map(c => `- ${c}`).join('\n')}\n` : ''}
${facts.outcomes.length > 0 ? `WHAT HAPPENS:\n${facts.outcomes.map(o => `- ${o}`).join('\n')}\n` : ''}

INSTRUCTIONS:
- Write 2-3 short paragraphs
- Use "you" for the player (second person)
- Include dialogue from other characters
- Start with a scene title using ###
- Be dramatic and immersive
- DO NOT include choices - those will be added separately
- DO NOT mention stats or game mechanics`
}
