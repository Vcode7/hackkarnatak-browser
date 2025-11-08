import { useState } from 'react'
import { Highlighter, X, Loader, Sparkles } from 'lucide-react'
import axios from 'axios'
import { useBrowser } from '../context/BrowserContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function HighlightImportant({ isOpen, onClose, activeWebview: propWebview }) {
  const { activeTab } = useBrowser()
  const activeWebview = propWebview || activeTab?.webview
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [highlightedCount, setHighlightedCount] = useState(0)

  const handleHighlight = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic')
      return
    }

    if (!activeWebview) {
      alert('No active webpage')
      return
    }

    setLoading(true)
    setStatus('Extracting page content...')

    try {
      // Step 1: Extract page HTML and text content
      let pageContent
      try {
        pageContent = await activeWebview.executeJavaScript(`
        (function() {
          // Get all text content with their elements
          const elements = [];
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT,
            {
              acceptNode: function(node) {
                // Skip script, style, and hidden elements
                if (node.tagName === 'SCRIPT' || 
                    node.tagName === 'STYLE' || 
                    node.tagName === 'NOSCRIPT' ||
                    window.getComputedStyle(node).display === 'none') {
                  return NodeFilter.FILTER_REJECT;
                }
                
                // Only accept elements with direct text content
                if (node.childNodes.length > 0) {
                  for (let child of node.childNodes) {
                    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 20) {
                      return NodeFilter.FILTER_ACCEPT;
                    }
                  }
                }
                return NodeFilter.FILTER_SKIP;
              }
            }
          );

          let node;
          let index = 0;
          while (node = walker.nextNode()) {
            const text = node.textContent.trim();
            if (text.length > 20) {
              // Add unique identifier
              node.setAttribute('data-highlight-id', index);
              elements.push({
                id: index,
                tag: node.tagName,
                text: text.substring(0, 500), // Limit text length
                className: node.className
              });
              index++;
            }
          }

          return {
            elements: elements,
            title: document.title,
            url: window.location.href
          };
        })()
      `)
      } catch (jsError) {
        // Handle cross-origin iframe error
        if (jsError.message.includes('Cross-origin')) {
          alert('⚠️ Highlight feature is not available on mobile app due to browser security restrictions. Please use the desktop app for full features.')
          setLoading(false)
          return
        }
        throw jsError
      }

      console.log('Extracted elements:', pageContent.elements.length)
      setStatus(`Analyzing ${pageContent.elements.length} sections with AI...`)

      // Step 2: Send to AI for analysis
      const response = await axios.post(`${API_URL}/api/ai/highlight-important`, {
        topic: topic,
        pageTitle: pageContent.title,
        pageUrl: pageContent.url,
        elements: pageContent.elements
      })

      const importantIds = response.data.important_ids
      console.log('AI identified important sections:', importantIds)

      if (importantIds.length === 0) {
        setStatus('No relevant content found for this topic')
        setLoading(false)
        return
      }

      setStatus(`Highlighting ${importantIds.length} important sections...`)

      // Step 3: Highlight the important elements
      await activeWebview.executeJavaScript(`
        (function() {
          const importantIds = ${JSON.stringify(importantIds)};
          let count = 0;

          importantIds.forEach(id => {
            const element = document.querySelector('[data-highlight-id="' + id + '"]');
            if (element) {
              // Add highlight styling
              element.style.backgroundColor = '#fef08a'; // yellow-200
              element.style.borderLeft = '4px solid #eab308'; // yellow-500
              element.style.paddingLeft = '12px';
              element.style.color = 'black';
              element.style.transition = 'all 0.3s ease';
              element.style.boxShadow = '0 2px 8px rgba(234, 179, 8, 0.2)';
              
              // Add a marker icon
              const marker = document.createElement('span');
              marker.innerHTML = '✨';
              marker.style.position = 'absolute';
              marker.style.marginLeft = '-20px';
              marker.style.fontSize = '16px';
              marker.setAttribute('data-highlight-marker', 'true');
              
              // Make parent position relative if needed
              if (window.getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
              }
              
              element.insertBefore(marker, element.firstChild);
              count++;
            }
          });

          return count;
        })()
      `)

      setHighlightedCount(importantIds.length)
      setStatus(`✅ Highlighted ${importantIds.length} important sections!`)
      setLoading(false)

    } catch (error) {
      console.error('Highlight error:', error)
      setStatus('❌ Error: ' + (error.response?.data?.detail || error.message))
      setLoading(false)
    }
  }

  const handleClearHighlights = async () => {
    if (!activeWebview) return

    try {
      await activeWebview.executeJavaScript(`
        (function() {
          // Remove all highlights
          const highlighted = document.querySelectorAll('[data-highlight-id]');
          highlighted.forEach(el => {
            el.style.backgroundColor = '';
            el.style.borderLeft = '';
            el.style.paddingLeft = '';
            el.style.boxShadow = '';
            el.style.transition = '';
          });

          // Remove markers
          const markers = document.querySelectorAll('[data-highlight-marker]');
          markers.forEach(marker => marker.remove());
        })()
      `)

      setStatus('Highlights cleared')
      setHighlightedCount(0)
    } catch (error) {
      console.error('Clear error:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Highlighter className="text-yellow-500" size={24} />
            <h2 className="text-xl font-bold">Highlight Important</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">
          Enter your topic of interest, and AI will analyze the page to highlight the most relevant content.
        </p>

        {/* Topic Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            What are you researching?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., machine learning algorithms"
            className="w-full px-3 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && handleHighlight()}
          />
        </div>

        {/* Status */}
        {status && (
          <div className="mb-4 p-3 bg-secondary rounded text-sm">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader className="animate-spin" size={16} />
                <span>{status}</span>
              </div>
            ) : (
              <span>{status}</span>
            )}
          </div>
        )}

        {/* Stats */}
        {highlightedCount > 0 && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Sparkles size={16} />
              <span className="text-sm font-medium">
                {highlightedCount} sections highlighted
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleHighlight}
            disabled={loading || !topic.trim()}
            className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Highlight Important'}
          </button>
          
          {highlightedCount > 0 && (
            <button
              onClick={handleClearHighlights}
              disabled={loading}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>💡 Tip:</strong> Be specific with your topic for better results. 
            The AI will analyze text content and highlight sections most relevant to your research.
          </p>
        </div>
      </div>
    </div>
  )
}
