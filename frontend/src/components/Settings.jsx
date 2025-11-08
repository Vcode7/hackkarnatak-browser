import { useState, useEffect } from 'react'
import { X, Save, Trash2, Search, Bookmark, Clock, Globe, Shield, Palette, Zap, Database } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Settings({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [history, setHistory] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSettings()
      loadBookmarks()
      loadHistory()
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/data/settings`)
      if (response.data.success) {
        setSettings(response.data.settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const loadBookmarks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/data/bookmarks`)
      if (response.data.success) {
        setBookmarks(response.data.bookmarks)
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    }
  }

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/data/history?limit=50`)
      if (response.data.success) {
        setHistory(response.data.history)
      }
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await axios.put(`${API_URL}/api/data/settings`, settings)
      if (response.data.success) {
        alert('Settings saved successfully!')
        // Emit event to notify other components that settings were updated
        window.dispatchEvent(new CustomEvent('settings-updated', {
          detail: settings
        }))
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteBookmark = async (bookmarkId) => {
    if (!confirm('Delete this bookmark?')) return
    
    try {
      await axios.delete(`${API_URL}/api/data/bookmarks/${bookmarkId}`)
      setBookmarks(bookmarks.filter(b => b._id !== bookmarkId))
    } catch (error) {
      console.error('Error deleting bookmark:', error)
    }
  }

  const clearHistory = async () => {
    if (!confirm('Clear all browsing history? This cannot be undone.')) return
    
    setIsLoading(true)
    try {
      await axios.delete(`${API_URL}/api/data/history`)
      setHistory([])
      alert('History cleared successfully')
    } catch (error) {
      console.error('Error clearing history:', error)
      alert('Failed to clear history')
    } finally {
      setIsLoading(false)
    }
  }

  const searchBookmarks = async (query) => {
    if (!query.trim()) {
      loadBookmarks()
      return
    }
    
    try {
      const response = await axios.get(`${API_URL}/api/data/bookmarks/search?query=${encodeURIComponent(query)}`)
      if (response.data.success) {
        setBookmarks(response.data.bookmarks)
      }
    } catch (error) {
      console.error('Error searching bookmarks:', error)
    }
  }

  const searchHistory = async (query) => {
    if (!query.trim()) {
      loadHistory()
      return
    }
    
    try {
      const response = await axios.get(`${API_URL}/api/data/history/search?query=${encodeURIComponent(query)}`)
      if (response.data.success) {
        setHistory(response.data.history)
      }
    } catch (error) {
      console.error('Error searching history:', error)
    }
  }

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value })
  }

  if (!isOpen || !settings) return null

  const filteredBookmarks = searchQuery && activeTab === 'bookmarks' 
    ? bookmarks.filter(b => 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookmarks

  const filteredHistory = searchQuery && activeTab === 'history'
    ? history.filter(h =>
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.url.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-border p-4 space-y-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'general' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`}
            >
              <Globe size={20} />
              <span>General</span>
            </button>
            
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'appearance' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`}
            >
              <Palette size={20} />
              <span>Appearance</span>
            </button>
            
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'privacy' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`}
            >
              <Shield size={20} />
              <span>Privacy</span>
            </button>
            
            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'ai' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`}
            >
              <Zap size={20} />
              <span>AI Features</span>
            </button>
            
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'bookmarks' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`}
            >
              <Bookmark size={20} />
              <span>Bookmarks</span>
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'history' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`}
            >
              <Clock size={20} />
              <span>History</span>
            </button>
            
            <button
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'data' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`}
            >
              <Database size={20} />
              <span>Data</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Default Search Engine
                      </label>
                      <select
                        value={settings.default_search_engine}
                        onChange={(e) => updateSetting('default_search_engine', e.target.value)}
                        className="w-full px-3 py-2 bg-secondary rounded-lg border border-border"
                      >
                        <option value="google">Google</option>
                        <option value="bing">Bing</option>
                        <option value="duckduckgo">DuckDuckGo</option>
                        <option value="brave">Brave Search</option>
                        <option value="ecosia">Ecosia</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Homepage URL
                      </label>
                      <input
                        type="text"
                        value={settings.homepage_url}
                        onChange={(e) => updateSetting('homepage_url', e.target.value)}
                        placeholder="Leave empty for default home page"
                        className="w-full px-3 py-2 bg-secondary rounded-lg border border-border"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Custom homepage when opening new tabs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Theme
                      </label>
                      <select
                        value={settings.theme}
                        onChange={(e) => updateSetting('theme', e.target.value)}
                        className="w-full px-3 py-2 bg-secondary rounded-lg border border-border"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System Default</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Font Size
                      </label>
                      <select
                        value={settings.font_size}
                        onChange={(e) => updateSetting('font_size', e.target.value)}
                        className="w-full px-3 py-2 bg-secondary rounded-lg border border-border"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="xlarge">Extra Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Privacy & Security</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <div className="font-medium">Save Browsing History</div>
                        <div className="text-sm text-muted-foreground">
                          Keep track of pages you visit
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.save_history}
                        onChange={(e) => updateSetting('save_history', e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <div className="font-medium">Save Cookies</div>
                        <div className="text-sm text-muted-foreground">
                          Allow websites to store cookies
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.save_cookies}
                        onChange={(e) => updateSetting('save_cookies', e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <div className="font-medium">Block Trackers</div>
                        <div className="text-sm text-muted-foreground">
                          Prevent tracking scripts from running
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.block_trackers}
                        onChange={(e) => updateSetting('block_trackers', e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* AI Settings */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">AI Features</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <div className="font-medium">AI Voice Responses</div>
                        <div className="text-sm text-muted-foreground">
                          Enable text-to-speech for AI responses
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.ai_voice_enabled}
                        onChange={(e) => updateSetting('ai_voice_enabled', e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Voice Speed
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={settings.ai_voice_speed}
                        onChange={(e) => updateSetting('ai_voice_speed', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Slower</span>
                        <span>{settings.ai_voice_speed}x</span>
                        <span>Faster</span>
                      </div>
                    </div>

                    <label className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <div className="font-medium">Auto-Summarize Pages</div>
                        <div className="text-sm text-muted-foreground">
                          Automatically summarize long articles
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.ai_auto_summarize}
                        onChange={(e) => updateSetting('ai_auto_summarize', e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <div className="font-medium">Focus Mode (Strict)</div>
                        <div className="text-sm text-muted-foreground">
                          Be more restrictive when blocking URLs
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.focus_mode_strict}
                        onChange={(e) => updateSetting('focus_mode_strict', e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Bookmarks */}
            {activeTab === 'bookmarks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Bookmarks ({bookmarks.length})</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search bookmarks..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        searchBookmarks(e.target.value)
                      }}
                      className="px-3 py-2 bg-secondary rounded-lg border border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredBookmarks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bookmark size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No bookmarks yet</p>
                      <p className="text-sm">Bookmark pages to see them here</p>
                    </div>
                  ) : (
                    filteredBookmarks.map((bookmark) => (
                      <div
                        key={bookmark._id}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{bookmark.title}</div>
                          <div className="text-sm text-muted-foreground truncate">{bookmark.url}</div>
                          {bookmark.tags && bookmark.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {bookmark.tags.map((tag, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-primary/20 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteBookmark(bookmark._id)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* History */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Browsing History ({history.length})</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search history..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        searchHistory(e.target.value)
                      }}
                      className="px-3 py-2 bg-secondary rounded-lg border border-border"
                    />
                    <button
                      onClick={clearHistory}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No browsing history</p>
                    </div>
                  ) : (
                    filteredHistory.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-sm text-muted-foreground truncate">{item.url}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(item.visited_at).toLocaleString()} • Visited {item.visit_count} time{item.visit_count > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Data Management */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Data Management</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary rounded-lg">
                      <h4 className="font-medium mb-2">Storage Usage</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Bookmarks:</span>
                          <span className="font-medium">{bookmarks.length} items</span>
                        </div>
                        <div className="flex justify-between">
                          <span>History:</span>
                          <span className="font-medium">{history.length} items</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                        Danger Zone
                      </h4>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                        These actions cannot be undone
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={clearHistory}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Clear All History
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Lernova Browser v2.0
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-secondary rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
