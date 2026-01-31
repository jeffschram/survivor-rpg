'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PasswordScreen from '@/components/PasswordScreen'
import StartScreen from '@/components/StartScreen'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  const handleStartGame = async (playerName: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Site-Password': sessionStorage.getItem('sitePassword') || '',
        },
        body: JSON.stringify({ playerName }),
      })

      if (!response.ok) {
        throw new Error('Failed to start game')
      }

      const data = await response.json()
      router.push(`/game/${data.gameId}`)
    } catch (error) {
      console.error('Error starting game:', error)
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return <PasswordScreen onAuthenticated={handleAuthenticated} />
  }

  return <StartScreen onStart={handleStartGame} isLoading={isLoading} />
}
