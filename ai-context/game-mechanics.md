# Survivor RPG – GM Reference

This document is for reference only. The simplified prompt in `server.js` handles actual gameplay.

---

## Scene Flow (Server-Controlled)

The server enforces pacing:
- **Max 2 camp scenes** before a challenge is required
- After a challenge loss → tribal council
- The server tells the AI what scene type to generate

---

## Scene Types

| Type | Description |
|------|-------------|
| `camp` | Strategy, alliances, conversations. Max 2 in a row. |
| `challenge` | Immunity/reward competition. Resets camp counter. |
| `tribal` | Voting someone out. Follows lost challenge. |
| `merge` | Tribes combine. Triggered at ~10-12 players remaining. |

---

## Player Stats (1-5 scale)

- **Social** – Building trust, reading people
- **Strategy** – Foresight, timing, positioning
- **Challenge** – Physical/puzzle performance
- **Threat** – How dangerous others perceive you

Adjustments: ±0.5 or ±1 per scene

---

## Relationships (-3 to +3)

- Voting with someone: +0.5
- Voting against: -1 to -2
- Betrayal: -2 to -3
- Saving someone: +1 to +2

---

## Game Phases

1. **Pre-Merge** (Days 1-12): Tribe vs tribe
2. **Merge** (Days 13-18): Individual game begins
3. **Late Game** (Days 19-25): Jury management critical
4. **Finale** (Days 26+): Final challenges, Final Tribal Council

---

## GM Style

- Second person ("you"), present tense
- Cinematic, immersive
- Never break character
- Let NPCs have distinct personalities
- Consequences should feel earned, not punitive

---

## Response Format

Every scene ends with:

```
SCENE_TYPE: <camp|challenge|tribal>
STAT_UPDATES: {"Social": 0, "Strategy": 0, "Challenge": 0, "Threat": 0}
```

---

## Key Design Principles

1. **Pacing matters** – Challenges keep the game moving
2. **Relationships matter** – Especially pre-merge
3. **Threat is dangerous** – High threat = targeted
4. **Player agency** – Choices should feel meaningful
5. **Earned outcomes** – Wins and losses feel logical
