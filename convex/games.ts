import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Create a new game
export const createGame = mutation({
  args: {
    gameId: v.string(),
    playerName: v.string(),
    location: v.string(),
    playerTribe: v.string(),
    opposingTribe: v.string(),
    tribeColors: v.object({
      tribe1Name: v.string(),
      tribe1Color: v.string(),
      tribe2Name: v.string(),
      tribe2Color: v.string(),
    }),
    tribes: v.object({
      tribe1: v.array(v.string()),
      tribe2: v.array(v.string()),
    }),
    stats: v.object({
      Social: v.number(),
      Strategy: v.number(),
      Challenge: v.number(),
      Threat: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    const gameData = {
      gameId: args.gameId,
      playerName: args.playerName,
      location: args.location,
      playerTribe: args.playerTribe,
      opposingTribe: args.opposingTribe,
      tribeColors: args.tribeColors,
      tribes: args.tribes,
      eliminated: [],
      jury: [],
      day: 1,
      phase: "pre-merge",
      merged: false,
      mergedTribeName: undefined,
      sceneCount: 0,
      sceneIndexInDay: 0,
      lastSceneType: undefined,
      lastChallengeWon: undefined,
      pendingOpposingElimination: undefined,
      stats: args.stats,
      history: [],
      createdAt: now,
      updatedAt: now,
    }
    
    await ctx.db.insert("games", gameData)
    return gameData
  },
})

// Get a game by gameId
export const getGame = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first()
    return game
  },
})

// Update game state
export const updateGame = mutation({
  args: {
    gameId: v.string(),
    updates: v.object({
      eliminated: v.optional(v.array(v.string())),
      jury: v.optional(v.array(v.string())),
      day: v.optional(v.number()),
      phase: v.optional(v.string()),
      merged: v.optional(v.boolean()),
      mergedTribeName: v.optional(v.string()),
      sceneCount: v.optional(v.number()),
      sceneIndexInDay: v.optional(v.number()),
      lastSceneType: v.optional(v.string()),
      lastChallengeWon: v.optional(v.boolean()),
      pendingOpposingElimination: v.optional(v.string()),
      stats: v.optional(v.object({
        Social: v.number(),
        Strategy: v.number(),
        Challenge: v.number(),
        Threat: v.number(),
      })),
      tribes: v.optional(v.object({
        tribe1: v.array(v.string()),
        tribe2: v.array(v.string()),
      })),
      history: v.optional(v.array(v.object({
        role: v.string(),
        content: v.string(),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first()
    
    if (!game) {
      throw new Error("Game not found")
    }
    
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    }
    
    // Only include fields that are provided
    if (args.updates.eliminated !== undefined) updateData.eliminated = args.updates.eliminated
    if (args.updates.jury !== undefined) updateData.jury = args.updates.jury
    if (args.updates.day !== undefined) updateData.day = args.updates.day
    if (args.updates.phase !== undefined) updateData.phase = args.updates.phase
    if (args.updates.merged !== undefined) updateData.merged = args.updates.merged
    if (args.updates.mergedTribeName !== undefined) updateData.mergedTribeName = args.updates.mergedTribeName
    if (args.updates.sceneCount !== undefined) updateData.sceneCount = args.updates.sceneCount
    if (args.updates.sceneIndexInDay !== undefined) updateData.sceneIndexInDay = args.updates.sceneIndexInDay
    if (args.updates.lastSceneType !== undefined) updateData.lastSceneType = args.updates.lastSceneType
    if (args.updates.lastChallengeWon !== undefined) updateData.lastChallengeWon = args.updates.lastChallengeWon
    if (args.updates.pendingOpposingElimination !== undefined) updateData.pendingOpposingElimination = args.updates.pendingOpposingElimination
    if (args.updates.stats !== undefined) updateData.stats = args.updates.stats
    if (args.updates.tribes !== undefined) updateData.tribes = args.updates.tribes
    if (args.updates.history !== undefined) updateData.history = args.updates.history
    
    await ctx.db.patch(game._id, updateData)
    
    return { success: true }
  },
})

// List recent games (for potential game history feature)
export const listGames = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db
      .query("games")
      .withIndex("by_createdAt")
      .order("desc")
      .take(10)
    return games
  },
})

// Add message to history
export const addToHistory = mutation({
  args: {
    gameId: v.string(),
    message: v.object({
      role: v.string(),
      content: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first()
    
    if (!game) {
      throw new Error("Game not found")
    }
    
    const newHistory = [...game.history, args.message]
    
    await ctx.db.patch(game._id, {
      history: newHistory,
      updatedAt: Date.now(),
    })
    
    return { success: true }
  },
})
