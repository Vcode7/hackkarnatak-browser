import { useState, useEffect } from 'react'
import { Download, X, Trash2, CheckCircle, XCircle, Clock, Loader } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Downloads({ isOpen, onClose }) {
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadDownloads()
      // Refresh every 2 seconds while open
      const interval = setInterval(loadDownloads, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  const loadDownloads = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/downloads`)
      if (response.data.success) {
        setDownloads(response.data.downloads)
      }
    } catch (error) {
      console.error('Error loading downloads:', error)
    }
  }

  const deleteDownload = async (downloadId) => {
    try {
      await axios.delete(`${API_URL}/api/downloads/${downloadId}`)
      setDownloads(downloads.filter(d => d._id !== downloadId))
    } catch (error) {
      console.error('Error deleting download:', error)
    }
  }

  const clearCompleted = async () => {
    if (!confirm('Clear all completed downloads?')) return
    
    setLoading(true)
    try {
      await axios.delete(`${API_URL}/api/downloads?status=completed`)
      await loadDownloads()
    } catch (error) {
      console.error('Error clearing downloads:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />
      case 'failed':
      case 'cancelled':
        return <XCircle className="text-red-500" size={20} />
      case 'in_progress':
        return <Loader className="text-blue-500 animate-spin" size={20} />
      default:
        return <Clock className="text-gray-500" size={20} />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background w-full max-w-3xl h-[70vh] rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Download size={24} />
            <h2 className="text-2xl font-bold">Downloads</h2>
            <span className="text-sm text-muted-foreground">({downloads.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearCompleted}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-secondary hover:bg-muted rounded disabled:opacity-50"
            >
              Clear Completed
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Downloads List */}
        <div className="flex-1 overflow-y-auto p-4">
          {downloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Download size={64} className="mb-4 opacity-50" />
              <p className="text-lg">No downloads yet</p>
              <p className="text-sm">Downloaded files will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {downloads.map((download) => (
                <div
                  key={download._id}
                  className="p-4 bg-secondary rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getStatusIcon(download.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{download.filename}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {download.url}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{formatBytes(download.file_size)}</span>
                          <span>•</span>
                          <span className="capitalize">{download.status.replace('_', ' ')}</span>
                          {download.status === 'in_progress' && (
                            <>
                              <span>•</span>
                              <span>{Math.round(download.progress)}%</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(download.started_at).toLocaleString()}</span>
                        </div>
                        
                        {/* Progress Bar */}
                        {download.status === 'in_progress' && (
                          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${download.progress}%` }}
                            />
                          </div>
                        )}
                        
                        {download.error_message && (
                          <div className="mt-2 text-xs text-red-500">
                            Error: {download.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteDownload(download._id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      title="Remove from list"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
