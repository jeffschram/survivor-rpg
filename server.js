const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ============================================================================
// PASSWORD PROTECTION
// ============================================================================

// Check that SITE_PASSWORD is configured
if (!process.env.SITE_PASSWORD) {
  console.error("⚠️  WARNING: SITE_PASSWORD environment variable is not set!");
  console.error("   The site will be inaccessible until you set it in .env");
}

app.post("/api/auth", (req, res) => {
  const { password } = req.body;
  const sitePassword = process.env.SITE_PASSWORD;
  
  if (!sitePassword) {
    return res.status(500).json({ success: false, error: "Site not configured" });
  }
  
  if (password === sitePassword) {
    // Return success - client will use this to enable the game start
    res.json({ success: true, authToken: 'authenticated' });
  } else {
    res.status(401).json({ success: false, error: "Invalid password" });
  }
});

// Middleware to protect /api/game/start - require password in header
function requirePasswordAuth(req, res, next) {
  const password = req.headers['x-site-password'];
  const sitePassword = process.env.SITE_PASSWORD;
  
  if (!password || password !== sitePassword) {
    return res.status(401).json({ error: "Unauthorized - invalid password" });
  }
  
  next();
}

// Middleware to protect /api/game/scene and other routes - require valid sessionId
function requireSession(req, res, next) {
  const { sessionId } = req.body;
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: "Unauthorized - invalid or expired session" });
  }
  
  next();
}

// Apply auth middleware
app.post("/api/game/start", requirePasswordAuth);
app.post("/api/game/scene", requireSession);
app.get("/api/game/:sessionId", (req, res, next) => {
  if (!sessions.has(req.params.sessionId)) {
    return res.status(401).json({ error: "Unauthorized - invalid session" });
  }
  next();
});

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOCATIONS = [
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
];

const TRIBE_NAMES = [
  "Koru", "Naru", "Solari", "Vanta", "Aroa", "Kael", "Maru", "Sable", "Kiri", "Tika"
];

const TRIBE_COLORS = [
  "#840404",  // dark red
  "#207D07",  // dark green
  "#0C5F9E",  // dark blue
  "#7B067F",  // dark purple
  "#AF6C0F"   // dark orange
];

const MERGED_NAMES = ["Aegis", "Horizon", "Crescent", "Ember", "Nova"];

// ============================================================================
// DAY-BY-DAY GAME SCHEDULE
// ============================================================================

const DAY_SCHEDULES = {
  // PRE-MERGE (18 → 10)
  1: {
    contestants: 18,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Game intro scene — Jeff Probst introduces the game, tribes are formed" },
      { scene_type: "camp", scene_description: "Each tribe arrives at their separate camps" },
      { scene_type: "camp", scene_description: "First impressions, early alliances, camp setup" }
    ]
  },
  2: {
    contestants: 18,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and early strategy" },
      { scene_type: "challenge", scene_description: "Optional reward challenge" },
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
      { scene_type: "challenge", scene_description: "Optional reward challenge" },
      { scene_type: "challenge_results", scene_description: "Reward challenge outcome" }
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
  7: {
    contestants: 16,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life, tribe strength assessments" }
    ]
  },
  8: {
    contestants: 16,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy conversations" },
      { scene_type: "challenge", scene_description: "Optional reward challenge" },
      { scene_type: "challenge_results", scene_description: "Reward challenge outcome" }
    ]
  },
  9: {
    contestants: 16,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
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
  10: {
    contestants: 15,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life, power players emerge" }
    ]
  },
  11: {
    contestants: 15,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy and alliance maintenance" },
      { scene_type: "challenge", scene_description: "Optional reward challenge" },
      { scene_type: "challenge_results", scene_description: "Reward challenge outcome" }
    ]
  },
  12: {
    contestants: 15,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
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
  13: {
    contestants: 14,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life, hunger and fatigue emphasized" }
    ]
  },
  14: {
    contestants: 14,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy and trust-testing" },
      { scene_type: "challenge", scene_description: "Optional reward challenge" },
      { scene_type: "challenge_results", scene_description: "Reward challenge outcome" }
    ]
  },
  15: {
    contestants: 14,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
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
  16: {
    contestants: 13,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life, long-term planning" }
    ]
  },
  17: {
    contestants: 13,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy discussions" },
      { scene_type: "challenge", scene_description: "Optional reward challenge" },
      { scene_type: "challenge_results", scene_description: "Reward challenge outcome" }
    ]
  },
  18: {
    contestants: 13,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
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
  19: {
    contestants: 12,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life, merge speculation" }
    ]
  },
  20: {
    contestants: 12,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy and relationship management" },
      { scene_type: "challenge", scene_description: "Optional reward challenge" },
      { scene_type: "challenge_results", scene_description: "Reward challenge outcome" }
    ]
  },
  21: {
    contestants: 12,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
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
  22: {
    contestants: 11,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life, anticipation of merge" }
    ]
  },
  23: {
    contestants: 11,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy and positioning" },
      { scene_type: "challenge", scene_description: "Optional reward challenge" },
      { scene_type: "challenge_results", scene_description: "Reward challenge outcome" }
    ]
  },
  24: {
    contestants: 11,
    game_phase: "pre-merge",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life and strategy, talk of upcoming challenge" },
      { scene_type: "challenge", scene_description: "Tribe immunity challenge, last before merge" },
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

  // MERGE (10 → Final 3)
  25: {
    contestants: 10,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Merge feast, new tribe name, social reshuffling" },
      { scene_type: "camp", scene_description: "More strategy now with a merged tribe" }
    ]
  },
  26: {
    contestants: 10,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy, alliance testing, idol hunting" }
    ]
  },
  27: {
    contestants: 10,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy and talk of upcoming immunity challenge" },
      { scene_type: "challenge", scene_description: "Individual immunity challenge" },
      { scene_type: "challenge_results", scene_description: "Individual immunity winner" },
      { scene_type: "camp", scene_description: "Strategy and vote targeting" },
      { scene_type: "tribal", scene_description: "Tribal Council" },
      { scene_type: "tribal_results", scene_description: "One contestant voted out" }
    ]
  },
  28: {
    contestants: 9,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Fallout from merge vote, majority vs minority" }
    ]
  },
  29: {
    contestants: 9,
    game_phase: "merged",
    scenes: [
      { scene_type: "challenge", scene_description: "Reward challenge" },
      { scene_type: "challenge_results", scene_description: "Reward outcome" },
      { scene_type: "camp", scene_description: "Strategy after reward" }
    ]
  },
  30: {
    contestants: 9,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy and talk of upcoming immunity challenge" },
      { scene_type: "challenge", scene_description: "Individual immunity challenge" },
      { scene_type: "challenge_results", scene_description: "Immunity winner" },
      { scene_type: "camp", scene_description: "Scrambling and big-move talk" },
      { scene_type: "tribal", scene_description: "Tribal Council" },
      { scene_type: "tribal_results", scene_description: "One contestant voted out" }
    ]
  },
  31: {
    contestants: 8,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Camp life, jury awareness grows" }
    ]
  },
  32: {
    contestants: 8,
    game_phase: "merged",
    scenes: [
      { scene_type: "challenge", scene_description: "Reward challenge" },
      { scene_type: "challenge_results", scene_description: "Reward outcome" },
      { scene_type: "camp", scene_description: "Strategy conversations" }
    ]
  },
  33: {
    contestants: 8,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy and talk of upcoming immunity challenge" },
      { scene_type: "challenge", scene_description: "Individual immunity challenge" },
      { scene_type: "challenge_results", scene_description: "Immunity winner" },
      { scene_type: "camp", scene_description: "Strategy and paranoia" },
      { scene_type: "tribal", scene_description: "Tribal Council" },
      { scene_type: "tribal_results", scene_description: "One contestant voted out" }
    ]
  },
  34: {
    contestants: 7,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Endgame positioning and loyalty tests" }
    ]
  },
  35: {
    contestants: 7,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy and talk of upcoming immunity challenge" },
      { scene_type: "challenge", scene_description: "Individual immunity challenge" },
      { scene_type: "challenge_results", scene_description: "Immunity winner" },
      { scene_type: "camp", scene_description: "Strategy and jury management" },
      { scene_type: "tribal", scene_description: "Tribal Council" },
      { scene_type: "tribal_results", scene_description: "One contestant voted out" }
    ]
  },
  36: {
    contestants: 6,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Endgame math and alliance fractures" }
    ]
  },
  37: {
    contestants: 6,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy and talk of upcoming immunity challenge" },
      { scene_type: "challenge", scene_description: "Individual immunity challenge" },
      { scene_type: "challenge_results", scene_description: "Immunity winner" },
      { scene_type: "camp", scene_description: "Final-six strategy" },
      { scene_type: "tribal", scene_description: "Tribal Council" },
      { scene_type: "tribal_results", scene_description: "One contestant voted out" }
    ]
  },
  38: {
    contestants: 5,
    game_phase: "merged",
    scenes: [
      { scene_type: "camp", scene_description: "Strategy and talk of upcoming immunity challenge" },
      { scene_type: "challenge", scene_description: "Individual immunity challenge" },
      { scene_type: "challenge_results", scene_description: "Immunity winner" },
      { scene_type: "camp", scene_description: "Final deals and fire-making decisions" },
      { scene_type: "tribal", scene_description: "Tribal Council" },
      { scene_type: "tribal_results", scene_description: "One contestant voted out" },
      { scene_type: "challenge", scene_description: "Fire-making challenge" },
      { scene_type: "challenge_results", scene_description: "One contestant eliminated" },
      { scene_type: "camp", scene_description: "Final 3 get back to camp and talk" }
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
};

const ALL_STARS = [
  "Boston Rob", "Parvati", "Sandra", "Tony", "Kim", "Cirie", "Tyson",
  "Jeremy", "Sarah", "Yul", "Malcolm", "Andrea", "Wentworth", "Aubry",
  "Natalie Anderson", "Ozzy", "Cochran", "Rupert", "Russell Hantz",
  "Rob Cesternino",
  "Stephenie LaGrossa",
  "Jerri Manthey",
  "Coach Wade",
  "Amanda Kimmel",
  "James Clement",
  "Colby Donaldson",
  "Hatch",
  "Ethan Zohn",
  "Tom Westman",
  "Denise Stapley",
  "Mike Holloway",
  "Ben Driebergen",
  "Domenick Abbate",
  "Jonathan Penner"
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickTwo(arr) {
  const a = pick(arr);
  let b = pick(arr);
  while (b === a) b = pick(arr);
  return [a, b];
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ============================================================================
// GAME STATE
// ============================================================================

const sessions = new Map();

class Game {
  constructor(playerName, gender = "male", initialStats = null) {
    this.playerName = playerName;
    this.gender = gender;
    this.location = pick(LOCATIONS);
    
    const [t1, t2] = pickTwo(TRIBE_NAMES);
    const [c1, c2] = pickTwo(TRIBE_COLORS);
    
    // Randomly select 18 all-stars from the larger pool
    const selectedAllStars = shuffle(ALL_STARS).slice(0, 18);
    const shuffled = shuffle(selectedAllStars);
    
    this.tribes = {
      [t1]: [playerName, ...shuffled.slice(0, 8)],  // Player + 8 all-stars = 9
      [t2]: shuffled.slice(8, 17)  // 9 all-stars
    };
    this.tribeColors = {
      [t1]: c1,
      [t2]: c2
    };
    this.playerTribe = t1;
    this.opposingTribe = t2;
    
    this.day = 1;
    this.phase = "pre-merge";
    this.merged = false;
    this.mergedTribeName = null;
    
    this.eliminated = [];
    this.jury = [];
    
    // Use provided stats or defaults
    this.stats = initialStats || { Social: 2.5, Strategy: 2.5, Challenge: 2.5, Threat: 2.5 };
    
    // Day-by-day scene tracking
    this.sceneCount = 0;
    this.sceneIndexInDay = 0;  // Which scene we're on within the current day
    this.lastSceneType = null;
    this.lastChallengeWon = null;  // null = no challenge yet, true = won, false = lost
    this.pendingOpposingElimination = null;  // Name of player eliminated from opposing tribe
  }
  
  // Get day data from DAY_SCHEDULES
  getDayData() {
    return DAY_SCHEDULES[this.day] || { contestants: 3, game_phase: "merged", scenes: [{ scene_type: "camp", scene_description: "Fallback camp scene" }] };
  }
  
  // Get the full scene sequence for current day (including win/loss branches if applicable)
  getSceneSequence() {
    const dayData = this.getDayData();
    let sequence = [...dayData.scenes];
    
    // If we have a challenge result and this day has conditional branches, append them
    if (this.lastChallengeWon === true && dayData.on_win) {
      sequence = sequence.concat(dayData.on_win);
    } else if (this.lastChallengeWon === false && dayData.on_loss) {
      sequence = sequence.concat(dayData.on_loss);
    }
    
    return sequence;
  }
  
  // Get the current scene object (with type and description)
  getCurrentScene() {
    const sequence = this.getSceneSequence();
    if (this.sceneIndexInDay < sequence.length) {
      return sequence[this.sceneIndexInDay];
    }
    return { scene_type: "camp", scene_description: "Fallback camp scene" };
  }
  
  // Get the next required scene type
  getRequiredSceneType() {
    const sequence = this.getSceneSequence();
    
    // If we've completed all scenes for this day, advance to next day
    if (this.sceneIndexInDay >= sequence.length) {
      this.day++;
      this.sceneIndexInDay = 0;
      this.lastChallengeWon = null;  // Reset challenge outcome for new day
      
      // Check for merge
      if (this.day === 25 && !this.merged) {
        this.merged = true;
        this.mergedTribeName = pick(MERGED_NAMES);
        this.phase = "merge";
      }
      
      return this.getRequiredSceneType();  // Recurse to get scene from new day
    }
    
    return this.getCurrentScene().scene_type;
  }
  
  recordScene(type, challengeWon = null) {
    this.sceneCount++;
    this.lastSceneType = type;
    
    // Track challenge result for win/loss branching
    if (type === "challenge_results" && challengeWon !== null) {
      this.lastChallengeWon = challengeWon;
      
      // Pre-merge: if player's tribe won, mark a member for pending elimination (not revealed yet)
      if (!this.merged && this.isImmunityDay() && challengeWon) {
        const opposingMembers = this.tribes[this.opposingTribe] || [];
        if (opposingMembers.length > 0 && !this.pendingOpposingElimination) {
          const eliminated = opposingMembers[Math.floor(Math.random() * opposingMembers.length)];
          this.pendingOpposingElimination = eliminated;
          console.log(`[PENDING ELIMINATION] ${eliminated} from ${this.opposingTribe} will be revealed at next challenge`);
        }
      }
    }
    
    // At a challenge scene: if there's a pending elimination, NOW reveal and eliminate them
    if (type === "challenge" && this.pendingOpposingElimination) {
      console.log(`[ELIMINATION REVEALED] ${this.pendingOpposingElimination} is gone from ${this.opposingTribe}`);
      this.eliminate(this.pendingOpposingElimination);
      this.pendingOpposingElimination = null;
    }
    
    // Always advance scene index
    this.sceneIndexInDay++;
  }
  
  // Check if current day is an immunity challenge day (vs reward)
  isImmunityDay() {
    const immunityDays = [3, 6, 9, 12, 15, 18, 21, 24];
    return immunityDays.includes(this.day);
  }
  
  updateStats(updates) {
    if (!updates) return;
    for (const [k, v] of Object.entries(updates)) {
      if (this.stats[k] !== undefined && typeof v === "number") {
        this.stats[k] = Math.max(1, Math.min(5, this.stats[k] + v));
      }
    }
  }
  
  eliminate(name) {
    if (this.eliminated.includes(name)) return;
    this.eliminated.push(name);
    
    for (const tribe of Object.values(this.tribes)) {
      const idx = tribe.indexOf(name);
      if (idx !== -1) tribe.splice(idx, 1);
    }
    
    if (this.merged && this.jury.length < 9) {
      this.jury.push(name);
    }
  }
  
  checkMerge() {
    // Merge is now handled by day progression (Day 25)
    return this.merged;
  }
  
  // Get remaining active player count
  getRemainingCount() {
    return ALL_STARS.filter(s => !this.eliminated.includes(s)).length + 1;  // +1 for player
  }
  
  getActivePlayers() {
    return ALL_STARS.filter(s => !this.eliminated.includes(s));
  }
  
  getTribemates() {
    if (this.merged) return this.getActivePlayers();
    return this.tribes[this.playerTribe].filter(p => p !== this.playerName);
  }
}

// ============================================================================
// SIMPLIFIED SYSTEM PROMPT
// ============================================================================

function buildPrompt(game, sceneDirective) {
  const tribemates = game.getTribemates();
  const active = game.getActivePlayers();
  
  const pronouns = game.gender === 'female' ? 'she/her' : game.gender === 'non-binary' ? 'they/them' : 'he/him';
  
  return `You are the Game Master for a Survivor RPG. The player competes against Survivor all-stars.

STYLE:
- Write in second person ("you"), present tense
- Cinematic, immersive narration
- Never break character or explain game mechanics
- No code fences or markdown formatting

PLAYER: ${game.playerName} (${game.gender}, ${pronouns})
LOCATION: ${game.location}
DAY: ${game.day}
PHASE: ${game.phase}

PLAYER TRIBE: ${game.playerTribe}
TRIBEMATES: ${tribemates.join(", ")}
${game.merged ? `MERGED TRIBE: ${game.mergedTribeName}` : `OPPOSING TRIBE: ${game.opposingTribe}`}

ACTIVE ALL-STARS (${active.length}): ${active.join(", ")}
${game.eliminated.length ? `ELIMINATED: ${game.eliminated.join(", ")}` : ""}
${game.jury.length ? `JURY: ${game.jury.join(", ")}` : ""}

${sceneDirective}

RESPONSE FORMAT:
1. Scene title as a markdown heading (### Title Here)
2. Narrative: 2-3 SHORT paragraphs MAXIMUM. Be concise. No long descriptions.
3. Four choices labeled A) B) C) D) - one line each
4. End with exactly these two lines:
SCENE_TYPE: <camp|challenge|challenge_results|tribal|tribal_results>
STAT_UPDATES: {"Social": 0, "Strategy": 0, "Challenge": 0, "Threat": 0}

CRITICAL: Keep scenes SHORT. Max 150 words for narrative. No walls of text.
Do NOT use "Title:" prefix. Use ### for the title.`;
}

function getSceneDirective(game) {
  const currentScene = game.getCurrentScene();
  const day = game.day;
  const remaining = game.getRemainingCount();
  const dayData = game.getDayData();
  
  // Build context info
  const tribeInfo = game.merged 
    ? `Merged tribe: ${game.mergedTribeName}. Individual game.`
    : `Tribes: ${game.playerTribe} vs ${game.opposingTribe}`;
  
  // Special handling for Day 1 - add premiere context
  if (day === 1 && game.sceneIndexInDay === 0) {
    return `SCENE TYPE: PREMIERE (Day 1)

This is the game premiere! Jeff Probst introduces Survivor: All-Stars in ${game.location}. The two tribes are formed: ${game.playerTribe} and ${game.opposingTribe}. 

Scene focus: ${currentScene.scene_description}

Introduce the all-star players dramatically. Set the stage for the season.
${remaining} contestants. ${tribeInfo}

SCENE_TYPE must be: ${currentScene.scene_type}`;
  }
  
  // Special handling for merge day
  if (day === 25 && game.sceneIndexInDay === 0) {
    return `SCENE TYPE: THE MERGE (Day 25)

THE MERGE! Both tribes meet and become one: ${game.mergedTribeName}. 

Scene focus: ${currentScene.scene_description}

Show the merge feast, the new dynamics, and the excitement and tension of individual game beginning.
${remaining} players remain.

SCENE_TYPE must be: ${currentScene.scene_type}`;
  }
  
  // Challenge scenes
  if (currentScene.scene_type === "challenge") {
    const isImmunity = game.isImmunityDay() || game.merged;
    const challengeType = isImmunity ? "IMMUNITY" : "REWARD";
    
    // Reveal pending elimination from opposing tribe
    const revealElimination = game.pendingOpposingElimination 
      ? `\n\nIMPORTANT: As the tribes arrive, the player notices ${game.pendingOpposingElimination} is missing from the ${game.opposingTribe} tribe. They were voted out at the last Tribal Council. Mention this observation naturally.`
      : "";
    
    return `SCENE TYPE: ${challengeType} CHALLENGE (Day ${day})

Scene focus: ${currentScene.scene_description}

Generate ${game.merged ? "an INDIVIDUAL" : "a TRIBE"} ${challengeType} CHALLENGE. Describe the challenge setup and let the player choose their approach. Do NOT reveal the winner yet - that comes in the next scene.${revealElimination}

${remaining} players remain. ${tribeInfo}

SCENE_TYPE must be: challenge`;
  }
  
  // Challenge results
  if (currentScene.scene_type === "challenge_results") {
    const isImmunity = game.isImmunityDay() || game.merged;
    
    // Determine outcome - slight advantage to player, but not too much
    const playerWins = game.lastChallengeWon !== null ? game.lastChallengeWon : Math.random() > 0.45;
    game.lastChallengeWon = playerWins;
    
    if (!game.merged) {
      // Pre-merge: tribe challenge
      if (playerWins) {
        return `SCENE TYPE: CHALLENGE RESULTS - VICTORY (Day ${day})

Scene focus: ${currentScene.scene_description}

The ${game.playerTribe} tribe WINS ${isImmunity ? "immunity" : "the reward"}! Show the celebration and relief. The ${game.opposingTribe} tribe ${isImmunity ? "must go to Tribal Council tonight" : "gets nothing"}.

${isImmunity ? "The player won't see what happens at the other tribe's Tribal - they'll discover who was voted off at the next challenge." : ""}

SCENE_TYPE must be: challenge_results`;
      } else {
        return `SCENE TYPE: CHALLENGE RESULTS - DEFEAT (Day ${day})

Scene focus: ${currentScene.scene_description}

The ${game.playerTribe} tribe LOSES. Show the disappointment. ${isImmunity ? "They must go to Tribal Council tonight. Someone is going home." : "The " + game.opposingTribe + " tribe wins the reward."}

SCENE_TYPE must be: challenge_results`;
      }
    } else {
      // Post-merge: individual challenge
      if (playerWins) {
        return `SCENE TYPE: CHALLENGE RESULTS - PLAYER WINS IMMUNITY (Day ${day})

Scene focus: ${currentScene.scene_description}

The player WINS individual immunity! Show the victory moment as Jeff places the immunity necklace on them. They are safe tonight.

SCENE_TYPE must be: challenge_results`;
      } else {
        const activePlayers = game.getActivePlayers();
        const winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        return `SCENE TYPE: CHALLENGE RESULTS - ${winner.toUpperCase()} WINS (Day ${day})

Scene focus: ${currentScene.scene_description}

${winner} wins individual immunity! The player does not have immunity and could be voted out tonight.

SCENE_TYPE must be: challenge_results`;
      }
    }
  }
  
  // Tribal council
  if (currentScene.scene_type === "tribal") {
    // Special handling for Final Tribal Council
    if (day === 39) {
      return `SCENE TYPE: FINAL TRIBAL COUNCIL (Day 39)

Scene focus: ${currentScene.scene_description}

Final Tribal Council! The Final 3 face the jury. Each finalist makes their case. The jury asks questions. This is the climax of the season.

SCENE_TYPE must be: tribal`;
    }
    
    return `SCENE TYPE: TRIBAL COUNCIL (Day ${day})

Scene focus: ${currentScene.scene_description}

Tribal Council. Jeff Probst asks probing questions. Tensions run high. The player must choose who to vote for.

Show the atmosphere, the conversations, Jeff's questions. Let the player make their voting choice. Do NOT reveal who goes home yet.

SCENE_TYPE must be: tribal`;
  }
  
  // Tribal results
  if (currentScene.scene_type === "tribal_results") {
    // Special handling for Final Tribal Council results
    if (day === 39) {
      return `SCENE TYPE: THE WINNER IS REVEALED (Day 39)

Scene focus: ${currentScene.scene_description}

The jury votes are read. The winner of Survivor: All-Stars is crowned! Show the dramatic reveal and the winner's reaction.

SCENE_TYPE must be: tribal_results`;
    }
    
    return `SCENE TYPE: TRIBAL RESULTS (Day ${day})

Scene focus: ${currentScene.scene_description}

The votes are read. Jeff reads them one by one, building tension. Someone's torch is snuffed.

Pick a logical elimination target (not the player unless they've made major strategic errors). Show the torch snuffing and "The tribe has spoken."

${remaining - 1} will remain after this vote.

SCENE_TYPE must be: tribal_results`;
  }
  
  // Camp scenes - use the description from the schedule
  if (currentScene.scene_type === "camp") {
    return `SCENE TYPE: CAMP (Day ${day})

Scene focus: ${currentScene.scene_description}

${remaining} players remain. ${tribeInfo}
Game phase: ${dayData.game_phase}

SCENE_TYPE must be: camp`;
  }
  
  // Fallback
  return `Generate the next scene for Day ${day}. Scene focus: ${currentScene.scene_description}`;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

app.post("/api/game/start", (req, res) => {
  const { playerName, gender, stats } = req.body;
  if (!playerName) {
    return res.status(400).json({ error: "playerName required" });
  }
  
  const sessionId = `game_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const game = new Game(playerName.trim(), gender || "male", stats || null);
  sessions.set(sessionId, game);
  
  console.log(`New game started: ${sessionId} for ${playerName} (${game.gender})`);
  console.log(`Location: ${game.location}`);
  console.log(`Tribes: ${game.playerTribe} vs ${game.opposingTribe}`);
  console.log(`Initial stats:`, game.stats);
  
  return res.json({
    sessionId,
    location: game.location,
    playerTribe: game.playerTribe,
    opposingTribe: game.opposingTribe,
    tribeColors: game.tribeColors,
    tribes: {
      [game.playerTribe]: game.tribes[game.playerTribe].map(name => ({
        name,
        eliminated: game.eliminated.includes(name)
      })),
      [game.opposingTribe]: game.tribes[game.opposingTribe].map(name => ({
        name,
        eliminated: game.eliminated.includes(name)
      }))
    },
    stats: game.stats,
    gender: game.gender
  });
});

app.post("/api/game/scene", async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY not set" });
  }
  
  const { sessionId, history } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId required" });
  }
  
  const game = sessions.get(sessionId);
  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }
  
  // If we're about to generate challenge results, determine who won/lost now
  if (game.awaitingResults) {
    // 50% chance player's tribe loses
    game.pendingTribal = Math.random() < 0.5;
    console.log(`Challenge outcome determined: Player's tribe ${game.pendingTribal ? "LOSES" : "WINS"}`);
  }
  
  const sceneDirective = getSceneDirective(game);
  const systemPrompt = buildPrompt(game, sceneDirective);
  
  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || [])
  ];
  
  // If we need a specific scene type, add a user-level reminder
  const required = game.getRequiredSceneType();
  if (required) {
    messages.push({
      role: "user",
      content: `[GM Note: The next scene must be a ${required.toUpperCase()} scene. Generate that now.]`
    });
  }
  
  const currentScene = game.getCurrentScene();
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        temperature: 0.85,
        max_tokens: 600,
        messages
      })
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return res.status(response.status).json({ error: err });
    }
    
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    
    if (!raw) {
      return res.status(500).json({ error: "No response from model" });
    }
    
    // Parse scene type
    const sceneMatch = raw.match(/SCENE_TYPE:\s*(\w+)/i);
    let sceneType = sceneMatch ? sceneMatch[1].toLowerCase() : "camp";
    
    // Enforce scene type if we required it
    if (required && sceneType !== required) {
      console.warn(`⚠️ Model returned ${sceneType} but ${required} was required. Overriding.`);
      sceneType = required;
    }
    
    // Parse stat updates
    const statMatch = raw.match(/STAT_UPDATES:\s*(\{[^}]+\})/);
    let statUpdates = null;
    if (statMatch) {
      try {
        statUpdates = JSON.parse(statMatch[1]);
      } catch (e) {
        console.warn("Failed to parse stat updates");
      }
    }
    
    // Update game state
    // Pass challenge result for challenge_results scenes
    const challengeWon = sceneType === "challenge_results" ? game.lastChallengeWon : null;
    game.recordScene(sceneType, challengeWon);
    game.updateStats(statUpdates);
    
    // Clean message for display
    const cleanMessage = raw
      .replace(/SCENE_TYPE:.*$/gm, "")
      .replace(/STAT_UPDATES:.*$/gm, "")
      .replace(/```[\s\S]*?```/g, "")
      .trim();
    
    console.log(`Scene type: ${sceneType}`);
    console.log(`Stats updated: ${JSON.stringify(statUpdates)}`);
    
    return res.json({
      message: cleanMessage,
      sceneType,
      sceneDescription: currentScene.scene_description,
      sceneIndex: game.sceneIndexInDay,
      stats: game.stats,
      day: game.day,
      phase: game.phase,
      playerTribe: game.playerTribe,
      opposingTribe: game.opposingTribe,
      tribeColors: game.tribeColors,
      tribes: {
        [game.playerTribe]: game.tribes[game.playerTribe].map(name => ({
          name,
          eliminated: game.eliminated.includes(name)
        })),
        [game.opposingTribe]: game.tribes[game.opposingTribe].map(name => ({
          name,
          eliminated: game.eliminated.includes(name)
        }))
      }
    });
    
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/game/:sessionId", (req, res) => {
  const game = sessions.get(req.params.sessionId);
  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }
  
  return res.json({
    day: game.day,
    phase: game.phase,
    stats: game.stats,
    sceneCount: game.sceneCount,
    campStreak: game.campStreak,
    eliminated: game.eliminated,
    jury: game.jury
  });
});

app.listen(PORT, () => {
  console.log(`\n🏝️  Survivor RPG running at http://localhost:${PORT}`);
  console.log(`Model: ${process.env.OPENAI_MODEL || "gpt-4o"}\n`);
});
