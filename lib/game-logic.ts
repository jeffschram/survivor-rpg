// Game constants and logic extracted from server.js

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
  contestants: number
  game_phase: 'pre-merge' | 'merged'
  scenes: Scene[]
  on_win?: Scene[]
  on_loss?: Scene[]
}

export const DAY_SCHEDULES: Record<number, DaySchedule> = {
  // ============================================================================
  // PRE-MERGE: Days 1-24 (18 players → 10 players)
  // ============================================================================
  
  1: {
    contestants: 18,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Game intro — Jeff Probst welcomes castaways to Survivor, tribes are divided" },
      { scene_type: "camp", scene_description: "First impressions at camp, early bonds form, shelter building begins" }
    ]
  },
  2: {
    contestants: 18,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Morning at camp, alliances start to form, personalities emerge" }
    ]
  },
  3: {
    contestants: 18,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Tensions rise as the first immunity challenge approaches" },
      { scene_type: "immunity_challenge", scene_description: "First tribe immunity challenge — losing tribe goes to tribal council" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity challenge results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Victory celebration, tribe morale is high" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Scrambling begins — who will be the first person voted out?" },
      { scene_type: "tribal", scene_description: "First Tribal Council — the game gets real" },
      { scene_type: "tribal_results", scene_description: "The first castaway is eliminated" },
      { scene_type: "camp", scene_description: "Returning to camp after the first vote, the game has changed" }
    ]
  },
  4: {
    contestants: 17,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Day 4 camp life — reflecting on the first elimination, new dynamics emerge" }
    ]
  },
  5: {
    contestants: 17,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Alliance talks intensify, paranoia creeps in" },
      { scene_type: "reward_challenge", scene_description: "Reward challenge — compete for a barbecue feast" },
      { scene_type: "reward_challenge_results", scene_description: "Reward challenge results" }
    ]
  },
  6: {
    contestants: 17,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Pre-challenge strategy, alliance lines become clearer" },
      { scene_type: "immunity_challenge", scene_description: "Tribe immunity challenge — physical endurance test" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity challenge results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Safe again, but cracks in the alliance start to show" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Frantic scrambling, multiple names are thrown around" },
      { scene_type: "tribal", scene_description: "Tribal Council — tension between alliances" },
      { scene_type: "tribal_results", scene_description: "Another castaway has their torch snuffed" },
      { scene_type: "camp", scene_description: "Post-tribal fallout, trust is broken" }
    ]
  },
  7: {
    contestants: 16,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "One week in — exhaustion sets in, tempers flare over camp chores" }
    ]
  },
  8: {
    contestants: 16,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Strategic conversations by the water well" },
    ]
  },
  9: {
    contestants: 16,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Immunity challenge day — the pressure is on" },
      { scene_type: "immunity_challenge", scene_description: "Tribe immunity challenge — puzzle and strength combo" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity challenge results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Winning streak continues, confidence grows" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Blame game begins, weak links targeted" },
      { scene_type: "tribal", scene_description: "Tribal Council — voting bloc forms" },
      { scene_type: "tribal_results", scene_description: "Another torch is snuffed" },
      { scene_type: "camp", scene_description: "Tribe morale is low after another loss" }
    ]
  },
  10: {
    contestants: 15,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Day 10 — alliances solidify, outsiders get nervous" }
    ]
  },
  11: {
    contestants: 15,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Food is running low, hunger affects gameplay" },
      { scene_type: "reward_challenge", scene_description: "Reward challenge — compete for a pizza party" },
      { scene_type: "reward_challenge_results", scene_description: "Reward challenge results" }
    ]
  },
  12: {
    contestants: 15,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Pre-challenge nerves, discussions about the merge" },
      { scene_type: "immunity_challenge", scene_description: "Tribe immunity challenge — water-based competition" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity challenge results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Victory brings relief, but merge talk dominates" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Desperate plays, someone tries to flip the vote" },
      { scene_type: "tribal", scene_description: "Tribal Council — a potential blindside?" },
      { scene_type: "tribal_results", scene_description: "The vote is read" },
      { scene_type: "camp", scene_description: "Shock waves from the vote" }
    ]
  },
  13: {
    contestants: 14,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Day 13 — merge speculation grows, cross-tribal relationships matter" }
    ]
  },
  14: {
    contestants: 14,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Strategic positioning for the expected merge" },
    ]
  },
  15: {
    contestants: 14,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Last pre-merge immunity? The stakes feel higher" },
      { scene_type: "immunity_challenge", scene_description: "Tribe immunity challenge — endurance and balance" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity challenge results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "One more immunity before merge, feeling good" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Last chance to make a move before merge" },
      { scene_type: "tribal", scene_description: "Tribal Council — players position for merge" },
      { scene_type: "tribal_results", scene_description: "One more goes home before merge" },
      { scene_type: "camp", scene_description: "The tribe is weakened heading into merge" }
    ]
  },
  16: {
    contestants: 13,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Day 16 — is the merge coming? Everyone is on edge" }
    ]
  },
  17: {
    contestants: 13,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Idol hunting intensifies, secret alliances form" },
      { scene_type: "reward_challenge", scene_description: "Reward challenge — compete for an overnight trip" },
      { scene_type: "reward_challenge_results", scene_description: "Reward challenge results" }
    ]
  },
  18: {
    contestants: 13,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Could this be the last tribal immunity?" },
      { scene_type: "immunity_challenge", scene_description: "Tribe immunity challenge — strength and strategy" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity challenge results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Going into merge with numbers, a strong position" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Desperation sets in before tribal" },
      { scene_type: "tribal", scene_description: "Tribal Council — tribal lines may not hold" },
      { scene_type: "tribal_results", scene_description: "Another elimination" },
      { scene_type: "camp", scene_description: "Preparing mentally for the merge" }
    ]
  },
  19: {
    contestants: 12,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Day 19 — anticipation builds, merge feels imminent" }
    ]
  },
  20: {
    contestants: 12,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Final tribal dynamics, positioning for merge" },
      { scene_type: "reward_challenge", scene_description: "Reward challenge — compete for comfort items" },
      { scene_type: "reward_challenge_results", scene_description: "Reward challenge results" }
    ]
  },
  21: {
    contestants: 12,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "The last tribal immunity before merge?" },
      { scene_type: "immunity_challenge", scene_description: "Tribe immunity challenge — final tribal showdown" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity challenge results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Heading to merge with a strong tribe" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "One more vote before merge, every number counts" },
      { scene_type: "tribal", scene_description: "Tribal Council — final pre-merge vote" },
      { scene_type: "tribal_results", scene_description: "The last pre-merge elimination" },
      { scene_type: "camp", scene_description: "Aftermath of the vote, merge is next" }
    ]
  },
  22: {
    contestants: 11,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Day 22 — the merge is coming, excitement and anxiety" }
    ]
  },
  23: {
    contestants: 11,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Last day as separate tribes, making final deals" },
    ]
  },
  24: {
    contestants: 11,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Final tribal challenge approaches" },
      { scene_type: "immunity_challenge", scene_description: "Last tribe immunity challenge" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity challenge results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Entering merge with the numbers advantage" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "One more elimination before merge" },
      { scene_type: "tribal", scene_description: "Tribal Council — last pre-merge tribal" },
      { scene_type: "tribal_results", scene_description: "Final pre-merge elimination" },
      { scene_type: "camp", scene_description: "Heading to merge as the minority" }
    ]
  },

  // ============================================================================
  // MERGE: Day 25 (tribes become one)
  // ============================================================================
  
  25: {
    contestants: 10,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "MERGE! Both tribes combine, merge feast and celebration" },
      { scene_type: "camp", scene_description: "New tribe name chosen, alliances reform, it's now individual game" }
    ]
  },

  // ============================================================================
  // POST-MERGE: Days 26-38 (Individual immunity, 10 → 3)
  // ============================================================================
  
  26: {
    contestants: 10,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "First morning as merged tribe, new dynamics" },
      { scene_type: "immunity_challenge", scene_description: "First individual immunity challenge — everyone for themselves" },
      { scene_type: "immunity_challenge_results", scene_description: "Individual immunity results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Safe with the necklace, time to control the vote" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Without immunity, scrambling to survive" },
      { scene_type: "tribal", scene_description: "First merged Tribal Council — biggest target goes?" },
      { scene_type: "tribal_results", scene_description: "First jury member is created" },
      { scene_type: "camp", scene_description: "The merge vote sets the tone for endgame" }
    ]
  },
  27: {
    contestants: 9,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Day 27 — power dynamics shift after first merge vote" }
    ]
  },
  28: {
    contestants: 9,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Strategic conversations, new targets emerge" },
      { scene_type: "reward_challenge", scene_description: "Individual reward challenge — compete for a loved ones visit" },
      { scene_type: "reward_challenge_results", scene_description: "Emotional reward results" },
      { scene_type: "immunity_challenge", scene_description: "Individual immunity challenge" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Immunity gives power, controlling the vote" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Vulnerable without immunity, building voting bloc" },
      { scene_type: "tribal", scene_description: "Tribal Council — alliances tested" },
      { scene_type: "tribal_results", scene_description: "Another joins the jury" },
      { scene_type: "camp", scene_description: "Processing the vote, game moves fast" }
    ]
  },
  29: {
    contestants: 8,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Day 29 — final 8, everyone scheming" }
    ]
  },
  30: {
    contestants: 8,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Paranoia at its peak, trust no one" },
      { scene_type: "immunity_challenge", scene_description: "Individual immunity challenge — mental endurance" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Safe, playing puppet master" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "On the chopping block, fighting to stay" },
      { scene_type: "tribal", scene_description: "Tribal Council — blindside potential" },
      { scene_type: "tribal_results", scene_description: "A shocking elimination?" },
      { scene_type: "camp", scene_description: "The fallout from another vote" }
    ]
  },
  31: {
    contestants: 7,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Day 31 — final 7, the end is in sight" }
    ]
  },
  32: {
    contestants: 7,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Everyone positioning for final tribal" },
      { scene_type: "reward_challenge", scene_description: "Individual reward — compete for advantage in the game" },
      { scene_type: "reward_challenge_results", scene_description: "Reward results" },
      { scene_type: "immunity_challenge", scene_description: "Individual immunity challenge" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Immunity win, calling the shots" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Need to make deals to survive" },
      { scene_type: "tribal", scene_description: "Tribal Council — desperation plays" },
      { scene_type: "tribal_results", scene_description: "Another torch snuffed" },
      { scene_type: "camp", scene_description: "Six remain after tribal" }
    ]
  },
  33: {
    contestants: 6,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Day 33 — final 6, resume building begins" }
    ]
  },
  34: {
    contestants: 6,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Who do you want to sit next to at the end?" },
      { scene_type: "immunity_challenge", scene_description: "Individual immunity challenge — physical and mental" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Immunity, choosing who goes next" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Fighting for survival in the final stretch" },
      { scene_type: "tribal", scene_description: "Tribal Council — big moves time" },
      { scene_type: "tribal_results", scene_description: "Down to final 5" },
      { scene_type: "camp", scene_description: "Five left in the game" }
    ]
  },
  35: {
    contestants: 5,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Day 35 — final 5, every immunity is crucial" }
    ]
  },
  36: {
    contestants: 5,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Plotting final moves, who makes final tribal?" },
      { scene_type: "immunity_challenge", scene_description: "Individual immunity challenge — high stakes" },
      { scene_type: "immunity_challenge_results", scene_description: "Immunity results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "Guaranteed final 4, power position" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Must convince others to keep you" },
      { scene_type: "tribal", scene_description: "Tribal Council — final 5 vote" },
      { scene_type: "tribal_results", scene_description: "Down to the final 4" },
      { scene_type: "camp", scene_description: "Final 4 remains" }
    ]
  },
  37: {
    contestants: 4,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Day 37 — final 4, reflecting on the journey" }
    ]
  },
  38: {
    contestants: 4,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "The final immunity challenge is everything" },
      { scene_type: "immunity_challenge", scene_description: "Final immunity challenge — winner chooses who goes to final 3" },
      { scene_type: "immunity_challenge_results", scene_description: "Final immunity results" }
    ],
    on_win: [
      { scene_type: "camp", scene_description: "You control who sits at final tribal" }
    ],
    on_loss: [
      { scene_type: "camp", scene_description: "Your fate is in someone else's hands" },
      { scene_type: "tribal", scene_description: "Tribal Council — final 4 vote" },
      { scene_type: "tribal_results", scene_description: "The final jury member is set" },
      { scene_type: "camp", scene_description: "Final 3 prepare for final tribal council" }
    ]
  },

  // ============================================================================
  // FINALE: Day 39 (Final Tribal Council)
  // ============================================================================
  
  39: {
    contestants: 3,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Day 39 — final 3 reflect on their journey, prepare their pitch" },
      { scene_type: "camp", scene_description: "Rite of passage — honoring fallen castaways" },
      { scene_type: "tribal", scene_description: "Final Tribal Council — make your case to the jury" },
      { scene_type: "tribal_results", scene_description: "The jury votes, the Sole Survivor is crowned!" }
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

// Helper to check if a scene type is an immunity challenge
export function isImmunityChallenge(sceneType: SceneType): boolean {
  return sceneType === 'immunity_challenge' || sceneType === 'immunity_challenge_results'
}

// Helper to check if a scene type is a reward challenge  
export function isRewardChallenge(sceneType: SceneType): boolean {
  return sceneType === 'reward_challenge' || sceneType === 'reward_challenge_results'
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
