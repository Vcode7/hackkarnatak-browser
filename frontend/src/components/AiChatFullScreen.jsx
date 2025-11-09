import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Mic, Loader2, Volume2, VolumeX, Minimize2 } from 'lucide-react'
import { useBrowser } from '../context/BrowserContext'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AiChatFullScreen() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcribingText, setTranscribingText] = useState('')
  const [typingMessageIndex, setTypingMessageIndex] = useState(null)
  const [displayedContent, setDisplayedContent] = useState('')
  const [activeGroupId, setActiveGroupId] = useState(null)

  const messagesEndRef = useRef(null)
  const typingIntervalRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const { activeTab } = useBrowser()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('aiChatMessages')
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(parsed)
      } catch (e) {
        console.error('Error loading saved messages:', e)
        setMessages([{
          role: 'assistant',
          content: 'Hi! I\'m AiChat in full-screen mode. How can I help you?'
        }])
      }
    } else {
      setMessages([{
        role: 'assistant',
        content: 'Hi! I\'m AiChat in full-screen mode. How can I help you?'
      }])
    }

    // Load active group ID
    const savedGroupId = localStorage.getItem('active_group_id')
    if (savedGroupId) {
      setActiveGroupId(savedGroupId)
    }
  }, [])

  const getPageContent = async () => {
    // Similar to AiChat.jsx - simplified version
    if (!activeTab?.url || activeTab.url === '') {
      return "No active page loaded."
    }

    // Check if URL is a document
    const url = activeTab.url.toLowerCase()
    const isDocument = url.endsWith('.pdf') || url.endsWith('.docx') || url.endsWith('.xlsx')
    
    if (isDocument) {
      try {
        const response = await axios.post(`${API_URL}/api/document/parse`, {
          url: activeTab.url
        })
        
        if (response.data.success) {
          return `Document: ${response.data.title}\nType: ${response.data.doc_type}\n\nContent:\n${response.data.content}`
        }
      } catch (error) {
        console.error('Error parsing document:', error)
      }
    }

    if (!activeTab?.webview) {
      return `Current page: ${activeTab?.url || 'No page loaded'}`
    }

    try {
      const pageText = await activeTab.webview.executeJavaScript(`
        (function() {
          try {
            const bodyText = document.body ? document.body.innerText : ''
            const title = document.title || ''
            return JSON.stringify({ title, content: bodyText.slice(0, 10000) })
          } catch (e) {
            return JSON.stringify({ error: e.message })
          }
        })()
      `)

      const parsed = JSON.parse(pageText)
      return `Current page: ${parsed.title}\nURL: ${activeTab.url}\n\nContent:\n${parsed.content}`
    } catch (error) {
      return `Current page: ${activeTab?.url || 'No page loaded'}`
    }
  }

  const handleSendMessage = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return

    const userMessage = { role: 'user', content: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const pageContent = await getPageContent()

      const response = await axios.post(`${API_URL}/api/ai/chat`, {
        query: messageText,
        context: pageContent,
        page_url: activeTab?.url,
        group_id: activeGroupId || null
      })

      const assistantMessage = {
        role: 'assistant',
        content: response.data.text,
        audio: response.data.audio_base64,
        isTyping: true
      }

      setMessages(prev => [...prev, assistantMessage])
      
      const messageIndex = messages.length + 1
      startTypingAnimation(messageIndex, response.data.text)

      if (response.data.audio_base64) {
        const typingDuration = response.data.text.length * 20
        setTimeout(() => {
          playAudio(response.data.audio_base64)
        }, typingDuration)
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

  const startTypingAnimation = (messageIndex, fullText) => {
    setTypingMessageIndex(messageIndex)
    setDisplayedContent('')
    
    let currentIndex = 0
    const typingSpeed = 20
    
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
    }
    
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedContent(fullText.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(typingIntervalRef.current)
        setTypingMessageIndex(null)
        setMessages(prev => prev.map((msg, idx) => 
          idx === messageIndex ? { ...msg, isTyping: false } : msg
        ))
      }
    }, typingSpeed)
  }

  const playAudio = (audioBase64) => {
    if (currentAudio) {
      currentAudio.pause()
    }

    const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`)
    setCurrentAudio(audio)
    setIsPlaying(true)

    audio.onended = () => {
      setIsPlaying(false)
      setCurrentAudio(null)
    }

    audio.play().catch(err => {
      console.error('Error playing audio:', err)
      setIsPlaying(false)
    })
  }

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setIsPlaying(false)
      setCurrentAudio(null)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleMinimize = () => {
    // Save messages and dispatch event to close this tab
    localStorage.setItem('aiChatMessages', JSON.stringify(messages))
    
    // Dispatch event to close the AI chat tab
    const event = new CustomEvent('close-ai-chat-tab')
    window.dispatchEvent(event)
  }

  const handleClose = () => {
    // Save messages and close the tab
    localStorage.setItem('aiChatMessages', JSON.stringify(messages))
    
    // Dispatch event to close this tab
    const event = new CustomEvent('close-ai-chat-tab')
    window.dispatchEvent(event)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <MessageCircle size={24} />
          <div>
            <h1 className="text-xl font-semibold">AiChat Assistant - Full Screen</h1>
            {activeGroupId && (
              <p className="text-sm opacity-70">🔗 Using Group Context</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isPlaying && (
            <button
              onClick={stopAudio}
              className="p-2 hover:bg-primary-foreground/20 rounded"
              title="Stop Audio"
            >
              <VolumeX size={20} />
            </button>
          )}
          <button
            onClick={handleMinimize}
            className="p-2 hover:bg-primary-foreground/20 rounded"
            title="Minimize - Close Tab"
          >
            <Minimize2 size={20} />
          </button>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-primary-foreground/20 rounded"
            title="Close Tab"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {message.role === 'assistant' && message.isTyping && typingMessageIndex === index ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse" {...props} />
                          </div>
                        ),
                        code: ({node, inline, ...props}) => (
                          inline ? 
                            <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} /> :
                            <div className="overflow-x-auto my-2">
                              <code className="block bg-muted p-3 rounded text-sm" {...props} />
                            </div>
                        )
                      }}
                    >
                      {displayedContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse" {...props} />
                          </div>
                        ),
                        code: ({node, inline, ...props}) => (
                          inline ? 
                            <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} /> :
                            <div className="overflow-x-auto my-2">
                              <code className="block bg-muted p-3 rounded text-sm" {...props} />
                            </div>
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
                {message.audio && !message.isTyping && (
                  <button
                    onClick={() => playAudio(message.audio)}
                    className="mt-2 flex items-center gap-2 text-sm opacity-70 hover:opacity-100"
                  >
                    <Volume2 size={16} />
                    Play Audio
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-secondary-foreground rounded-lg p-4">
                <Loader2 className="animate-spin" size={20} />
              </div>
            </div>
          )}
          {transcribingText && (
            <div className="flex justify-center">
              <div className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm">
                {transcribingText}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-background">
        <div className="max-w-4xl mx-auto w-full flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 p-3 bg-secondary text-secondary-foreground rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send Message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
