import { useState, useEffect } from 'react'
import { X, Users, Plus, Copy, Check, LogOut, Trash2, RefreshCw, ArrowLeft } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function GroupContext({ isOpen, onClose }) {
  const [groups, setGroups] = useState([])
  const [activeGroup, setActiveGroup] = useState(null)
  const [groupContexts, setGroupContexts] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadGroups()
    }
  }, [isOpen])

  useEffect(() => {
    if (activeGroup) {
      loadGroupContexts(activeGroup.id)
      // Auto-refresh contexts every 10 seconds when group is active
      const interval = setInterval(() => {
        loadGroupContexts(activeGroup.id)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [activeGroup])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/groups/my-groups`, {
        params: { user_id: localStorage.getItem('user_id') || 'default_user' }
      })
      
      if (response.data.success) {
        setGroups(response.data.groups)
      }
    } catch (error) {
      console.error('Error loading groups:', error)
      alert('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const loadGroupContexts = async (groupId) => {
    try {
      const response = await axios.post(`${API_URL}/api/groups/context/get`, {
        group_id: groupId,
        limit: 50
      }, {
        params: { user_id: localStorage.getItem('user_id') || 'default_user' }
      })
      
      if (response.data.success) {
        setGroupContexts(response.data.contexts)
      }
    } catch (error) {
      console.error('Error loading group contexts:', error)
    }
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Please enter a group name')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/api/groups/create`, {
        name: newGroupName,
        description: newGroupDescription
      }, {
        params: { user_id: localStorage.getItem('user_id') || 'default_user' }
      })
      
      if (response.data.success) {
        alert(`Group created! Invite code: ${response.data.invite_code}`)
        setNewGroupName('')
        setNewGroupDescription('')
        setShowCreateModal(false)
        loadGroups()
      }
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  const joinGroup = async () => {
    if (!joinCode.trim()) {
      alert('Please enter an invite code')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/api/groups/join`, {
        invite_code: joinCode.toUpperCase()
      }, {
        params: { user_id: localStorage.getItem('user_id') || 'default_user' }
      })
      
      if (response.data.success) {
        alert(response.data.message)
        setJoinCode('')
        setShowJoinModal(false)
        loadGroups()
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert(error.response?.data?.detail || 'Failed to join group')
    } finally {
      setLoading(false)
    }
  }

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const leaveGroup = async (groupId) => {
    if (!confirm('Are you sure you want to leave this group?')) return

    try {
      const response = await axios.delete(`${API_URL}/api/groups/${groupId}/leave`, {
        params: { user_id: localStorage.getItem('user_id') || 'default_user' }
      })
      
      if (response.data.success) {
        // Clear active group if it was the one we left
        if (activeGroup?.id === groupId) {
          setActiveGroup(null)
          setGroupContexts([])
          localStorage.removeItem('active_group_id')
        }
        // Reload groups list to remove the left group
        await loadGroups()
        alert('Left group successfully')
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      alert(error.response?.data?.detail || 'Failed to leave group')
    }
  }

  const deleteGroup = async (groupId) => {
    if (!confirm('⚠️ WARNING: This will permanently delete the group and all shared contexts. This action cannot be undone!\n\nAre you sure you want to delete this group?')) return

    try {
      const response = await axios.delete(`${API_URL}/api/groups/${groupId}/delete`, {
        params: { user_id: localStorage.getItem('user_id') || 'default_user' }
      })
      
      if (response.data.success) {
        // Clear active group if it was the one deleted
        if (activeGroup?.id === groupId) {
          setActiveGroup(null)
          setGroupContexts([])
          localStorage.removeItem('active_group_id')
        }
        // Reload groups list
        await loadGroups()
        alert('Group deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      alert(error.response?.data?.detail || 'Failed to delete group')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] sm:h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-primary" />
            <h2 className="text-xl font-semibold">Group Context</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Groups List */}
          <div className={`${showSidebar ? 'flex' : 'hidden'} sm:flex w-full sm:w-56 md:w-72 lg:w-80 border-r border-border flex-col overflow-hidden`}>
            <div className="p-4 border-b border-border">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  <Plus size={18} />
                  <span>Create Group</span>
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80"
                >
                  <Users size={18} />
                  <span>Join Group</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading && groups.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                  <p>Loading groups...</p>
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No groups yet</p>
                  <p className="text-sm mt-2">Create or join a group to start collaborating!</p>
                </div>
              ) : (
                groups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => {
                      setActiveGroup(group)
                      // Save active group to localStorage for AI chat
                      localStorage.setItem('active_group_id', group.id)
                      // Hide sidebar on mobile when group is selected
                      if (window.innerWidth < 640) {
                        setShowSidebar(false)
                      }
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeGroup?.id === group.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm opacity-80 truncate">{group.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                          <span>{group.member_count} members</span>
                          <span>{group.context_count} contexts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Content - Group Details & Contexts */}
          <div className="flex-1 flex flex-col">
            {activeGroup ? (
              <>
                {/* Group Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => setShowSidebar(true)}
                          className="sm:hidden p-1 hover:bg-secondary rounded"
                          title="Back to groups"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <h3 className="text-lg font-semibold">{activeGroup.name}</h3>
                      </div>
                      {activeGroup.description && (
                        <p className="text-sm text-muted-foreground mt-1">{activeGroup.description}</p>
                      )}
                      {/* Invite Code - Responsive */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-muted-foreground">Invite Code:</span>
                          <code className="px-2 py-1 bg-secondary rounded text-sm font-mono">
                            {activeGroup.invite_code}
                          </code>
                          <button
                            onClick={() => copyInviteCode(activeGroup.invite_code)}
                            className="p-1 hover:bg-secondary rounded"
                            title="Copy invite code"
                          >
                            {copiedCode ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                          </button>
                        </div>
                        {/* Action Buttons - Stack on mobile */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => leaveGroup(activeGroup.id)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <LogOut size={16} />
                            <span>Leave</span>
                          </button>
                          {/* Show delete button only for admins */}
                          {activeGroup.members?.find(m => m.user_id === (localStorage.getItem('user_id') || 'default_user'))?.role === 'admin' && (
                            <button
                              onClick={() => deleteGroup(activeGroup.id)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded"
                              title="Delete Group (Admin Only)"
                            >
                              <Trash2 size={16} />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shared Contexts */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Shared Research Context ({groupContexts.length})</h4>
                    <button
                      onClick={() => loadGroupContexts(activeGroup.id)}
                      className="p-2 hover:bg-secondary rounded-lg"
                      title="Refresh contexts"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                  
                  {groupContexts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <p>No shared context yet</p>
                      <p className="text-sm mt-2">Browse websites and they'll be automatically shared with the group!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupContexts.map(ctx => (
                        <div key={ctx.id} className="p-4 bg-secondary rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-primary">{ctx.user_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(ctx.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <h5 className="font-medium">{ctx.page_title}</h5>
                              <a
                                href={ctx.page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline truncate block"
                              >
                                {ctx.page_url}
                              </a>
                            </div>
                          </div>
                          
                          {ctx.search_query && (
                            <div className="mb-2 text-sm">
                              <span className="text-muted-foreground">Searched for:</span>{' '}
                              <span className="font-medium">{ctx.search_query}</span>
                            </div>
                          )}
                          
                          <p className="text-sm text-muted-foreground mt-2">
                            {ctx.content}
                          </p>
                          
                          {ctx.tags && ctx.tags.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {ctx.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users size={64} className="mx-auto mb-4 opacity-30" />
                  <p>Select a group to view shared context</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Group</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Group Name *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Machine Learning Study Group"
                  className="w-full px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="What is this group about?"
                  rows={3}
                  className="w-full px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createGroup}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Join Group</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Invite Code *</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  className="w-full px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center text-lg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={joinGroup}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join Group'}
                </button>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
