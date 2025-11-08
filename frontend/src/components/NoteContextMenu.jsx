import { useEffect, useRef } from 'react'
import { StickyNote } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function NoteContextMenu({ position, selectedText, pageUrl, pageTitle, onClose, onSaved }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleSaveNote = async () => {
    try {
      await axios.post(`${API_URL}/api/notes`, {
        content: selectedText,
        page_url: pageUrl,
        page_title: pageTitle
      })
      
      if (onSaved) {
        onSaved()
      }
      
      // Show success notification
      const notification = document.createElement('div')
      notification.textContent = '✓ Note saved successfully'
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
      `
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 3000)
      
      onClose()
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Failed to save note')
    }
  }

  if (!position) return null

  return (
    <div
      ref={menuRef}
      className="fixed bg-background border border-border rounded-lg shadow-xl py-1 z-[9999]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <button
        onClick={handleSaveNote}
        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-secondary transition-colors text-left"
      >
        <StickyNote size={16} />
        <span className="text-sm">Save as Note</span>
      </button>
    </div>
  )
}
