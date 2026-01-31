'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SceneCard from '@/components/SceneCard'

interface TribeMember {
  name: string
  eliminated: boolean
}

interface GameData {
  message: string
  sceneType: string
  sceneDescription: string
  sceneIndex: number
  stats: Record<string, number>
  day: number
  phase: string
  playerTribe: string
  opposingTribe: string
  tribeColors: Record<string, string>
  tribes: Record<string, TribeMember[]>
}

export default function GamePage() {
  const params = useParams()
  const gameId = params.gameId as string

  const [gameData, setGameData] = useState<GameData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchScene = useCallback(async (userInput?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/game/${gameId}/scene`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch scene')
      }

      const data = await response.json()
      setGameData(data)

      // Log scene info to console
      console.log(`Day ${data.day} | Scene ${data.sceneIndex} | [gameId]/page.tsxType: ${data.sceneType}`)
      console.log(`Description: ${data.sceneDescription}`)
      
      const playerCount = data.tribes[data.playerTribe].filter((m: TribeMember) => !m.eliminated).length
      const opposingCount = data.tribes[data.opposingTribe].filter((m: TribeMember) => !m.eliminated).length
      console.log(`Contestants: ${playerCount + opposingCount} (${data.playerTribe}: ${playerCount}, ${data.opposingTribe}: ${opposingCount})`)
    } catch (err) {
      console.error('Error fetching scene:', err)
      setError('Failed to load scene. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  // Fetch initial scene on mount
  useEffect(() => {
    fetchScene()
  }, [fetchScene])

  const handleChoiceSelect = (choice: string) => {
    // Extract just the choice letter or full text
    const match = choice.match(/^([A-D])\)/)
    const response = match ? `I choose ${match[1]}` : choice
    fetchScene(response)
  }

  const handleCustomResponse = (response: string) => {
    fetchScene(response)
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="bg-[#1a1a1a] p-8 rounded-xl border border-[#333] text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchScene()}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      {gameData && (
        <Sidebar
          playerTribe={gameData.playerTribe}
          opposingTribe={gameData.opposingTribe}
          tribeColors={gameData.tribeColors}
          tribes={gameData.tribes}
          day={gameData.day}
          phase={gameData.phase}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Game Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-amber-500">
              🏝️ Survivor RPG: All-Stars
            </h1>
            {gameData && (
              <p className="text-[#888] mt-1">
                Game ID: <code className="text-[#666]">{gameId}</code>
              </p>
            )}
          </div>

          {/* Scene Card */}
          <SceneCard
            content={gameData?.message || ''}
            sceneType={gameData?.sceneType || 'camp'}
            isLoading={isLoading}
            onChoiceSelect={handleChoiceSelect}
            onCustomResponse={handleCustomResponse}
          />
        </div>
      </main>
    </div>
  )
}
