import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Mic, Loader2, Volume2, VolumeX } from 'lucide-react'
import { useBrowser } from '../context/BrowserContext'
import { isCapacitor, isElectron } from '../utils/platform'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m AiChat, your AI assistant. I can help you browse, summarize pages, and answer questions. Just say "Hey AiChat" followed by your request!'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcribingText, setTranscribingText] = useState('')
  const [recordingMode, setRecordingMode] = useState(null) // 'tap' or 'hold'

  const messagesEndRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const { activeTab } = useBrowser()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Listen for voice command events and text selection AI chat
  useEffect(() => {
    const handleAiChatQuery = async (event) => {
      const { action, data } = event.detail

      if (action === 'summarize_page') {
        setIsOpen(true)
        await handleSummarizePage()
      } else if (action === 'question' && data?.query) {
        setIsOpen(true)
        await handleSendMessage(data.query)
      }
    }

    const handleOpenAiChat = async (event) => {
      const { message, context } = event.detail
      setIsOpen(true)
      if (message) {
        await handleSendMessage(message, context)
      }
    }

    window.addEventListener('aichat-query', handleAiChatQuery)
    window.addEventListener('open-ai-chat', handleOpenAiChat)

    return () => {
      window.removeEventListener('aichat-query', handleAiChatQuery)
      window.removeEventListener('open-ai-chat', handleOpenAiChat)
    }
  }, [activeTab])


  const getPageContent = async () => {
    // Check if we have an active tab with a URL
    if (!activeTab?.url || activeTab.url === '') {
      return "No active page loaded. Currently on home page.";
    }

    // Check if webview is available
    if (!activeTab?.webview) {
      return `Current page: ${activeTab?.url || 'No page loaded'} (content not accessible)`;
    }

    try {
      // Evaluate JavaScript inside the webview to get page text
      const pageText = await activeTab.webview.executeJavaScript(`
        (function() {
          try {
            const bodyText = document.body ? document.body.innerText : '';
            const title = document.title || '';
            const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
            return JSON.stringify({
              title: title,
              description: metaDescription,
              content: bodyText.slice(0, 5000) // limit to 5k chars
            });
          } catch (e) {
            return JSON.stringify({ error: e.message });
          }
        })()
      `);

      const parsed = JSON.parse(pageText);
      if (parsed.error) {
        console.error('Error in webview script:', parsed.error);
        return `Current page: ${activeTab?.url} (content extraction failed)`;
      }

      const result = `Current page: ${parsed.title}\nURL: ${activeTab.url}\n${parsed.description ? 'Description: ' + parsed.description + '\n' : ''}\nContent:\n${parsed.content}`;
      console.log('Page content extracted:', result.slice(0, 200) + '...');
      return result;
    } catch (error) {
      console.error('Error extracting page content:', error);
      return `Current page: ${activeTab?.url || 'No page loaded'} (error: ${error.message})`;
    }
  };



  const handleSendMessage = async (messageText = input, additionalContext = null) => {
    if (!messageText.trim() || isLoading) return

    const userMessage = { role: 'user', content: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const pageContent = await getPageContent()

      // Combine page content with additional context (e.g., selected text)
      const contextToSend = additionalContext
        ? `${pageContent}\n\nSelected Text: ${additionalContext}`
        : pageContent

      const response = await axios.post(`${API_URL}/api/ai/chat`, {
        query: messageText,
        context: contextToSend,
        page_url: activeTab?.url
      })

      const assistantMessage = {
        role: 'assistant',
        content: response.data.text,
        audio: response.data.audio_base64
      }

      setMessages(prev => [...prev, assistantMessage])

      // Auto-play audio if available
      if (response.data.audio_base64) {
        playAudio(response.data.audio_base64)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSummarizePage = async () => {
    if (isLoading) return

    const userMessage = { role: 'user', content: 'Summarize this page' }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const pageContent = await getPageContent()

      const response = await axios.post(`${API_URL}/api/ai/summarize`, {
        content: pageContent,
        url: activeTab?.url
      })

      const assistantMessage = {
        role: 'assistant',
        content: response.data.text,
        audio: response.data.audio_base64
      }

      setMessages(prev => [...prev, assistantMessage])

      if (response.data.audio_base64) {
        playAudio(response.data.audio_base64)
      }
    } catch (error) {
      console.error('Error summarizing:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I couldn\'t summarize the page. Please try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const playAudio = (base64Audio) => {
    try {
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
        currentAudio.onplay = null
        currentAudio.onended = null
        currentAudio.onerror = null
        currentAudio.onpause = null
      }

      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`)

      audio.onplay = () => {
        console.log('Audio started playing')
        setIsPlaying(true)
      }

      audio.onended = () => {
        console.log('Audio ended')
        setIsPlaying(false)
        setCurrentAudio(null)
      }

      audio.onerror = (e) => {
        console.error('Audio error:', e)
        setIsPlaying(false)
        setCurrentAudio(null)
      }

      audio.onpause = () => {
        console.log('Audio paused')
        setIsPlaying(false)
      }

      setCurrentAudio(audio)
      audio.play().catch(err => {
        console.error('Failed to play audio:', err)
        setIsPlaying(false)
        setCurrentAudio(null)
      })
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
      setCurrentAudio(null)
    }
  }

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      currentAudio.onplay = null
      currentAudio.onended = null
      currentAudio.onerror = null
      currentAudio.onpause = null
      setIsPlaying(false)
      setCurrentAudio(null)
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.onplay = null
        currentAudio.onended = null
        currentAudio.onerror = null
        currentAudio.onpause = null
      }
    }
  }, [currentAudio])

  const startRecording = async (mode = 'tap') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setRecordingMode(mode)
      setTranscribingText('Listening...')

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setTranscribingText('Transcribing...')
        await transcribeAndSend(audioBlob)
        stream.getTracks().forEach(track => track.stop())
        setTranscribingText('')
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Auto-stop after 3-4 seconds for tap mode
      if (mode === 'tap') {
        const autoStopTime = 3000 + Math.random() * 1000 // 3-4 seconds
        recordingTimerRef.current = setTimeout(() => {
          stopRecording()
        }, autoStopTime)
      }
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone.')
      setTranscribingText('')
    }
  }

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingMode(null)
    }
  }

  const handleMouseDown = () => {
    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      // Long press detected - hold mode
      startRecording('hold')
    }, 500) // 500ms to detect long press
  }

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null

      // If not recording yet, it was a tap
      if (!isRecording) {
        startRecording('tap')
      }
    } else if (isRecording && recordingMode === 'hold') {
      // Release in hold mode - stop recording
      stopRecording()
    }
  }

  const handleMouseLeave = () => {
    // Clean up long press timer if mouse leaves
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const transcribeAndSend = async (audioBlob) => {
    try {
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1]

        // Transcribe
        const response = await axios.post(`${API_URL}/api/voice/command`, {
          audio_data: base64Audio
        })

        // Show transcription as a user message
        if (response.data.message) {
          setTranscribingText('')
          const transcriptionMessage = {
            role: 'user',
            content: response.data.message,
            isTranscription: true
          }
          setMessages(prev => [...prev, transcriptionMessage])

          // Then send to AI
          setIsLoading(true)
          await handleSendMessage(response.data.message)
        }
      }
    } catch (error) {
      console.error('Error transcribing:', error)
      setTranscribingText('')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I could not transcribe the audio. Please try again.'
      }])
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }



  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform z-[100] ${isCapacitor() ? 'bottom-20 right-4' : 'bottom-6 right-6'
          }`}
        title="Open AiChat"
      >
        <MessageCircle size={24} />
      </button>
    )
  }

  return (
       <div className="fixed bottom-6 right-6 w-72 sm:w-96 bg-background border border-border rounded-lg shadow-2xl flex flex-col z-40 h-[600px]">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <h3 className="font-semibold">AiChat Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          {isPlaying && (
            <button
              onClick={stopAudio}
              className="p-1 hover:bg-primary-foreground/20 rounded"
              title="Stop Audio"
            >
              <VolumeX size={18} />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-primary-foreground/20 rounded"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] p-3 rounded-lg
                ${message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
                }
              `}
            >
              {message.isTranscription && (
                <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                  <Mic size={12} />
                  <span>Voice transcription</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.audio && (
                <button
                  onClick={() => playAudio(message.audio)}
                  className="mt-2 flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
                >
                  <Volume2 size={14} />
                  Play Audio
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary p-3 rounded-lg">
              <Loader2 size={20} className="animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            rows={2}
            className="flex-1 px-3 py-2 bg-secondary rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2">
            <button
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              disabled={isLoading}
              className={`
                p-2 rounded-lg transition-colors select-none
                ${isRecording
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-secondary hover:bg-muted'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title={isRecording ? (recordingMode === 'hold' ? 'Release to stop' : 'Recording...') : 'Tap: 3-4s | Hold: Until release'}
            >
              <Mic size={20} />
            </button>
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send Message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
        <div className="mt-2 space-y-2">
          <div className="flex gap-2 items-center">
            <button
              onClick={handleSummarizePage}
              disabled={isLoading}
              className="text-xs px-3 py-1 bg-secondary hover:bg-muted rounded-full disabled:opacity-50"
            >
              Summarize Page
            </button>
            {isRecording && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                {recordingMode === 'tap' ? 'Recording (auto-stop)' : 'Recording (hold to continue)'}
              </span>
            )}
          </div>

          {/* Live transcription display below mic button */}
          {transcribingText && (
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg border border-border">
              <Mic size={14} className="text-primary animate-pulse flex-shrink-0" />
              <span className="text-xs text-foreground">{transcribingText}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
