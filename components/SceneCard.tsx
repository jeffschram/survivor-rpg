'use client'

import { useState, useEffect, useRef } from 'react'

interface SceneCardProps {
  content: string
  sceneType: string
  isLoading?: boolean
  onChoiceSelect: (choice: string) => void
  onCustomResponse: (response: string) => void
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
  onChoiceSelect,
  onCustomResponse,
}: SceneCardProps) {
  const [customInput, setCustomInput] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Parse content to extract choices
  const { narrative, choices } = parseContent(content)

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

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customInput.trim()) {
      onCustomResponse(customInput.trim())
      setCustomInput('')
    }
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
        {formatNarrative(narrative, sceneType)}
      </div>

      {/* Choices */}
      {choices.length > 0 && (
        <div className="mt-6 space-y-2">
          {choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => onChoiceSelect(choice)}
              className="choice-btn w-full"
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      {/* Custom Response */}
      <form onSubmit={handleCustomSubmit} className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Or type your own response..."
            className="flex-1 px-4 py-2 bg-[#252525] border border-[#333] rounded-lg 
                       text-white placeholder-[#666] focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!customInput.trim()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-[#333] 
                       disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

function parseContent(content: string): { narrative: string; choices: string[] } {
  const lines = content.split('\n')
  const choices: string[] = []
  const narrativeLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^[A-D]\)/.test(trimmed)) {
      choices.push(trimmed)
    } else if (trimmed && !trimmed.startsWith('SCENE_TYPE') && !trimmed.startsWith('STAT_UPDATES')) {
      narrativeLines.push(line)
    }
  }

  return {
    narrative: narrativeLines.join('\n').trim(),
    choices,
  }
}

function formatNarrative(narrative: string, sceneType: string): React.ReactNode {
  const lines = narrative.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

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
