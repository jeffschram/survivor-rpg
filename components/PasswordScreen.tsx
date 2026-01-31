'use client'

import { useState } from 'react'

interface PasswordScreenProps {
  onAuthenticated: () => void
}

export default function PasswordScreen({ onAuthenticated }: PasswordScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        // Store password for subsequent requests
        sessionStorage.setItem('sitePassword', password)
        onAuthenticated()
      } else {
        setError(data.error || 'Invalid password')
      }
    } catch {
      setError('Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="bg-[#1a1a1a] p-8 rounded-xl border border-[#333] w-full max-w-md">
        <h1 className="text-2xl font-bold text-amber-500 mb-2 text-center">
          🏝️ Survivor RPG: All-Stars
        </h1>
        <p className="text-[#888] text-center mb-6">Enter password to continue</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg 
                       text-white placeholder-[#666] focus:outline-none focus:border-amber-500
                       mb-4"
            autoFocus
          />

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-[#333] 
                       disabled:cursor-not-allowed rounded-lg font-semibold 
                       transition-colors text-white"
          >
            {isLoading ? 'Authenticating...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
