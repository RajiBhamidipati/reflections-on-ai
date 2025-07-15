'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReflectionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    bootcamp_date: '',
    bootcamp_session: '',
    key_learnings: '',
    practical_applications: '',
    confidence_level: 5,
    success_moment: '',
    recommendation_score: 5,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth error:', authError)
        throw new Error('Authentication failed: ' + authError.message)
      }
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('reflections')
        .insert([
          {
            user_id: user.id,
            ...formData,
          },
        ])

      if (error) throw error

      setMessage('Reflection submitted successfully!')
      setFormData({
        bootcamp_date: '',
        bootcamp_session: '',
        key_learnings: '',
        practical_applications: '',
        confidence_level: 5,
        success_moment: '',
        recommendation_score: 5,
      })
      
      if (onSuccess) onSuccess()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_level') || name.includes('_score') ? parseInt(value) : value
    }))
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        AI Bootcamp Reflection
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="bootcamp_date" className="block text-sm font-medium text-gray-900 mb-2">
              Bootcamp Date *
            </label>
            <input
              id="bootcamp_date"
              name="bootcamp_date"
              type="date"
              value={formData.bootcamp_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="bootcamp_session" className="block text-sm font-medium text-gray-900 mb-2">
              Session/Topic
            </label>
            <input
              id="bootcamp_session"
              name="bootcamp_session"
              type="text"
              value={formData.bootcamp_session}
              onChange={handleChange}
              placeholder="e.g., Machine Learning Basics, ChatGPT Workshop"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>
        </div>

        <div>
          <label htmlFor="key_learnings" className="block text-sm font-medium text-gray-900 mb-2">
            Key Learnings *
          </label>
          <textarea
            id="key_learnings"
            name="key_learnings"
            value={formData.key_learnings}
            onChange={handleChange}
            required
            rows={4}
            placeholder="What were the most important concepts, techniques, or insights you learned?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="practical_applications" className="block text-sm font-medium text-gray-900 mb-2">
            Practical Applications *
          </label>
          <textarea
            id="practical_applications"
            name="practical_applications"
            value={formData.practical_applications}
            onChange={handleChange}
            required
            rows={4}
            placeholder="How did you apply these learnings in your daily work? What specific tasks or projects benefited?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="confidence_level" className="block text-sm font-medium text-gray-900 mb-2">
            Confidence Level: {formData.confidence_level}/10
          </label>
          <input
            id="confidence_level"
            name="confidence_level"
            type="range"
            min="1"
            max="10"
            value={formData.confidence_level}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Not confident</span>
            <span>Very confident</span>
          </div>
        </div>

        <div>
          <label htmlFor="success_moment" className="block text-sm font-medium text-gray-900 mb-2">
            Success/Aha Moment *
          </label>
          <textarea
            id="success_moment"
            name="success_moment"
            value={formData.success_moment}
            onChange={handleChange}
            required
            rows={3}
            placeholder="Describe a moment when something clicked or you achieved a breakthrough..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="recommendation_score" className="block text-sm font-medium text-gray-900 mb-2">
            Recommendation Score: {formData.recommendation_score}/10
          </label>
          <input
            id="recommendation_score"
            name="recommendation_score"
            type="range"
            min="1"
            max="10"
            value={formData.recommendation_score}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Would not recommend</span>
            <span>Highly recommend</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Reflection'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}