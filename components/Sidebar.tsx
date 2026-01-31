'use client'

import { useState, useEffect } from 'react'

interface TribeMember {
  name: string
  eliminated: boolean
}

interface SidebarProps {
  playerTribe: string
  opposingTribe: string
  tribeColors: Record<string, string>
  tribes: Record<string, TribeMember[]>
  day: number
  phase: string
}

export default function Sidebar({
  playerTribe,
  opposingTribe,
  tribeColors,
  tribes,
  day,
  phase,
}: SidebarProps) {
  const [selectedVoice, setSelectedVoice] = useState('')
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      const englishVoices = availableVoices.filter((v) =>
        v.lang.startsWith('en')
      )
      setVoices(englishVoices)

      // Load saved preferences
      const savedVoice = localStorage.getItem('voiceName')
      const savedSpeed = localStorage.getItem('playbackSpeed')

      if (savedVoice) {
        setSelectedVoice(savedVoice)
      } else if (englishVoices.length > 0) {
        // Default to a natural-sounding voice
        const defaultVoice =
          englishVoices.find((v) => v.name.includes('Google UK English Male')) ||
          englishVoices.find((v) => v.name.includes('Daniel')) ||
          englishVoices[0]
        if (defaultVoice) setSelectedVoice(defaultVoice.name)
      }

      if (savedSpeed) {
        setPlaybackSpeed(parseFloat(savedSpeed))
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName)
    localStorage.setItem('voiceName', voiceName)
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    localStorage.setItem('playbackSpeed', speed.toString())
  }

  const playerTribeMembers = tribes[playerTribe] || []
  const opposingTribeMembers = tribes[opposingTribe] || []
  const playerActiveCount = playerTribeMembers.filter((m) => !m.eliminated).length
  const opposingActiveCount = opposingTribeMembers.filter((m) => !m.eliminated).length

  return (
    <aside className="w-72 bg-[#1a1a1a] border-r border-[#333] h-screen overflow-y-auto p-4">
      {/* Game Status */}
      <div className="mb-6">
        <h2 className="text-amber-500 font-bold text-lg mb-2">Day {day}</h2>
        <p className="text-[#888] text-sm capitalize">{phase} Phase</p>
      </div>

      {/* Player's Tribe */}
      <div className="mb-6">
        <h3
          className="font-bold text-white px-3 py-2 rounded-md mb-2"
          style={{ backgroundColor: tribeColors[playerTribe] || '#333' }}
        >
          {playerTribe} ({playerActiveCount})
        </h3>
        <ul className="space-y-1">
          {playerTribeMembers.map((member) => (
            <li
              key={member.name}
              className={`tribe-member ${member.eliminated ? 'eliminated' : ''}`}
              style={{ backgroundColor: tribeColors[playerTribe] || '#333' }}
            >
              {member.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Opposing Tribe */}
      <div className="mb-6">
        <h3
          className="font-bold text-white px-3 py-2 rounded-md mb-2"
          style={{ backgroundColor: tribeColors[opposingTribe] || '#333' }}
        >
          {opposingTribe} ({opposingActiveCount})
        </h3>
        <ul className="space-y-1">
          {opposingTribeMembers.map((member) => (
            <li
              key={member.name}
              className={`tribe-member ${member.eliminated ? 'eliminated' : ''}`}
              style={{ backgroundColor: tribeColors[opposingTribe] || '#333' }}
            >
              {member.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Settings */}
      <div className="border-t border-[#333] pt-4">
        <h3 className="text-[#888] font-semibold mb-3">Settings</h3>

        {/* Voice Selection */}
        <div className="mb-4">
          <label className="block text-[#666] text-sm mb-1">Narrator Voice</label>
          <select
            value={selectedVoice}
            onChange={(e) => handleVoiceChange(e.target.value)}
            className="w-full bg-[#252525] border border-[#333] rounded px-2 py-1.5 
                       text-white text-sm focus:outline-none focus:border-amber-500"
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>

        {/* Playback Speed */}
        <div className="mb-4">
          <label className="block text-[#666] text-sm mb-1">
            Speed: {playbackSpeed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={playbackSpeed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
      </div>
    </aside>
  )
}
