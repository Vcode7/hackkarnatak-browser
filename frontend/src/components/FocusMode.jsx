import { useState, useEffect } from 'react'
import { Target, X, Check, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function FocusMode({ onUrlCheck }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSession, setActiveSession] = useState(null)
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [allowedDomains, setAllowedDomains] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    checkActiveSession()
  }, [])

  const checkActiveSession = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/focus/active`)
      if (response.data.active) {
        setActiveSession(response.data.session)
      } else {
        setActiveSession(null)
      }
    } catch (error) {
      console.error('Error checking focus session:', error)
    }
  }

  const startFocusSession = async () => {
    if (!topic.trim()) {
      alert('Please enter a focus topic')
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/focus/start`, {
        topic: topic.trim(),
        description: description.trim() || undefined,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        allowed_domains: allowedDomains.split(',').map(d => d.trim()).filter(d => d)
      })

      if (response.data.success) {
        setActiveSession({
          topic: topic.trim(),
          description: description.trim(),
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
          allowed_domains: allowedDomains.split(',').map(d => d.trim()).filter(d => d),
          _id: response.data.session_id,
          active: true,
          urls_checked: 0,
          urls_allowed: 0,
          urls_blocked: 0
        })
        setIsOpen(false)
        
        // Notify parent component
        if (onUrlCheck) {
          onUrlCheck(true)
        }
      }
    } catch (error) {
      console.error('Error starting focus session:', error)
      alert('Failed to start focus session')
    } finally {
      setIsLoading(false)
    }
  }

  const endFocusSession = async () => {
    setIsLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/focus/end`)
      
      if (response.data.success) {
        setStats(response.data.stats)
        setActiveSession(null)
        
        // Notify parent component
        if (onUrlCheck) {
          onUrlCheck(false)
        }
        
        // Clear form
        setTopic('')
        setDescription('')
        setKeywords('')
        setAllowedDomains('')
      }
    } catch (error) {
      console.error('Error ending focus session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen && !activeSession) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-48 right-4 p-4 mb-4 bg-purple-600 text-white rounded-full shadow-lg hover:scale-110 z-100"
        title="Focus Mode"
      >
        <Target size={24} />
      </button>
    )
  }

  if (activeSession && !isOpen) {
    return (
      <div className="fixed bottom-24 right-6 bg-purple-600 text-white rounded-lg shadow-lg p-4 z-40 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target size={20} className="animate-pulse" />
            <span className="font-semibold">Focus Mode Active</span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="hover:bg-purple-700 rounded p-1"
          >
            <TrendingUp size={16} />
          </button>
        </div>
        <p className="text-sm opacity-90 mb-2">{activeSession.topic}</p>
        <div className="flex gap-4 text-xs">
          <span>✓ {activeSession.urls_allowed || 0}</span>
          <span>✗ {activeSession.urls_blocked || 0}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-72 sm:w-96 bg-background border border-border rounded-lg shadow-2xl flex flex-col z-40 max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Target size={20} />
          <h3 className="font-semibold">Focus Mode</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-purple-700 rounded"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSession ? (
          // Active Session View
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Current Focus
              </h4>
              <p className="text-lg font-medium mb-2">{activeSession.topic}</p>
              {activeSession.description && (
                <p className="text-sm text-muted-foreground">{activeSession.description}</p>
              )}
            </div>

            {activeSession.keywords && activeSession.keywords.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Keywords:</h5>
                <div className="flex flex-wrap gap-2">
                  {activeSession.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-secondary text-xs rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeSession.allowed_domains && activeSession.allowed_domains.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Whitelisted Domains:</h5>
                <div className="space-y-1">
                  {activeSession.allowed_domains.map((domain, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Check size={12} className="text-green-500" />
                      {domain}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-secondary p-4 rounded-lg">
              <h5 className="text-sm font-medium mb-3">Session Statistics</h5>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {activeSession.urls_checked || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Checked</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {activeSession.urls_allowed || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Allowed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {activeSession.urls_blocked || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Blocked</div>
                </div>
              </div>
            </div>

            <button
              onClick={endFocusSession}
              disabled={isLoading}
              className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Ending...' : 'End Focus Session'}
            </button>

            {stats && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Session Completed!
                </h5>
                <p className="text-sm">
                  You stayed focused and checked {stats.urls_checked} URLs.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Start Session Form
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">What is Focus Mode?</p>
                  <p className="text-muted-foreground">
                    AI will check every URL before loading. Only relevant websites for your topic will be allowed.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Focus Topic *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Machine Learning Research"
                className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you're working on..."
                rows={2}
                className="w-full px-3 py-2 bg-secondary rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="AI, neural networks, deep learning"
                className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Whitelisted Domains (comma-separated)
              </label>
              <input
                type="text"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                placeholder="arxiv.org, github.com, stackoverflow.com"
                className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <p className="text-xs text-muted-foreground mt-1">
                These domains will always be allowed
              </p>
            </div>

            <button
              onClick={startFocusSession}
              disabled={isLoading || !topic.trim()}
              className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting...' : 'Start Focus Session'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
