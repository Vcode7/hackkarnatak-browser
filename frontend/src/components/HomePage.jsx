import { useState } from 'react'
import { Search, Globe, Mail, Youtube, Github, Twitter, ShoppingCart, Newspaper } from 'lucide-react'

export default function HomePage({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('')

  const shortcuts = [
    { name: 'Google', icon: Globe, url: 'https://www.google.com', color: 'bg-blue-500' },
    { name: 'Gmail', icon: Mail, url: 'https://mail.google.com', color: 'bg-red-500' },
    { name: 'YouTube', icon: Youtube, url: 'https://www.youtube.com', color: 'bg-red-600' },
    { name: 'GitHub', icon: Github, url: 'https://github.com', color: 'bg-gray-800' },
    { name: 'Twitter', icon: Twitter, url: 'https://twitter.com', color: 'bg-blue-400' },
    { name: 'Amazon', icon: ShoppingCart, url: 'https://www.amazon.com', color: 'bg-orange-500' },
    { name: 'Reddit', icon: Newspaper, url: 'https://www.reddit.com', color: 'bg-orange-600' },
    { name: 'Wikipedia', icon: Globe, url: 'https://www.wikipedia.org', color: 'bg-gray-700' },
  ]

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    let url = searchQuery.trim()
    
    // Add https:// if no protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Check if it looks like a URL
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url
      } else {
        // Treat as search query
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`
      }
    }
    
    onNavigate(url)
  }

  const handleShortcutClick = (url) => {
    onNavigate(url)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background p-8">
      {/* Google-like Logo */}
      <div className="mb-12">
        <h1 className="text-6xl font-bold text-foreground mb-2">
          <span className="text-blue-500">L</span>
          <span className="text-red-500">e</span>
          <span className="text-yellow-500">r</span>
          <span className="text-blue-500">n</span>
          <span className="text-green-500">o</span>
          <span className="text-red-500">v</span>
          <span className="text-purple-500">a</span>
        </h1>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-2xl mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Google or type a URL"
            className="w-full pl-12 pr-4 py-4 text-lg bg-secondary border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-lg hover:shadow-xl transition-shadow"
            autoFocus
          />
        </div>
      </form>

      {/* Shortcuts Grid */}
      <div className="grid grid-cols-4 gap-6 max-w-4xl">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon
          return (
            <button
              key={shortcut.name}
              onClick={() => handleShortcutClick(shortcut.url)}
              className="flex flex-col items-center gap-3 p-6 rounded-xl hover:bg-secondary transition-colors group"
            >
              <div className={`${shortcut.color} p-4 rounded-2xl text-white group-hover:scale-110 transition-transform shadow-lg`}>
                <Icon size={32} />
              </div>
              <span className="text-sm font-medium text-foreground">{shortcut.name}</span>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-sm text-muted-foreground">
        <p>Lernova - AI-powered browser with voice commands and smart features</p>
      </div>
    </div>
  )
}
