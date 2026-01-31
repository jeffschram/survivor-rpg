'use client'

import { useState, useRef, useEffect } from 'react'

interface StartScreenProps {
  onStart: (playerName: string) => void
  isLoading: boolean
}

export default function StartScreen({ onStart, isLoading }: StartScreenProps) {
  const [playerName, setPlayerName] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Preload theme music
    audioRef.current = new Audio('/audio/game-theme.mp3')
    audioRef.current.volume = 0.3
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim() || isLoading) return

    // Play theme music
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay blocked - that's okay
      })
    }

    onStart(playerName.trim())
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="bg-[#1a1a1a] p-8 rounded-xl border border-[#333] w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold text-amber-500 mb-2">
          🏝️ Survivor RPG
        </h1>
        <h2 className="text-xl text-white mb-6">All-Stars Edition</h2>

        <p className="text-[#888] mb-8">
          Outwit. Outplay. Outlast. Compete against legendary Survivor all-stars
          in this AI-powered adventure.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="playerName" className="block text-left text-[#888] mb-2">
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg 
                         text-white placeholder-[#666] focus:outline-none focus:border-amber-500"
              autoFocus
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !playerName.trim()}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-[#333] 
                       disabled:cursor-not-allowed rounded-lg font-bold text-lg
                       transition-colors text-white"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading-dot inline-block w-2 h-2 bg-white rounded-full" />
                <span className="loading-dot inline-block w-2 h-2 bg-white rounded-full" />
                <span className="loading-dot inline-block w-2 h-2 bg-white rounded-full" />
              </span>
            ) : (
              'Start Game'
            )}
          </button>
        </form>

        <p className="text-[#555] text-sm mt-6">
          39 days. 18 all-stars. 1 survivor.
        </p>
      </div>
    </div>
  )
}
