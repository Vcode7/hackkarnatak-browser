import { Home, Highlighter, Mic, Settings as SettingsIcon, Download, Radio } from 'lucide-react'
import { useState } from 'react'

export default function MobileBottomBar({ 
  onHomeClick, 
  onHighlightClick, 
  onVoiceClick, 
  onSettingsClick, 
  onDownloadsClick,
  onVoiceNavClick,
  isVoiceActive 
}) {
  const [activeTab, setActiveTab] = useState('home')

  const handleClick = (tab, callback) => {
    setActiveTab(tab)
    callback?.()
  }

  const buttonClass = (tab) => `
    flex flex-col items-center justify-center flex-1 py-2 transition-colors
    ${activeTab === tab 
      ? 'text-primary' 
      : 'text-muted-foreground hover:text-foreground'
    }
  `

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => handleClick('home', onHomeClick)}
          className={buttonClass('home')}
          title="Home"
        >
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </button>

        <button
          onClick={() => handleClick('highlight', onHighlightClick)}
          className={buttonClass('highlight')}
          title="Highlight"
        >
          <Highlighter size={24} />
          <span className="text-xs mt-1">Highlight</span>
        </button>

        <button
          onClick={() => handleClick('voicenav', onVoiceNavClick)}
          className={`${buttonClass('voicenav')} text-primary`}
          title="Voice Nav"
        >
          <Radio size={24} />
          <span className="text-xs mt-1">Voice Nav</span>
        </button>

        <button
          onClick={() => handleClick('downloads', onDownloadsClick)}
          className={buttonClass('downloads')}
          title="Downloads"
        >
          <Download size={24} />
          <span className="text-xs mt-1">Downloads</span>
        </button>

        <button
          onClick={() => handleClick('settings', onSettingsClick)}
          className={buttonClass('settings')}
          title="Settings"
        >
          <SettingsIcon size={24} />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    </div>
  )
}
