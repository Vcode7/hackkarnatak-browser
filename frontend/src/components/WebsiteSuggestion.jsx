import { useState } from 'react'
import { Globe, Send, Loader2, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react'
import { isCapacitor, isElectron } from '../utils/platform'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function WebsiteSuggestion() {
  const [isOpen, setIsOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedWebsites, setSuggestedWebsites] = useState([])
  const [currentWebsiteIndex, setCurrentWebsiteIndex] = useState(0)

  const handleGetSuggestions = async () => {
    if (!topic.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/ai/suggest-websites`, {
        topic: topic.trim()
      })

      if (response.data.suggested_websites && response.data.suggested_websites.length > 0) {
        setSuggestedWebsites(response.data.suggested_websites)
        setCurrentWebsiteIndex(0)
      } else {
        setSuggestedWebsites([])
        alert('No websites found for this topic. Try a different search term.')
      }
    } catch (error) {
      console.error('Error fetching website suggestions:', error)
      alert('Failed to get website suggestions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGetSuggestions()
    }
  }

  const navigateToWebsite = (url) => {
    window.dispatchEvent(new CustomEvent('navigate-to-url', { detail: { url } }))
  }

  const handlePreviousWebsite = () => {
    if (currentWebsiteIndex > 0) {
      setCurrentWebsiteIndex(currentWebsiteIndex - 1)
    }
  }

  const handleNextWebsite = () => {
    if (currentWebsiteIndex < suggestedWebsites.length - 1) {
      setCurrentWebsiteIndex(currentWebsiteIndex + 1)
    }
  }

  const handleClear = () => {
    setSuggestedWebsites([])
    setCurrentWebsiteIndex(0)
    setTopic('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed p-4 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform z-100 ${
          isElectron() ? 'bottom-36 right-4' : 'bottom-36 right-4'
        }`}
        title="Website Suggestions"
      >
        <Globe size={24} />
      </button>
    )
  }

  const currentWebsite = suggestedWebsites[currentWebsiteIndex]

  return (
    <div
      className={`fixed bg-background border border-border rounded-lg shadow-2xl flex flex-col z-50 ${
        !isElectron() ? 'bottom-36 right-2 left-2' : 'bottom-24 right-6'
      }`}
      style={{
        width: !isElectron() ? 'calc(100vw - 2rem)' : '400px',
        maxHeight: !isElectron() ? '400px' : '500px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Globe size={20} />
          <h3 className="font-semibold">Website Suggestions</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Topic Input */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Enter a topic to get website suggestions:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Machine Learning, Cooking, Travel..."
                className="flex-1 px-3 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleGetSuggestions}
                disabled={isLoading || !topic.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Get Suggestions"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>

          {/* Website Display */}
          {suggestedWebsites.length > 0 && currentWebsite && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-600">
                  Website {currentWebsiteIndex + 1} of {suggestedWebsites.length}
                </span>
                <button
                  onClick={handleClear}
                  className="text-xs px-2 py-1 bg-secondary hover:bg-muted rounded"
                  title="Clear Results"
                >
                  Clear
                </button>
              </div>

              {/* Current Website Card */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-1">
                      {currentWebsite.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {currentWebsite.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Globe size={14} />
                    <span className="truncate">{currentWebsite.url}</span>
                  </div>

                  <button
                    onClick={() => navigateToWebsite(currentWebsite.url)}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink size={16} />
                    Visit Website
                  </button>
                </div>
              </div>

              {/* Navigation Buttons */}
              {suggestedWebsites.length > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousWebsite}
                    disabled={currentWebsiteIndex === 0}
                    className="flex-1 flex items-center justify-center gap-2 p-2 bg-secondary hover:bg-muted rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Website"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>
                  <button
                    onClick={handleNextWebsite}
                    disabled={currentWebsiteIndex === suggestedWebsites.length - 1}
                    className="flex-1 flex items-center justify-center gap-2 p-2 bg-secondary hover:bg-muted rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Website"
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {suggestedWebsites.length === 0 && !isLoading && (
            <div className="mt-8 text-center text-muted-foreground">
              <Globe size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Enter a topic above to discover relevant websites</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
