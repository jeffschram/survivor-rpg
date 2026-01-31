# Survivor RPG: All-Stars

An AI-powered Survivor RPG where you compete against legendary Survivor all-stars. Built with Next.js, React, and Convex.

## Features

- 🏝️ Compete against 18 Survivor all-stars
- 🎮 AI-powered game master using OpenAI
- 💾 Persistent game state with Convex
- 🔊 Text-to-speech narration
- 📱 Responsive design
- 🔗 Shareable game URLs

## Prerequisites

- **Node.js 18+** (required for Next.js and Convex)
- OpenAI API key
- Convex account (free at https://convex.dev)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-4o-mini"

# Site Password
SITE_PASSWORD="your-password"

# Convex Configuration (get from Convex dashboard after step 3)
NEXT_PUBLIC_CONVEX_URL="https://your-project.convex.cloud"
```

### 3. Initialize Convex

```bash
npx convex dev
```

This will:
- Prompt you to log in to Convex
- Create a new project (or link to existing)
- Generate the `NEXT_PUBLIC_CONVEX_URL`
- Deploy your schema and functions

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/              # Password authentication
│   │   └── game/
│   │       ├── start/         # Create new game
│   │       └── [gameId]/scene # Generate scenes
│   ├── game/[gameId]/         # Game page
│   └── page.tsx               # Start screen
├── components/
│   ├── PasswordScreen.tsx
│   ├── StartScreen.tsx
│   ├── Sidebar.tsx
│   └── SceneCard.tsx
├── convex/
│   ├── schema.ts              # Database schema
│   └── games.ts               # Convex functions
├── lib/
│   └── game-logic.ts          # Game constants and helpers
└── public/
    └── audio/
        └── game-theme.mp3
```

## Game Mechanics

- **39 Days**: Progress through the full Survivor experience
- **Tribe Phase**: Compete in tribe challenges, attend tribal councils
- **Merge**: At 10 players, tribes merge for individual game
- **Jury**: Last 9 eliminated players form the jury
- **Final Tribal Council**: Make your case to win the game

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

### Convex Production

```bash
npx convex deploy
```

## Legacy Server

The original Express server is preserved in `server.js`. To run it:

```bash
npm run old-server
```

## License

MIT
