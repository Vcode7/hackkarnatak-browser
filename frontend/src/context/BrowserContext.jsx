import { createContext, useContext, useState, useCallback } from 'react'

const BrowserContext = createContext()

export function BrowserProvider({ children }) {
  const [tabs, setTabs] = useState([
    { id: 1, url: '', title: 'New Tab', history: [], historyIndex: -1 }
  ])
  const [activeTabId, setActiveTabId] = useState(1)
  const [nextTabId, setNextTabId] = useState(2)

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  const addTab = useCallback((url = '') => {
    const newTab = {
      id: nextTabId,
      url,
      title: 'New Tab',
      history: url ? [url] : [],
      historyIndex: url ? 0 : -1
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(nextTabId)
    setNextTabId(prev => prev + 1)
  }, [nextTabId])

  const closeTab = useCallback((tabId) => {
    setTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId)
      if (filtered.length === 0) {
        // Always keep at least one tab - create new home tab
        const newTabId = nextTabId
        setActiveTabId(newTabId)
        setNextTabId(prev => prev + 1)
        return [{
          id: newTabId,
          url: '',
          title: 'New Tab',
          history: [],
          historyIndex: -1
        }]
      }
      return filtered
    })
    
    // Switch to another tab if closing active tab
    if (tabId === activeTabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId)
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id)
      }
    }
  }, [tabs, activeTabId, nextTabId])

  const switchTab = useCallback((tabId) => {
    setActiveTabId(tabId)
  }, [])

  const updateTabUrl = useCallback((tabId, url) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === tabId) {
        const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), url]
        return {
          ...tab,
          url,
          history: newHistory,
          historyIndex: newHistory.length - 1
        }
      }
      return tab
    }))
  }, [])

  const updateTabTitle = useCallback((tabId, title) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, title } : tab
    ))
  }, [])

  const navigateBack = useCallback(() => {
    if (!activeTab || activeTab.historyIndex <= 0) return
    
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        const newIndex = tab.historyIndex - 1
        return {
          ...tab,
          url: tab.history[newIndex],
          historyIndex: newIndex
        }
      }
      return tab
    }))
  }, [activeTab, activeTabId])

  const navigateForward = useCallback(() => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return
    
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        const newIndex = tab.historyIndex + 1
        return {
          ...tab,
          url: tab.history[newIndex],
          historyIndex: newIndex
        }
      }
      return tab
    }))
  }, [activeTab, activeTabId])

  const refresh = useCallback(() => {
    if (!activeTab) return
    // Trigger refresh by updating URL to same value
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId ? { ...tab, url: tab.url + '?refresh=' + Date.now() } : tab
    ))
  }, [activeTab, activeTabId])

  const value = {
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
    canGoBack: activeTab?.historyIndex > 0,
    canGoForward: activeTab?.historyIndex < (activeTab?.history.length - 1)
  }

  return (
    <BrowserContext.Provider value={value}>
      {children}
    </BrowserContext.Provider>
  )
}

export const useBrowser = () => {
  const context = useContext(BrowserContext)
  if (!context) {
    throw new Error('useBrowser must be used within BrowserProvider')
  }
  return context
}
