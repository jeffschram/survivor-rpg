import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  games: defineTable({
    // Unique game identifier
    gameId: v.string(),
    
    // Player info
    playerName: v.string(),
    
    // Game location
    location: v.string(),
    
    // Tribes
    playerTribe: v.string(),
    opposingTribe: v.string(),
    tribeColors: v.object({
      tribe1Name: v.string(),
      tribe1Color: v.string(),
      tribe2Name: v.string(),
      tribe2Color: v.string(),
    }),
    
    // Tribe members - stored as JSON strings for flexibility
    tribes: v.object({
      tribe1: v.array(v.string()),
      tribe2: v.array(v.string()),
    }),
    
    // Game state
    eliminated: v.array(v.string()),
    jury: v.array(v.string()),
    day: v.number(),
    phase: v.string(), // "pre-merge" | "merge" | "merged"
    merged: v.boolean(),
    mergedTribeName: v.optional(v.string()),
    
    // Scene tracking
    sceneCount: v.number(),
    sceneIndexInDay: v.number(),
    lastSceneType: v.optional(v.string()),
    lastChallengeWon: v.optional(v.boolean()),
    pendingOpposingElimination: v.optional(v.string()),
    
    // Player stats
    stats: v.object({
      Social: v.number(),
      Strategy: v.number(),
      Challenge: v.number(),
      Threat: v.number(),
    }),
    
    // Chat history for AI context
    history: v.array(v.object({
      role: v.string(),
      content: v.string(),
    })),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_createdAt", ["createdAt"]),
})
