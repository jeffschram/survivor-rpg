// Game constants and logic extracted from server.js

export const LOCATIONS = [
  "the brutal savannas of Kenya",
  "the ancient ruins and jungles of Cambodia",
  "the storm-lashed beaches of the Marquesas",
  "the dense Maya lowlands of Guatemala",
  "the scorching outback of Australia",
  "the misty highlands and rice terraces of China",
  "the reef-ringed islands of Palau",
  "the cyclone-prone shores of Fiji",
  "the volcanic highlands of Iceland",
  "the Patagonian fjords of southern Chile",
  "the salt flats and canyons of Bolivia",
  "the remote Faroe Islands in the North Atlantic",
  "the jungles and tepui plateaus of Guyana"
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
  "Rob Cesternino", "Stephenie LaGrossa", "Jerri Manthey", "Coach Wade",
  "Amanda Kimmel", "James Clement", "Colby Donaldson", "Hatch",
  "Ethan Zohn", "Tom Westman", "Denise Stapley", "Mike Holloway",
  "Ben Driebergen", "Domenick Abbate", "Jonathan Penner"
]

export type SceneType = 'camp' | 'challenge' | 'challenge_results' | 'tribal' | 'tribal_results'

export interface Scene {
  scene_type: SceneType
  scene_description: string
}

export interface DaySchedule {
  contestants: number
  game_phase: 'pre-merge' | 'merged'
  scenes: Scene[]
  on_win?: Scene[]
  on_loss?: Scene[]
}

export const DAY_SCHEDULES: Record<number, DaySchedule> = {
  // PRE-MERGE (18 → 10)
  1: {
    contestants: 18,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Game intro scene — Jeff Probst introduces the game, tribes are formed" },
      { scene_type: "camp", scene_description: "First impressions, early alliances, camp setup" }
    ]
  },
  2: {
    contestants: 18,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and early strategy" },
      { scene_type: "challenge", scene_description: "Reward challenge" },
      { scene_type: "challenge_results", scene_description: "Reward challenge outcome (reward or consolation)" }
    ]
  },
  3: {
    contestants: 18,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
      { scene_type: "challenge", scene_description: "Tribe immunity challenge" },
      { scene_type: "challenge_results", scene_description: "Immunity results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Congratulations and camp life and strategy" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Strategy and scrambling" },
      { scene_type: "tribal", scene_description: "Tribal Council" },
      { scene_type: "tribal_results", scene_description: "One contestant voted out" },
      { scene_type: "camp", scene_description: "Discussions after tribal" }
    ]
  },
  4: {
    contestants: 17,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and strategy" }
    ]
  },
  5: {
    contestants: 17,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and strategy" },
      { scene_type: "challenge", scene_description: "Reward challenge" },
      { scene_type: "challenge_results", scene_description: "Reward challenge outcome (reward or consolation)" }
    ]
  },
  6: {
    contestants: 17,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
      { scene_type: "challenge", scene_description: "Tribe immunity challenge" },
      { scene_type: "challenge_results", scene_description: "Immunity results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Congratulations and camp life and strategy" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Strategy and scrambling" },
      { scene_type: "tribal", scene_description: "Tribal Council" },
      { scene_type: "tribal_results", scene_description: "One contestant voted out" },
      { scene_type: "camp", scene_description: "Discussions after tribal" }
    ]
  },
  // Days 7-39 continue similarly...
  // For brevity, adding key days
  25: {
    contestants: 10,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Merge feast, new tribe name, social reshuffling" },
      { scene_type: "camp", scene_description: "More strategy now with a merged tribe" }
    ]
  },
  39: {
    contestants: 3,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Discussions before final tribal council" },
      { scene_type: "tribal", scene_description: "Final Tribal Council" },
      { scene_type: "tribal_results", scene_description: "Jury vote and winner revealed" }
    ]
  }
}

// Utility functions
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

// Get day schedule with fallback
export function getDaySchedule(day: number): DaySchedule {
  return DAY_SCHEDULES[day] || {
    contestants: 3,
    game_phase: "merged",
    scenes: [{ scene_type: "camp", scene_description: "Fallback camp scene" }]
  }
}

// Check if a day is an immunity day
export function isImmunityDay(day: number): boolean {
  const immunityDays = [3, 6, 9, 12, 15, 18, 21, 24]
  return immunityDays.includes(day)
}

// Get scene sequence including win/loss branches
export function getSceneSequence(
  day: number,
  lastChallengeWon: boolean | null
): Scene[] {
  const dayData = getDaySchedule(day)
  let sequence = [...dayData.scenes]
  
  if (lastChallengeWon === true && dayData.on_win) {
    sequence = sequence.concat(dayData.on_win)
  } else if (lastChallengeWon === false && dayData.on_loss) {
    sequence = sequence.concat(dayData.on_loss)
  }
  
  return sequence
}

// Get current scene
export function getCurrentScene(
  day: number,
  sceneIndexInDay: number,
  lastChallengeWon: boolean | null
): Scene {
  const sequence = getSceneSequence(day, lastChallengeWon)
  if (sceneIndexInDay < sequence.length) {
    return sequence[sceneIndexInDay]
  }
  return { scene_type: "camp", scene_description: "Fallback camp scene" }
}
