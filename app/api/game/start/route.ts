import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import {
  LOCATIONS,
  TRIBE_NAMES,
  TRIBE_COLORS,
  ALL_STARS,
  pick,
  pickTwo,
  shuffle,
  generateGameId,
} from '@/lib/game-logic'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
  try {
    // Verify password
    const password = request.headers.get('x-site-password')
    const sitePassword = process.env.SITE_PASSWORD

    if (!password || password !== sitePassword) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid password' },
        { status: 401 }
      )
    }

    const { playerName } = await request.json()

    if (!playerName) {
      return NextResponse.json(
        { error: 'playerName required' },
        { status: 400 }
      )
    }

    // Generate game data
    const gameId = generateGameId()
    const location = pick(LOCATIONS)
    const [tribe1Name, tribe2Name] = pickTwo(TRIBE_NAMES)
    const [tribe1Color, tribe2Color] = pickTwo(TRIBE_COLORS)

    // Randomly select 18 all-stars from the larger pool
    const selectedAllStars = shuffle(ALL_STARS).slice(0, 18)
    const shuffledAllStars = shuffle(selectedAllStars)

    // Player goes in tribe1, rest split between tribes
    const tribe1Members = [playerName.trim(), ...shuffledAllStars.slice(0, 8)]
    const tribe2Members = shuffledAllStars.slice(8, 17)

    // Create game in Convex
    const gameData = await convex.mutation(api.games.createGame, {
      gameId,
      playerName: playerName.trim(),
      location,
      playerTribe: tribe1Name,
      opposingTribe: tribe2Name,
      tribeColors: {
        tribe1Name,
        tribe1Color,
        tribe2Name,
        tribe2Color,
      },
      tribes: {
        tribe1: tribe1Members,
        tribe2: tribe2Members,
      },
      stats: {
        Social: 2.5,
        Strategy: 2.5,
        Challenge: 2.5,
        Threat: 2.5,
      },
    })

    console.log(`New game started: ${gameId} for ${playerName}`)
    console.log(`Location: ${location}`)
    console.log(`Tribes: ${tribe1Name} vs ${tribe2Name}`)

    return NextResponse.json({
      gameId,
      location,
      playerTribe: tribe1Name,
      opposingTribe: tribe2Name,
      tribeColors: {
        [tribe1Name]: tribe1Color,
        [tribe2Name]: tribe2Color,
      },
      tribes: {
        [tribe1Name]: tribe1Members.map((name) => ({
          name,
          eliminated: false,
        })),
        [tribe2Name]: tribe2Members.map((name) => ({
          name,
          eliminated: false,
        })),
      },
      stats: gameData.stats,
    })
  } catch (error) {
    console.error('Error starting game:', error)
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    )
  }
}
