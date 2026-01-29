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

const MERGED_NAMES = ["Aegis", "Horizon", "Crescent", "Ember", "Nova"];

const ALL_STARS = [
  "Boston Rob", "Parvati", "Sandra", "Tony", "Kim", "Cirie", "Tyson",
  "Jeremy", "Sarah", "Yul", "Malcolm", "Andrea", "Wentworth", "Aubry",
  "Natalie Anderson", "Ozzy", "Cochran", "Rupert"
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
    const shuffled = shuffle(ALL_STARS);
    
    this.tribes = {
      [t1]: [playerName, ...shuffled.slice(0, 8)],
      [t2]: shuffled.slice(8)
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
    
    // Scene pacing
    this.sceneCount = 0;
    this.lastSceneType = "intro";
    this.campStreak = 0;
    this.campsSinceResults = 0;  // Track camps after challenge results
    this.pendingTribal = false;  // True if player's tribe lost and tribal is coming
    this.awaitingChallengeResults = false; // True if we just had challenge, need results
    this.awaitingTribalResults = false; // True if we just had tribal, need results
    
    // Track opposing tribe's elimination (revealed at next challenge)
    this.pendingOpposingElimination = null; // Name of player voted out from other tribe
    this.lastChallengeWon = null; // true = player won, false = player lost, null = no challenge yet
  }
  
  // Determine what scene type should come next
  getRequiredSceneType() {
    // After a challenge, MUST show results
    if (this.awaitingChallengeResults) {
      return "challenge_results";
    }
    
    // After tribal council, MUST show results
    if (this.awaitingTribalResults) {
      return "tribal_results";
    }
    
    // After challenge results where tribe lost, need 2 camps then tribal
    if (this.pendingTribal) {
      if (this.campsSinceResults < 2) {
        return "camp";
      } else {
        return "tribal";
      }
    }
    
    // After 2 camp scenes (no pending tribal), MUST be challenge
    if (this.campStreak >= 2) {
      return "challenge";
    }
    
    // Otherwise, natural progression (camp or challenge)
    return null;
  }
  
  recordScene(type) {
    this.sceneCount++;
    this.lastSceneType = type;
    
    if (type === "camp") {
      this.campStreak++;
      if (this.pendingTribal) {
        this.campsSinceResults++;
      }
    } else if (type === "challenge") {
      this.campStreak = 0;
      this.awaitingChallengeResults = true;
      // Clear any pending elimination reveal (it was shown at challenge start)
      if (this.pendingOpposingElimination) {
        this.pendingOpposingElimination = null;
      }
      this.day++;
    } else if (type === "challenge_results") {
      this.awaitingChallengeResults = false;
      this.campsSinceResults = 0;
      
      // Handle outcome based on who won
      if (this.lastChallengeWon) {
        // Player's tribe won - opposing tribe goes to tribal (off-screen)
        // Pick someone from opposing tribe to eliminate
        const opposingMembers = this.tribes[this.opposingTribe] || [];
        if (opposingMembers.length > 0) {
          const eliminated = opposingMembers[Math.floor(Math.random() * opposingMembers.length)];
          this.pendingOpposingElimination = eliminated;
          this.eliminate(eliminated);
        }
        this.pendingTribal = false;
      } else {
        // Player's tribe lost - they go to tribal
        this.pendingTribal = true;
      }
      // Reset for next challenge
      this.lastChallengeWon = null;
    } else if (type === "tribal") {
      this.campStreak = 0;
      this.awaitingTribalResults = true;
    } else if (type === "tribal_results") {
      this.awaitingTribalResults = false;
      this.pendingTribal = false;
      this.campsSinceResults = 0;
      this.day++;
    }
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
    const remaining = ALL_STARS.filter(s => !this.eliminated.includes(s)).length + 1;
    if (!this.merged && remaining <= 12 && remaining >= 10) {
      this.merged = true;
      this.mergedTribeName = pick(MERGED_NAMES);
      this.phase = "merge";
      return true;
    }
    return false;
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
  const required = game.getRequiredSceneType();
  
  if (required === "challenge") {
    // If there's a pending elimination from opposing tribe, reveal it at challenge start
    const revealElimination = game.pendingOpposingElimination 
      ? `\n\nIMPORTANT: As the tribes arrive for the challenge, the player notices ${game.pendingOpposingElimination} is missing from the ${game.opposingTribe} tribe. They were voted out at the last Tribal Council. Mention this observation naturally in the scene.`
      : "";
    
    return `SCENE TYPE: CHALLENGE (MANDATORY)

Generate an IMMUNITY CHALLENGE scene. Describe the challenge setup and let the player choose their approach. Do NOT reveal the winner yet - that comes in the next scene.${revealElimination}

Focus on: the challenge description, tension, player's strategy choice.

This MUST be a challenge scene. SCENE_TYPE must be: challenge`;
  }
  
  if (required === "challenge_results") {
    // Determine outcome - alternate or randomize, but track it
    const playerWins = game.lastChallengeWon !== null ? game.lastChallengeWon : Math.random() > 0.4;
    game.lastChallengeWon = playerWins; // Store for later reference
    
    if (playerWins) {
      return `SCENE TYPE: CHALLENGE RESULTS (MANDATORY)

This is the conclusion of the challenge. The player's tribe (${game.playerTribe}) WINS immunity!

Show the dramatic finish, celebration, and relief. The ${game.opposingTribe} tribe will go to Tribal Council tonight, but the player won't see what happens there - they'll only find out who was voted off when they see the other tribe at the next challenge.

End with the player's tribe heading back to camp, safe for another day.

This MUST be a challenge_results scene. SCENE_TYPE must be: challenge_results`;
    } else {
      return `SCENE TYPE: CHALLENGE RESULTS (MANDATORY)

This is the conclusion of the challenge. The player's tribe (${game.playerTribe}) LOSES immunity.

Show the dramatic finish, disappointment, and tension. The player's tribe must go to Tribal Council. The ${game.opposingTribe} tribe is safe.

End with the weight of knowing someone from the player's tribe will be going home.

This MUST be a challenge_results scene. SCENE_TYPE must be: challenge_results`;
    }
  }
  
  if (required === "camp" && game.pendingTribal) {
    const campsLeft = 2 - game.campsSinceResults;
    return `SCENE TYPE: CAMP (MANDATORY - ${campsLeft} camp scene(s) until Tribal)

The player's tribe lost the challenge. Generate a camp scene with scrambling, strategy talk, and alliance maneuvering before Tribal Council.

This MUST be a camp scene. SCENE_TYPE must be: camp`;
  }
  
  if (required === "tribal") {
    return `SCENE TYPE: TRIBAL COUNCIL (MANDATORY)

Generate a TRIBAL COUNCIL scene. Show the discussion, tension, and voting. Do NOT reveal who is eliminated yet - that comes in the next scene.

Focus on: tribal atmosphere, Jeff's questions, player's voting choice.

This MUST be a tribal scene. SCENE_TYPE must be: tribal`;
  }
  
  if (required === "tribal_results") {
    return `SCENE TYPE: TRIBAL COUNCIL RESULTS (MANDATORY)

This is the vote reveal. Jeff reads the votes one by one. Reveal who is eliminated and show their torch being snuffed.

Pick an All-Star from the losing tribe to eliminate (not the player unless they made major mistakes).

This MUST be a tribal_results scene. SCENE_TYPE must be: tribal_results`;
  }
  
  // Natural flow - suggest based on where we are
  if (game.sceneCount === 0) {
    return `SCENE TYPE: PREMIERE

This is the game premiere! Introduce the setting, the two tribes, and the all-star players. Set the stage for the season ahead. End with a camp scene where alliances begin forming.

SCENE_TYPE should be: camp`;
  }
  
  // After a win, camp scenes are more relaxed (no tribal pressure)
  const wonLastChallenge = game.pendingOpposingElimination !== null;
  
  if (game.campStreak === 0) {
    const mood = wonLastChallenge 
      ? "The tribe is in good spirits after winning immunity. Focus on alliance building, strategy discussions, or character moments."
      : "Generate a camp/strategy scene. Alliances form, conversations happen, tension builds.";
    return `SCENE TYPE: CAMP (1 of 2 before challenge)

${mood}

SCENE_TYPE should be: camp`;
  }
  
  if (game.campStreak === 1) {
    const mood = wonLastChallenge
      ? "Another day of safety. The tribe prepares for the next challenge. Maybe speculation about what happened at the other tribe's Tribal Council."
      : "This is the final camp scene before a challenge.";
    return `SCENE TYPE: CAMP (2 of 2 - last before challenge)

${mood}

SCENE_TYPE should be: camp`;
  }
  
  return `Generate the next appropriate scene for the game.`;
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
    tribemates: game.getTribemates(),
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
  
  console.log(`\n--- Scene Request ---`);
  console.log(`Session: ${sessionId}`);
  console.log(`Day: ${game.day}, Scene: ${game.sceneCount + 1}`);
  console.log(`Camp streak: ${game.campStreak}, Camps since results: ${game.campsSinceResults}`);
  console.log(`Awaiting challenge results: ${game.awaitingChallengeResults}, Awaiting tribal results: ${game.awaitingTribalResults}`);
  console.log(`Pending tribal: ${game.pendingTribal}`);
  console.log(`Required scene type: ${required || "any"}`);
  
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
    game.recordScene(sceneType);
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
      stats: game.stats,
      day: game.day,
      phase: game.phase,
      playerTribe: game.playerTribe,
      tribemates: game.getTribemates()
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
