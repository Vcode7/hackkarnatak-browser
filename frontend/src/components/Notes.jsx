import { useState, useEffect } from 'react'
import axios from 'axios'
import { StickyNote, Download, Trash2, Edit2, X, Save, ExternalLink, Calendar, Tag, Search } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Notes({ isOpen, onClose }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState([])
  const [editingNote, setEditingNote] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchNotes()
    }
  }, [isOpen])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/notes`)
      setNotes(response.data.notes || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    
    try {
      await axios.delete(`${API_URL}/api/notes/${noteId}`)
      setNotes(notes.filter(note => note._id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedNotes.length === 0) return
    if (!confirm(`Delete ${selectedNotes.length} selected notes?`)) return
    
    try {
      await axios.delete(`${API_URL}/api/notes`, { data: selectedNotes })
      setNotes(notes.filter(note => !selectedNotes.includes(note._id)))
      setSelectedNotes([])
    } catch (error) {
      console.error('Error deleting notes:', error)
      alert('Failed to delete notes')
    }
  }

  const handleEdit = (note) => {
    setEditingNote(note._id)
    setEditContent(note.content)
  }

  const handleSaveEdit = async (noteId) => {
    try {
      await axios.put(`${API_URL}/api/notes/${noteId}`, {
        content: editContent
      })
      setNotes(notes.map(note => 
        note._id === noteId ? { ...note, content: editContent } : note
      ))
      setEditingNote(null)
      setEditContent('')
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Failed to update note')
    }
  }

  const handleCancelEdit = () => {
    setEditingNote(null)
    setEditContent('')
  }

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notes/export/json`)
      const dataStr = JSON.stringify(response.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `notes-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading notes:', error)
      alert('Failed to download notes')
    }
  }

  const toggleSelectNote = (noteId) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedNotes.length === filteredNotes.length) {
      setSelectedNotes([])
    } else {
      setSelectedNotes(filteredNotes.map(note => note._id))
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.page_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.page_url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <StickyNote size={24} className="text-primary" />
            <h2 className="text-xl font-bold">My Notes</h2>
            <span className="text-sm text-muted-foreground">({filteredNotes.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="Download all notes"
            >
              <Download size={20} />
            </button>
            {selectedNotes.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="p-2 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                title={`Delete ${selectedNotes.length} selected`}
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Select All */}
        {filteredNotes.length > 0 && (
          <div className="px-4 py-2 border-b border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedNotes.length === filteredNotes.length && filteredNotes.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4"
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </label>
          </div>
        )}

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading notes...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No notes found matching your search' : 'No notes yet. Select text on any webpage and right-click to save a note.'}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note._id}
                className={`p-4 bg-secondary rounded-lg border-2 transition-colors ${
                  selectedNotes.includes(note._id) ? 'border-primary' : 'border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedNotes.includes(note._id)}
                    onChange={() => toggleSelectNote(note._id)}
                    className="mt-1 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    {/* Note Content */}
                    {editingNote === note._id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(note._id)}
                            className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                          >
                            <Save size={16} />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-lg hover:bg-muted"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words mb-3">{note.content}</p>
                    )}

                    {/* Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ExternalLink size={14} />
                        <a
                          href={note.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary truncate max-w-md"
                          title={note.page_url}
                        >
                          {note.page_title || note.page_url}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar size={14} />
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {editingNote !== note._id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(note)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Edit note"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(note._id)}
                        className="p-2 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                        title="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
