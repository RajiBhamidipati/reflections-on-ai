'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BookOpen, Tag, Heart, Meh, Frown, Smile } from 'lucide-react'

interface JournalEntryFormProps {
  onSuccess?: () => void
  editingEntry?: {
    id: string
    title?: string
    content: string
    mood?: string
    tags?: string[]
  }
}

export default function JournalEntryForm({ onSuccess, editingEntry }: JournalEntryFormProps) {
  const [formData, setFormData] = useState({
    title: editingEntry?.title || '',
    content: editingEntry?.content || '',
    mood: editingEntry?.mood || '',
    tags: editingEntry?.tags?.join(', ') || ''
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.content.trim()) {
        localStorage.setItem('journalEntryDraft', JSON.stringify(formData))
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [formData])

  // Load draft on mount
  useEffect(() => {
    if (!editingEntry) {
      const draft = localStorage.getItem('journalEntryDraft')
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft)
          setFormData(parsedDraft)
        } catch (error) {
          console.error('Error parsing draft:', error)
        }
      }
    }
  }, [editingEntry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage('Please log in to save your journal entry')
        setLoading(false)
        return
      }

      // Parse tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const journalEntry = {
        user_id: user.id,
        title: formData.title.trim() || null,
        content: formData.content.trim(),
        mood: formData.mood || null,
        tags: tagsArray.length > 0 ? tagsArray : null
      }

      let result
      if (editingEntry) {
        result = await supabase
          .from('journal_entries')
          .update(journalEntry)
          .eq('id', editingEntry.id)
          .select()
      } else {
        result = await supabase
          .from('journal_entries')
          .insert([journalEntry])
          .select()
      }

      if (result.error) {
        setMessage('Error saving journal entry: ' + result.error.message)
      } else {
        setMessage(editingEntry ? 'Journal entry updated successfully!' : 'Journal entry saved successfully!')
        
        // Clear draft
        localStorage.removeItem('journalEntryDraft')
        
        // Reset form if not editing
        if (!editingEntry) {
          setFormData({
            title: '',
            content: '',
            mood: '',
            tags: ''
          })
        }
        
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1000)
        }
      }
    } catch (error) {
      setMessage('Error saving journal entry: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const moodOptions = [
    { value: 'great', label: 'Great', icon: <Smile className="h-5 w-5" />, color: 'text-green-600' },
    { value: 'good', label: 'Good', icon: <Heart className="h-5 w-5" />, color: 'text-blue-600' },
    { value: 'okay', label: 'Okay', icon: <Meh className="h-5 w-5" />, color: 'text-yellow-600' },
    { value: 'down', label: 'Down', icon: <Frown className="h-5 w-5" />, color: 'text-red-600' }
  ]

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BookOpen className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="What's on your mind today?"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Your thoughts *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={10}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Write freely about your day, thoughts, feelings, ideas, or anything that comes to mind..."
              required
            />
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How are you feeling? (optional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => handleInputChange('mood', mood.value)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md border-2 transition-all ${
                    formData.mood === mood.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={formData.mood === mood.value ? 'text-indigo-600' : mood.color}>
                    {mood.icon}
                  </span>
                  <span className="text-sm font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              Tags (optional)
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="personal, work, ideas, gratitude (separate with commas)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use tags to organize your entries. Examples: personal, work, ideas, gratitude, goals
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setFormData({ title: '', content: '', mood: '', tags: '' })
                localStorage.removeItem('journalEntryDraft')
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading || !formData.content.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>

          {message && (
            <div className={`p-4 rounded-md ${
              message.includes('Error') 
                ? 'bg-red-50 border border-red-200 text-red-700' 
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}