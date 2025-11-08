import { useState, useEffect } from 'react'
import { useBrowser } from '../context/BrowserContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { isElectron, isCapacitor } from '../utils/platform'
import FocusMode from './FocusMode'
import FocusBlockedPage from './FocusBlockedPage'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Browser() {
  const {
    tabs,
    activeTab,
    activeTabId,
    addTab,
    closeTab,
    switchTab,
    updateTabUrl,
    updateTabTitle,
    navigateBack,
    navigateForward,
    refresh,
    canGoBack,
    canGoForward
  } = useBrowser()

  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [urlInput, setUrlInput] = useState(activeTab?.url || '')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [searchEngine, setSearchEngine] = useState('google')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [focusModeActive, setFocusModeActive] = useState(false)
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [focusTopic, setFocusTopic] = useState('')

  useEffect(() => {
    setUrlInput(activeTab?.url || '')
  }, [activeTab?.url])

  useEffect(() => {
    // Listen for IPC messages from Electron
    if (window.electron && window.electron.receive) {
      window.electron.receive('ask-ai-with-selection', (selectedText) => {
        // Open AI chat with selected text as context
        const event = new CustomEvent('open-ai-chat', {
          detail: {
            message: `Explain or help with: "${selectedText}"`,
            context: selectedText
          }
        })
        window.dispatchEvent(event)
      })

      window.electron.receive('open-link-new-tab', (url) => {
        // Open link in new tab
        addTab(url)
      })
    }

    // Listen for navigate-to-url event from AI chat
    const handleNavigateToUrl = (event: CustomEvent) => {
      const { url } = event.detail
      if (url) {
        updateTabUrl(activeTabId, url)
      }
    }

    window.addEventListener('navigate-to-url', handleNavigateToUrl as EventListener)

    return () => {
      window.removeEventListener('navigate-to-url', handleNavigateToUrl as EventListener)
    }
  }, [activeTabId, updateTabUrl, addTab])

  // Load settings function (optional - endpoint may not exist)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/data/settings`)
        if (response.data.success) {
          setSearchEngine(response.data.settings.default_search_engine || 'google')
        }
      } catch (error) {
        // Settings endpoint may not exist yet - use default
        console.debug('Settings endpoint not available, using default search engine')
      }
    }
    loadSettings()
  }, [])

  const getSearchUrl = (query: string) => {
    const searchEngines: Record<string, string> = {
      google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      brave: `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
      ecosia: `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`
    }
    return searchEngines[searchEngine] || searchEngines.google
  }

  const checkUrlWithFocusMode = async (url: string) => {
    if (!focusModeActive) return true
    
    try {
      const response = await axios.post(`${API_URL}/api/focus/check-url`, {
        url: url,
        use_quick_check: false
      })

      if (response.data.allowed) {
        setBlockedUrl(null)
        setBlockReason('')
        return true
      } else {
        setBlockedUrl(url)
        setBlockReason(response.data.reason || 'This URL is not relevant to your focus topic')
        setFocusTopic(response.data.topic || '')
        return false
      }
    } catch (error) {
      console.error('Error checking URL with focus mode:', error)
      // On error, allow the URL (fail open)
      return true
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let url = urlInput.trim()

    if (!url) {
      alert("Invalid URL or Search Term!");
      return;
    }
    
    // Add https:// if no protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Check if it looks like a URL
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url
      } else {
        // Treat as search query using selected search engine
        url = getSearchUrl(url)
      }
    }

    // Check with focus mode if active
    if (focusModeActive) {
      const allowed = await checkUrlWithFocusMode(url)
      if (!allowed) {
        return // URL was blocked
      }
    }

    updateTabUrl(activeTabId, url)
  }

  const handleHome = () => {
    updateTabUrl(activeTabId, '')
    updateTabTitle(activeTabId, 'New Tab')
    setUrlInput('')
  }

  const handleHomePageNavigate = async (url: string) => {
    // Check with focus mode if active
    if (focusModeActive) {
      const allowed = await checkUrlWithFocusMode(url)
      if (!allowed) {
        return
      }
    }
    updateTabUrl(activeTabId, url)
    setUrlInput(url)
  }

  const handleFocusModeChange = (active: boolean) => {
    setFocusModeActive(active)
    if (!active) {
      // Clear any blocks when focus mode is disabled
      setBlockedUrl(null)
      setBlockReason('')
      setFocusTopic('')
    }
  }

  const handleGoBack = () => {
    setBlockedUrl(null)
    setBlockReason('')
    navigateBack()
  }

  const handleEndFocusFromBlock = async () => {
    try {
      await axios.post(`${API_URL}/api/focus/end`)
      setFocusModeActive(false)
      setBlockedUrl(null)
      setBlockReason('')
      setFocusTopic('')
    } catch (error) {
      console.error('Error ending focus session:', error)
    }
  }

  const handleLoadStop = () => {
    setLoadingProgress(100)
    setTimeout(() => {
      setIsLoading(false)
      setLoadingProgress(0)
    }, 200)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Loading Bar */}
      {isLoading && (
        <div className="h-1 bg-gray-700 relative overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-1 overflow-x-auto w-auto max-w-full">
          {tabs.map((tab: any) => (
            <div
              key={tab.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer
                min-w-[120px] max-w-[200px] group
                ${tab.id === activeTabId
                  ? 'bg-gray-900 border border-b-0 border-gray-700'
                  : 'bg-gray-800 hover:bg-gray-700'
                }
              `}
              onClick={() => switchTab(tab.id)}
            >
              <span className="flex-1 truncate text-sm text-gray-100">
                {tab.title || 'New Tab'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded p-0.5 text-gray-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => addTab()}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-100"
          title="New Tab"
        >
          +
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={navigateBack}
            disabled={!canGoBack}
            className="p-2 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-100"
            title="Back"
          >
            ←
          </button>
          <button
            onClick={navigateForward}
            disabled={!canGoForward}
            className="p-2 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-100"
            title="Forward"
          >
            →
          </button>
          <button
            onClick={refresh}
            className="p-2 hover:bg-gray-700 rounded text-gray-100"
            title="Refresh"
          >
            ↻
          </button>
          <button
            onClick={handleHome}
            className="p-2 hover:bg-gray-700 rounded text-gray-100"
            title="Home"
          >
            ⌂
          </button>
        </div>

        {/* URL Bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="Enter URL or search..."
            className="w-full px-4 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </form>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-700 rounded text-gray-100"
          title="Toggle Theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-2 hover:bg-gray-700 rounded text-gray-100"
            title="User Menu"
          >
            👤
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
              <div className="p-3 border-b border-gray-700">
                <p className="font-medium text-sm text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  logout()
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 text-red-400 text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-gray-900">
        {activeTab && (
          <>
            {/* Show blocked page if URL is blocked by focus mode */}
            {blockedUrl ? (
              <FocusBlockedPage
                url={blockedUrl}
                reason={blockReason}
                topic={focusTopic}
                onGoBack={handleGoBack}
                onEndFocus={handleEndFocusFromBlock}
              />
            ) : (
              <>
                {/* Show home page if no URL, otherwise show webview */}
                {!activeTab.url || activeTab.url === '' ? (
                  <div className="flex items-center justify-center h-full bg-gray-900">
                    <div className="text-center p-8">
                      <h1 className="text-2xl font-bold text-gray-100 mb-4">GenAI Browser</h1>
                      <p className="text-gray-400 mb-4">Enter a URL or search term to get started</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() => handleHomePageNavigate('https://www.google.com')}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Google
                        </button>
                        <button
                          onClick={() => handleHomePageNavigate('https://github.com')}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          GitHub
                        </button>
                        <button
                          onClick={() => handleHomePageNavigate('https://stackoverflow.com')}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Stack Overflow
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Platform-specific rendering - Use iframe for cross-platform */}
                    {isElectron() || isCapacitor() ? (
                      // Use iframe for both Electron and Capacitor
                      <iframe
                        key={activeTab.id}
                        src={activeTab.url}
                        className="w-full h-full border-0 bg-white"
                        title={activeTab.title || 'Browser'}
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                        onLoad={() => {
                          handleLoadStop()
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Please use the desktop or mobile app</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Focus Mode Component */}
      <FocusMode onUrlCheck={handleFocusModeChange} />
    </div>
  )
}
