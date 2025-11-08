import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useBrowser } from '../context/BrowserContext'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function VoiceRecorder({ isActive, onToggle }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const { updateTabUrl, activeTabId, navigateBack, navigateForward, refresh, addTab, closeTab, switchTab, tabs } = useBrowser()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processVoiceCommand(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processVoiceCommand = async (audioBlob) => {
    setIsProcessing(true)
    try {
      // Convert blob to base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1]
        
        // Send to backend
        const response = await axios.post(`${API_URL}/api/voice/command`, {
          audio_data: base64Audio
        })

        const { action, data, message, is_aichat_query } = response.data

        console.log('Voice command:', { action, data, message, is_aichat_query })

        // Execute command
        executeCommand(action, data, is_aichat_query)
      }
    } catch (error) {
      console.error('Error processing voice command:', error)
      alert('Error processing voice command: ' + (error.response?.data?.detail || error.message))
    } finally {
      setIsProcessing(false)
    }
  }

  const executeCommand = (action, data, isAiChatQuery) => {
    if (isAiChatQuery) {
      // Let AiChat component handle this
      window.dispatchEvent(new CustomEvent('aichat-query', {
        detail: { action, data }
      }))
      return
    }

    switch (action) {
      case 'open_url':
        if (data?.url) {
          updateTabUrl(activeTabId, data.url)
        }
        break
      case 'back':
        navigateBack()
        break
      case 'forward':
        navigateForward()
        break
      case 'refresh':
        refresh()
        break
      case 'new_tab':
        addTab()
        break
      case 'close_tab':
        closeTab(activeTabId)
        break
      case 'switch_tab':
        const index = data?.index
        if (typeof index === 'number') {
          if (index > 0 && index < tabs.length) {
            switchTab(tabs[index].id)
          } else if (index === 1 || index === -1) {
            // Relative switching
            const currentIndex = tabs.findIndex(t => t.id === activeTabId)
            const newIndex = currentIndex + index
            if (newIndex >= 0 && newIndex < tabs.length) {
              switchTab(tabs[newIndex].id)
            }
          }
        }
        break
      case 'search':
        if (data?.query) {
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(data.query)}`
          updateTabUrl(activeTabId, searchUrl)
        }
        break
      default:
        console.log('Unknown action:', action)
    }
  }

  const handleClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`
        p-2 rounded transition-colors
        ${isRecording ? 'bg-destructive text-destructive-foreground animate-pulse' : 'hover:bg-secondary'}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={isRecording ? 'Stop Recording' : 'Start Voice Command'}
    >
      {isProcessing ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isRecording ? (
        <MicOff size={18} />
      ) : (
        <Mic size={18} />
      )}
    </button>
  )
}
