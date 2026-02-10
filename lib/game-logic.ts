// Game constants and logic

export const LOCATIONS = [
  "the brutal savannas of Kenya",
  "the ancient ruins and jungles of Cambodia",
  "the storm-lashed beaches of the Marquesas",
  "the scorching outback of Australia",
  "the misty highlands and rice terraces of China",
  "the reef-ringed islands of Palau",
  "the cyclone-prone shores of Fiji",
  "the volcanic highlands of Iceland",
  "the Patagonian fjords of southern Chile",
]

export const TRIBE_NAMES = [
  "Koru", "Naru", "Solari", "Vanta", "Aroa", "Kael", "Maru", "Sable", "Kiri", "Tika"
]

export const TRIBE_COLORS = [
  "#840404",  // dark red
  "#207D07",  // dark green
  "#0C5F9E",  // dark blue
  "#7B067F",  // dark purple
  "#AF6C0F"   // dark orange
]

export const MERGED_NAMES = ["Aegis", "Horizon", "Crescent", "Ember", "Nova"]

export const ALL_STARS = [
  "Boston Rob", "Parvati", "Sandra", "Tony", "Kim", "Cirie", "Tyson",
  "Jeremy", "Sarah", "Yul", "Malcolm", "Andrea", "Wentworth", "Aubry",
  "Natalie Anderson", "Ozzy", "Cochran", "Rupert", "Russell Hantz",
  "Rob Cesternino", "Stephenie LaGrossa", "Jerri", "Coach",
  "Amanda", "James", "Colby", "Richard Hatch",
  "Ethan Zohn", "Big Tom"
]

export type SceneType = 
  | 'camp' 
  | 'reward_challenge' 
  | 'reward_challenge_results' 
  | 'immunity_challenge' 
  | 'immunity_challenge_results' 
  | 'tribal' 
  | 'tribal_results'

export interface Scene {
  scene_type: SceneType
  scene_description: string
}

export interface DaySchedule {
  day: number
  scenes: Scene[]
  on_win?: Scene[]  // Additional scenes if player won immunity
  on_loss?: Scene[] // Additional scenes if player lost immunity
}

export interface EpisodeSchedule {
  episode: number
  contestants: number
  game_phase: 'pre-merge' | 'merged'
  days: DaySchedule[]
}

// ============================================================================
// EPISODE SCHEDULES (13 episodes, 3 days each = 39 days)
// ============================================================================

export const EPISODE_SCHEDULES: Record<number, EpisodeSchedule> = {
  // ============================================================================
  // PRE-MERGE: Episodes 1-6 (18 → 12 players)
  // ============================================================================
  
  1: {
    episode: 1,
    contestants: 18,
    game_phase: "pre-merge",
    days: [
      {
        day: 1,
        scenes: [
          { scene_type: "camp", scene_description: "Welcome to Survivor! Jeff Probst introduces the castaways, tribes are formed, and the game begins" },
        ]
      },
      {
        day: 2,
        scenes: [
          { scene_type: "camp", scene_description: "First full day at camp — shelter building, early bonds, first impressions matter" },
        ]
      },
      {
        day: 3,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "First tribe immunity challenge — prove your tribe's strength" },
          { scene_type: "immunity_challenge_results", scene_description: "Immunity results — one tribe is safe, one faces tribal council" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Victory! Your tribe celebrates being safe from the first vote" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "First Tribal Council — someone becomes the first person voted out" },
          { scene_type: "tribal_results", scene_description: "The votes are read, the first castaway is eliminated" }
        ]
      }
    ]
  },

  2: {
    episode: 2,
    contestants: 17,
    game_phase: "pre-merge",
    days: [
      {
        day: 4,
        scenes: [
          { scene_type: "camp", scene_description: "Morning after tribal — alliances form and fracture, who can you trust?" },
        ]
      },
      {
        day: 5,
        scenes: [
          { scene_type: "camp", scene_description: "Camp life continues — food is scarce, tempers are short" },
        ]
      },
      {
        day: 6,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "Tribe immunity challenge — a test of teamwork and endurance" },
          { scene_type: "immunity_challenge_results", scene_description: "Immunity results" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Safe again! But cracks in the alliance are starting to show" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "Tribal Council — tensions run high as names are thrown around" },
          { scene_type: "tribal_results", scene_description: "Another torch is snuffed" }
        ]
      }
    ]
  },

  3: {
    episode: 3,
    contestants: 16,
    game_phase: "pre-merge",
    days: [
      {
        day: 7,
        scenes: [
          { scene_type: "camp", scene_description: "One week in — exhaustion sets in, conflicts arise over camp duties" },
        ]
      },
      {
        day: 8,
        scenes: [
          { scene_type: "reward_challenge", scene_description: "Reward challenge — compete for comfort items" },
          { scene_type: "reward_challenge_results", scene_description: "Reward results" },
        ]
      },
      {
        day: 9,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "Tribe immunity challenge — puzzle solving under pressure" },
          { scene_type: "immunity_challenge_results", scene_description: "Immunity results" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Three wins in a row? Your tribe is dominating" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "Tribal Council — the blame game begins" },
          { scene_type: "tribal_results", scene_description: "The tribe has spoken" }
        ]
      }
    ]
  },

  4: {
    episode: 4,
    contestants: 15,
    game_phase: "pre-merge",
    days: [
      {
        day: 10,
        scenes: [
          { scene_type: "camp", scene_description: "Strategic positioning — merge rumors are swirling" },
        ]
      },
      {
        day: 11,
        scenes: [
          { scene_type: "camp", scene_description: "Idol hunting — everyone's searching the jungle" },
        ]
      },
      {
        day: 12,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "Tribe immunity challenge — physical strength meets strategy" },
          { scene_type: "immunity_challenge_results", scene_description: "Immunity results" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Immunity secured — time to think about post-merge positioning" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "Tribal Council — a potential blindside brewing?" },
          { scene_type: "tribal_results", scene_description: "Blindside or straightforward vote?" }
        ]
      }
    ]
  },

  5: {
    episode: 5,
    contestants: 14,
    game_phase: "pre-merge",
    days: [
      {
        day: 13,
        scenes: [
          { scene_type: "camp", scene_description: "The game intensifies — paranoia runs rampant" },
        ]
      },
      {
        day: 14,
        scenes: [
          { scene_type: "camp", scene_description: "A storm hits camp — morale is tested" },
        ]
      },
      {
        day: 15,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "Tribe immunity challenge — water-based competition" },
          { scene_type: "immunity_challenge_results", scene_description: "Immunity results" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Safe! One more immunity before the merge?" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "Tribal Council — desperation plays" },
          { scene_type: "tribal_results", scene_description: "Another goes home" }
        ]
      }
    ]
  },

  6: {
    episode: 6,
    contestants: 13,
    game_phase: "pre-merge",
    days: [
      {
        day: 16,
        scenes: [
          { scene_type: "camp", scene_description: "Final pre-merge episode — everyone is positioning for the merge" },
        ]
      },
      {
        day: 17,
        scenes: [
          { scene_type: "camp", scene_description: "Last day as separate tribes — who will you take to the merge?" },
        ]
      },
      {
        day: 18,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "Final tribe immunity challenge — winner enters merge with numbers" },
          { scene_type: "immunity_challenge_results", scene_description: "Immunity results — last tribal challenge" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Entering the merge with numbers advantage — powerful position" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "Tribal Council — final pre-merge vote" },
          { scene_type: "tribal_results", scene_description: "One more eliminated before merge" }
        ]
      }
    ]
  },

  // ============================================================================
  // MERGE: Episode 7 (12 players become one tribe)
  // ============================================================================

  7: {
    episode: 7,
    contestants: 12,
    game_phase: "merged",
    days: [
      {
        day: 19,
        scenes: [
          { scene_type: "camp", scene_description: "THE MERGE! Tribes combine into one — feast, new buffs, a new tribe name" },
        ]
      },
      {
        day: 20,
        scenes: [
          { scene_type: "camp", scene_description: "Individual game begins — old tribal lines blur, new alliances form" },
        ]
      },
      {
        day: 21,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "First individual immunity challenge — everyone for themselves" },
          { scene_type: "immunity_challenge_results", scene_description: "Individual immunity results" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Immunity necklace is yours — you control the first merge vote" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "First merged Tribal Council — the biggest target usually goes" },
          { scene_type: "tribal_results", scene_description: "The first jury member is born" }
        ]
      }
    ]
  },

  // ============================================================================
  // POST-MERGE: Episodes 8-12 (Individual immunity, building the jury)
  // ============================================================================

  8: {
    episode: 8,
    contestants: 11,
    game_phase: "merged",
    days: [
      {
        day: 22,
        scenes: [
          { scene_type: "camp", scene_description: "Post-merge dynamics — voting blocs shift constantly" },
        ]
      },
      {
        day: 23,
        scenes: [
          { scene_type: "reward_challenge", scene_description: "Reward challenge — a chance for an advantage" },
          { scene_type: "reward_challenge_results", scene_description: "Reward results" },
        ]
      },
      {
        day: 24,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "Individual immunity challenge — endurance test" },
          { scene_type: "immunity_challenge_results", scene_description: "Immunity results" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Safe with immunity — time to orchestrate the vote" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "Tribal Council — whispers and live tribals" },
          { scene_type: "tribal_results", scene_description: "Another joins the jury" }
        ]
      }
    ]
  },

  9: {
    episode: 9,
    contestants: 10,
    game_phase: "merged",
    days: [
      {
        day: 25,
        scenes: [
          { scene_type: "camp", scene_description: "Final 10 — resume building begins in earnest" },
        ]
      },
      {
        day: 26,
        scenes: [
          { scene_type: "camp", scene_description: "Strategy sessions — who are you really with?" },
        ]
      },
      {
        day: 27,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "Individual immunity challenge — balance and focus" },
          { scene_type: "immunity_challenge_results", scene_description: "Immunity results" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Immunity streak! Becoming a challenge threat" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "Tribal Council — voting out threats or goats?" },
          { scene_type: "tribal_results", scene_description: "The jury grows" }
        ]
      }
    ]
  },

  10: {
    episode: 10,
    contestants: 9,
    game_phase: "merged",
    days: [
      {
        day: 28,
        scenes: [
          { scene_type: "camp", scene_description: "Final 9 — the endgame is approaching fast" },
        ]
      },
      {
        day: 29,
        scenes: [
          { scene_type: "reward_challenge", scene_description: "Reward challenge — loved ones visit!" },
          { scene_type: "reward_challenge_results", scene_description: "Emotional reward results" },
        ]
      },
      {
        day: 30,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "Individual immunity challenge" },
          { scene_type: "immunity_challenge_results", scene_description: "Immunity results" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Safe! Playing a winning game" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "Tribal Council — big moves or safe play?" },
          { scene_type: "tribal_results", scene_description: "The vote is read" }
        ]
      }
    ]
  },

  11: {
    episode: 11,
    contestants: 7,
    game_phase: "merged",
    days: [
      {
        day: 31,
        scenes: [
          { scene_type: "camp", scene_description: "Final 7 — every vote is critical now" },
        ]
      },
      {
        day: 32,
        scenes: [
          { scene_type: "camp", scene_description: "Scrambling intensifies — side deals everywhere" },
        ]
      },
      {
        day: 33,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "Individual immunity challenge — mental and physical" },
          { scene_type: "immunity_challenge_results", scene_description: "Immunity results" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Immunity when you need it most" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "Tribal Council — the game accelerates" },
          { scene_type: "tribal_results", scene_description: "Down to final 6" }
        ]
      }
    ]
  },

  12: {
    episode: 12,
    contestants: 5,
    game_phase: "merged",
    days: [
      {
        day: 34,
        scenes: [
          { scene_type: "camp", scene_description: "Final 5 — fire-making practice begins" },
        ]
      },
      {
        day: 35,
        scenes: [
          { scene_type: "camp", scene_description: "Preparing for final tribal — crafting your story" },
        ]
      },
      {
        day: 36,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "Crucial immunity challenge — final 5" },
          { scene_type: "immunity_challenge_results", scene_description: "Immunity results" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "Final 4 guaranteed! Who do you bring?" }
        ],
        on_loss: [
          { scene_type: "tribal", scene_description: "Tribal Council — one of the last votes" },
          { scene_type: "tribal_results", scene_description: "Final 4 is set" }
        ]
      }
    ]
  },

  // ============================================================================
  // FINALE: Episode 13 (Final immunity, Final Tribal Council)
  // ============================================================================

  13: {
    episode: 13,
    contestants: 4,
    game_phase: "merged",
    days: [
      {
        day: 37,
        scenes: [
          { scene_type: "camp", scene_description: "Final 4 — reflecting on 37 days of survival" },
        ]
      },
      {
        day: 38,
        scenes: [
          { scene_type: "immunity_challenge", scene_description: "Final immunity challenge — the most important one" },
          { scene_type: "immunity_challenge_results", scene_description: "Final immunity results" },
        ],
        on_win: [
          { scene_type: "camp", scene_description: "You won final immunity! Choose who faces fire-making" }
        ],
        on_loss: [
          { scene_type: "camp", scene_description: "Fire-making challenge awaits — or convince the winner to save you" }
        ]
      },
      {
        day: 39,
        scenes: [
          { scene_type: "tribal", scene_description: "Final Tribal Council — make your case to the jury" },
          { scene_type: "tribal_results", scene_description: "The jury votes... the Sole Survivor is crowned!" }
        ]
      }
    ]
  }
}

// ============================================================================
// Utility functions
// ============================================================================

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickTwo<T>(arr: T[]): [T, T] {
  const a = pick(arr)
  let b = pick(arr)
  while (b === a) b = pick(arr)
  return [a, b]
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Get episode schedule with fallback
export function getEpisodeSchedule(episode: number): EpisodeSchedule {
  return EPISODE_SCHEDULES[episode] || EPISODE_SCHEDULES[13]
}

// Helper to check if a scene type is an immunity challenge
export function isImmunityChallenge(sceneType: SceneType): boolean {
  return sceneType === 'immunity_challenge' || sceneType === 'immunity_challenge_results'
}

// Helper to check if a scene type is a reward challenge  
export function isRewardChallenge(sceneType: SceneType): boolean {
  return sceneType === 'reward_challenge' || sceneType === 'reward_challenge_results'
}

// Get the day number from episode and day index
export function getDayNumber(episode: number, dayIndex: number): number {
  const episodeData = getEpisodeSchedule(episode)
  if (dayIndex < episodeData.days.length) {
    return episodeData.days[dayIndex].day
  }
  return episodeData.days[episodeData.days.length - 1].day
}

// Get scene sequence for a specific day within an episode
export function getSceneSequence(
  episode: number,
  dayIndex: number,
  lastChallengeWon: boolean | null
): Scene[] {
  const episodeData = getEpisodeSchedule(episode)
  if (dayIndex >= episodeData.days.length) {
    return [{ scene_type: "camp", scene_description: "Fallback camp scene" }]
  }
  
  const dayData = episodeData.days[dayIndex]
  let sequence = [...dayData.scenes]
  
  // Add win/loss scenes if applicable
  if (lastChallengeWon === true && dayData.on_win) {
    sequence = sequence.concat(dayData.on_win)
  } else if (lastChallengeWon === false && dayData.on_loss) {
    sequence = sequence.concat(dayData.on_loss)
  }
  
  return sequence
}

// Get current scene
export function getCurrentScene(
  episode: number,
  dayIndex: number,
  sceneIndexInDay: number,
  lastChallengeWon: boolean | null
): Scene {
  const sequence = getSceneSequence(episode, dayIndex, lastChallengeWon)
  if (sceneIndexInDay < sequence.length) {
    return sequence[sceneIndexInDay]
  }
  return { scene_type: "camp", scene_description: "Fallback camp scene" }
}

// Total episodes in the game
export const TOTAL_EPISODES = 13

// Merge episode
export const MERGE_EPISODE = 7
