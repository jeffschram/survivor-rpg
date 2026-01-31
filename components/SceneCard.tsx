'use client'

import { useState, useEffect, useRef } from 'react'

interface Choice {
  id: string
  text: string
}

interface SceneCardProps {
  content: string
  sceneType: string
  isLoading?: boolean
  choices: Choice[]
  onChoiceSelect: (choiceId: string) => void
  gameOver?: boolean
  gameOverReason?: string
}

const SCENE_EMOJIS: Record<string, string> = {
  camp: '🏕️',
  challenge: '🏆',
  challenge_results: '📊',
  tribal: '🔥',
  tribal_results: '🗳️',
  merge: '🤝',
  reward: '🎁',
  finale: '👑',
}

export default function SceneCard({
  content,
  sceneType,
  isLoading,
  choices,
  onChoiceSelect,
  gameOver,
  gameOverReason,
}: SceneCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Stop speaking when content changes
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [content])

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const text = contentRef.current?.innerText || content
    const utterance = new SpeechSynthesisUtterance(text)

    // Get saved voice
    const voiceName = localStorage.getItem('voiceName')
    const voices = window.speechSynthesis.getVoices()
    const voice = voices.find((v) => v.name === voiceName)
    if (voice) utterance.voice = voice

    // Get saved speed
    const speed = parseFloat(localStorage.getItem('playbackSpeed') || '1.0')
    utterance.rate = speed

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }

  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-8">
        <div className="flex items-center justify-center gap-2">
          <span className="loading-dot inline-block w-3 h-3 bg-amber-500 rounded-full" />
          <span className="loading-dot inline-block w-3 h-3 bg-amber-500 rounded-full" />
          <span className="loading-dot inline-block w-3 h-3 bg-amber-500 rounded-full" />
        </div>
      </div>
    )
  }

  // Game over state
  if (gameOver) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-red-800 p-8 text-center">
        <h2 className="text-3xl font-bold text-red-500 mb-4">🔥 Game Over 🔥</h2>
        <p className="text-xl text-[#ccc] mb-6">{gameOverReason}</p>
        <div ref={contentRef} className="mb-6">
          {formatNarrative(content, sceneType)}
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="px-8 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-bold text-lg"
        >
          Play Again
        </button>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-6 relative">
      {/* TTS Button */}
      <button
        onClick={handleSpeak}
        className={`tts-btn absolute top-4 right-4 ${isSpeaking ? 'speaking' : ''}`}
        title={isSpeaking ? 'Stop reading' : 'Read aloud'}
      >
        {isSpeaking ? '⏹️' : '🔊'}
      </button>

      {/* Scene Content */}
      <div ref={contentRef} className="pr-12">
        {formatNarrative(content, sceneType)}
      </div>

      {/* Choices - Now from app, not parsed from AI */}
      {choices.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm text-[#888] mb-2">What do you do?</p>
          {choices.map((choice, index) => (
            <button
              key={choice.id}
              onClick={() => onChoiceSelect(choice.id)}
              className="choice-btn w-full text-left"
            >
              <span className="choice-letter">{String.fromCharCode(65 + index)})</span>
              {' '}{choice.text}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function formatNarrative(content: string, sceneType: string): React.ReactNode {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip choice lines if any slipped through
    if (/^[A-D]\)/.test(trimmed)) continue
    if (trimmed.startsWith('SCENE_TYPE') || trimmed.startsWith('STAT_UPDATES')) continue

    // Handle headings
    if (trimmed.startsWith('###')) {
      const title = trimmed.replace(/^###\s*/, '').replace(/^Title:\s*/i, '')
      const emoji = SCENE_EMOJIS[sceneType] || ''
      elements.push(
        <h3 key={i} className="scene-title">
          <span aria-hidden="true">{emoji}</span> {title}
        </h3>
      )
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      // Bold text
      elements.push(
        <p key={i} className="font-bold text-white mb-2">
          {trimmed.slice(2, -2)}
        </p>
      )
    } else if (trimmed) {
      // Regular paragraph
      elements.push(
        <p key={i} className="text-[#ccc] mb-3 leading-relaxed">
          {trimmed}
        </p>
      )
    }
  }

  return <>{elements}</>
}
