'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BookOpen, ArrowLeft, Save } from 'lucide-react'

function NewJournalEntryForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      setEditingId(editId)
      loadEntryForEdit(editId)
    }
  }, [searchParams])

  const loadEntryForEdit = async (entryId: string) => {
    try {
      const { data: entry, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .single()

      if (error) {
        console.error('Error loading entry:', error)
        setMessage('Error loading entry for editing')
        return
      }

      if (entry) {
        setTitle(entry.title || '')
        setContent(entry.content || '')
        setMood(entry.mood || '')
        setTags(entry.tags?.join(', ') || '')
      }
    } catch (error) {
      console.error('Error loading entry:', error)
      setMessage('Error loading entry for editing')
    }
  }

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
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const journalEntry = {
        user_id: user.id,
        title: title.trim() || null,
        content: content.trim(),
        mood: mood || null,
        tags: tagsArray.length > 0 ? tagsArray : null
      }

      let result
      if (editingId) {
        result = await supabase
          .from('journal_entries')
          .update(journalEntry)
          .eq('id', editingId)
      } else {
        result = await supabase
          .from('journal_entries')
          .insert([journalEntry])
      }

      if (result.error) {
        setMessage('Error saving journal entry: ' + result.error.message)
      } else {
        setMessage(editingId ? 'Journal entry updated successfully!' : 'Journal entry saved successfully!')
        setTimeout(() => {
          router.push('/journal')
        }, 1500)
      }
    } catch (error) {
      setMessage('Error saving journal entry: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                {editingId ? 'Edit Journal Entry' : 'New Journal Entry'}
              </h1>
            </div>
            <button
              onClick={() => router.push('/journal')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Journal</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-lg"
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
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base leading-relaxed"
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
                {[
                  { value: 'great', label: 'Great', emoji: '😊' },
                  { value: 'good', label: 'Good', emoji: '🙂' },
                  { value: 'okay', label: 'Okay', emoji: '😐' },
                  { value: 'down', label: 'Down', emoji: '😔' }
                ].map((moodOption) => (
                  <button
                    key={moodOption.value}
                    type="button"
                    onClick={() => setMood(moodOption.value)}
                    className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-md border-2 transition-all ${
                      mood === moodOption.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{moodOption.emoji}</span>
                    <span className="text-sm font-medium">{moodOption.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="personal, work, ideas, gratitude (separate with commas)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Use tags to organize your entries. Examples: personal, work, ideas, gratitude, goals
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.push('/journal')}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}</span>
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
      </main>
    </div>
  )
}

export default function NewJournalEntryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
    </div>}>
      <NewJournalEntryForm />
    </Suspense>
  )
}