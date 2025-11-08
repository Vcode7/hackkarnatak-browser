import { useState, useEffect, useRef } from 'react'
import { useBrowser } from '../context/BrowserContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { isElectron, isCapacitor } from '../utils/platform'
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Home,
  Plus,
  X,
  Moon,
  Sun,
  Mic,
  MicOff,
  Settings as SettingsIcon,
  User,
  LogOut,
  Download,
  Highlighter
} from 'lucide-react'
import VoiceRecorder from './VoiceRecorder'
import VoiceNavigationMode from './VoiceNavigationMode'
import CapacitorWebView from './CapacitorWebView'
import ElectronWebView from './ElectronWebView'
import HomePage from './HomePage'
import FocusMode from './FocusMode'
import FocusBlockedPage from './FocusBlockedPage'
import Settings from './Settings'
import Downloads from './Downloads'
import HighlightImportant from './HighlightImportant'
import MobileBottomBar from './MobileBottomBar'
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
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [focusModeActive, setFocusModeActive] = useState(false)
  const [blockedUrl, setBlockedUrl] = useState(null)
  const [blockReason, setBlockReason] = useState('')
  const [focusTopic, setFocusTopic] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [searchEngine, setSearchEngine] = useState('google')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false)
  const [isHighlightOpen, setIsHighlightOpen] = useState(false)
  const [isVoiceNavActive, setIsVoiceNavActive] = useState(false)
  const webviewRef = useRef(null)

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
    const handleNavigateToUrl = (event) => {
      const { url } = event.detail
      if (url) {
        updateTabUrl(activeTabId, url)
      }
    }

    window.addEventListener('navigate-to-url', handleNavigateToUrl)

    return () => {
      window.removeEventListener('navigate-to-url', handleNavigateToUrl)
    }
  }, [activeTabId, updateTabUrl, addTab])

  // Load settings function (defined outside useEffect so it can be called from multiple places)
  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/data/settings`)
      if (response.data.success) {
        setSearchEngine(response.data.settings.default_search_engine || 'google')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  useEffect(() => {
    // Load search engine preference on mount
    loadSettings()

    // Listen for settings updates from Settings component
    const handleSettingsUpdate = () => {
      console.log('Settings updated, reloading...')
      loadSettings()
    }

    window.addEventListener('settings-updated', handleSettingsUpdate)

    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate)
    }
  }, [])

  const getSearchUrl = (query) => {
    const searchEngines = {
      google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      brave: `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
      ecosia: `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`
    }
    return searchEngines[searchEngine] || searchEngines.google
  }

  const handleUrlSubmit = async (e) => {
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

  const checkUrlWithFocusMode = async (url) => {
    try {
      const response = await axios.post(`${API_URL}/api/focus/check-url`, {
        url: url,
        use_quick_check: false
      })

      if (response.data.allowed) {
        // Clear any previous block
        setBlockedUrl(null)
        setBlockReason('')
        return true
      } else {
        // Block the URL
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

  const handleHome = () => {
    updateTabUrl(activeTabId, '')
    updateTabTitle(activeTabId, 'New Tab')
    setUrlInput('')
  }

  const handleWebViewNavigate = (tabId, newUrl) => {
    // Update the tab URL and input when webview navigates
    updateTabUrl(tabId, newUrl)
    if (tabId === activeTabId) {
      setUrlInput(newUrl)
    }
  }

  const handleTitleUpdate = (tabId, title) => {
    // Update the tab title when page title changes
    updateTabTitle(tabId, title || 'New Tab')
  }

  const handleHomePageNavigate = async (url) => {
    // Navigate from home page
    if (focusModeActive) {
      const allowed = await checkUrlWithFocusMode(url)
      if (!allowed) {
        return
      }
    }
    updateTabUrl(activeTabId, url)
    setUrlInput(url)
  }

  const handleFocusModeChange = (active) => {
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

  const handleLoadStart = () => {
    setIsLoading(true)
    setLoadingProgress(10)
  }

  const handleLoadProgress = (progress) => {
    setLoadingProgress(progress)
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
        <div className="h-1 bg-secondary relative overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 px-2 py-1 bg-secondary border-b border-border">
        <div className="flex items-center gap-1 overflow-x-auto w-auto max-w-full">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer
                min-w-[120px] max-w-[200px] group
                ${tab.id === activeTabId
                  ? 'bg-background border border-b-0 border-border'
                  : 'bg-secondary hover:bg-muted'
                }
              `}
              onClick={() => switchTab(tab.id)}
            >
              <span className="flex-1 truncate text-sm">
                {tab.title || 'New Tab'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => addTab()}
          className="p-1.5 hover:bg-muted rounded"
          title="New Tab"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-background border-b border-border">
        {/* Navigation Buttons - Always visible */}
        <div className="flex items-center gap-1">
          <button
            onClick={navigateBack}
            disabled={!canGoBack}
            className="p-2 hover:bg-secondary rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={navigateForward}
            disabled={!canGoForward}
            className="p-2 hover:bg-secondary rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Forward"
          >
            <ArrowRight size={18} />
          </button>
          <button
            onClick={refresh}
            className="p-2 hover:bg-secondary rounded"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          {/* Home button - hidden on mobile, shown on desktop */}
          <button
            onClick={handleHome}
            className="p-2 hover:bg-secondary rounded hidden md:block"
            title="Home"
          >
            <Home size={18} />
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
            className="w-full px-3 py-2 md:px-4 text-sm md:text-base bg-secondary rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        {/* Theme Toggle - Always visible */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-secondary rounded"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Desktop Actions - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setIsVoiceNavActive(true)}
            className="p-2 hover:bg-secondary rounded flex items-center gap-2 bg-primary/10 border border-primary"
            title="Voice Navigation Mode"
          >
            <Mic size={18} className="text-primary" />
            <span className="text-xs font-medium text-primary">Voice Nav</span>
          </button>
          <VoiceRecorder
            isActive={isVoiceActive}
            onToggle={() => setIsVoiceActive(!isVoiceActive)}
          />
          <button
            onClick={() => setIsDownloadsOpen(true)}
            className="p-2 hover:bg-secondary rounded"
            title="Downloads"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => setIsHighlightOpen(true)}
            className="p-2 hover:bg-secondary rounded"
            title="Highlight Important"
          >
            <Highlighter size={18} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-secondary rounded"
            title="Settings"
          >
            <SettingsIcon size={18} />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 hover:bg-secondary rounded flex items-center gap-2"
              title="User Menu"
            >
              <User size={18} />
              <span className="text-sm hidden md:inline">{user?.name || 'User'}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-border">
                  <p className="font-medium text-sm">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    logout()
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2 text-red-600"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-background">
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
                  <HomePage onNavigate={handleHomePageNavigate} />
                ) : (
                  <>
                    {/* Platform-specific rendering - Use webview for both Electron and Capacitor */}
                    {isElectron() ? (
                      // Electron: Use webview with navigation tracking
                      <ElectronWebView
                        ref={webviewRef}
                        key={activeTab.id}
                        url={activeTab.url}
                        tabId={activeTab.id}
                        onNavigate={handleWebViewNavigate}
                        onTitleUpdate={handleTitleUpdate}
                        onLoadStart={handleLoadStart}
                        onLoadProgress={handleLoadProgress}
                        onLoadStop={handleLoadStop}
                        className="w-full h-full"
                        style={{ display: 'flex', flex: 1 }}
                      />
                    ) : isCapacitor() ? (
                      // Capacitor: Use native webview for better performance
                      <CapacitorWebView
                        key={activeTab.id}
                        url={activeTab.url}
                        tabId={activeTab.id}
                        onNavigate={handleWebViewNavigate}
                        className="w-full h-full"
                        style={{ display: 'flex', flex: 1 }}
                      />
                    ) : (
                      // Fallback: Should not reach here due to platform routing in App.jsx
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

      {/* Settings Modal */}
      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => {
          setIsSettingsOpen(false)
          // Reload settings when modal closes to ensure we have latest values
          loadSettings()
        }} 
      />

      {/* Downloads Modal */}
      <Downloads isOpen={isDownloadsOpen} onClose={() => setIsDownloadsOpen(false)} />

      {/* Highlight Important Modal */}
      <HighlightImportant 
        isOpen={isHighlightOpen} 
        onClose={() => setIsHighlightOpen(false)}
        activeWebview={webviewRef.current}
      />

      {/* Voice Navigation Mode */}
      <VoiceNavigationMode
        isActive={isVoiceNavActive}
        onClose={() => setIsVoiceNavActive(false)}
        onNavigate={(url) => {
          updateTabUrl(activeTabId, url)
          setUrlInput(url)
        }}
      />

      {/* Mobile Bottom Bar - Only show on Capacitor */}
      {!isElectron() && (
        <MobileBottomBar
          onHomeClick={handleHome}
          onHighlightClick={() => setIsHighlightOpen(true)}
          onVoiceClick={() => setIsVoiceActive(!isVoiceActive)}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onDownloadsClick={() => setIsDownloadsOpen(true)}
          onVoiceNavClick={() => setIsVoiceNavActive(true)}
          isVoiceActive={isVoiceActive}
        />
      )}
    </div>
  )
}
