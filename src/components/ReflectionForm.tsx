'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface ReflectionFormProps {
  onSuccess?: () => void
  editingReflection?: {
    id: string
    bootcamp_date: string
    bootcamp_session: string
    key_learnings: string
    practical_applications: string
    confidence_level: number
    success_moment: string
    recommendation_score: number
  }
}

export default function ReflectionForm({ onSuccess, editingReflection }: ReflectionFormProps) {
  const [formData, setFormData] = useState({
    date: editingReflection?.bootcamp_date || '',
    customDate: '',
    keyTakeaway: editingReflection?.key_learnings || '',
    overallFeeling: editingReflection ? mapConfidenceToFeeling(editingReflection.confidence_level) : '',
    sessionTopic: editingReflection?.bootcamp_session || '',
    realWorldApplication: editingReflection?.practical_applications || '',
    shareWin: editingReflection?.success_moment || '',
    whatsNext: '',
    recommendationScore: editingReflection?.recommendation_score || 5,
  })
  
  const [showOptional, setShowOptional] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.keyTakeaway || formData.sessionTopic || formData.realWorldApplication) {
        localStorage.setItem('reflectionDraft', JSON.stringify(formData))
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [formData])

  // Load draft on mount
  useEffect(() => {
    if (!editingReflection) {
      const draft = localStorage.getItem('reflectionDraft')
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft)
          setFormData(prev => ({ ...prev, ...parsedDraft }))
        } catch (error) {
          console.error('Error loading draft:', error)
        }
      }
    }
  }, [editingReflection])

  const feelingOptions = [
    { value: 'breakthrough', emoji: '🎯', label: 'Had a breakthrough moment' },
    { value: 'progress', emoji: '📈', label: 'Made steady progress' },
    { value: 'practice', emoji: '🤔', label: 'Learned but need more practice' },
    { value: 'overwhelmed', emoji: '😅', label: 'Felt overwhelmed but motivated' },
    { value: 'uncertain', emoji: '🤷', label: 'Not sure if this clicked yet' },
  ]

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

      // Map new data structure to existing database fields
      const dbData = {
        bootcamp_date: formData.date,
        bootcamp_session: formData.sessionTopic,
        key_learnings: formData.keyTakeaway,
        practical_applications: formData.realWorldApplication,
        confidence_level: mapFeelingToConfidence(formData.overallFeeling),
        success_moment: formData.shareWin,
        recommendation_score: formData.recommendationScore,
      }

      let error
      if (editingReflection) {
        // Update existing reflection
        const { error: updateError } = await supabase
          .from('reflections')
          .update(dbData)
          .eq('id', editingReflection.id)
          .eq('user_id', user.id)
        error = updateError
      } else {
        // Create new reflection
        const { error: insertError } = await supabase
          .from('reflections')
          .insert([
            {
              user_id: user.id,
              ...dbData,
            },
          ])
        error = insertError
      }

      if (error) throw error

      setMessage('Thanks for sharing! Your insights help the whole team learn.')
      
      // Clear draft on successful submit
      localStorage.removeItem('reflectionDraft')
      
      if (!editingReflection) {
        // Reset form for new reflections
        setFormData({
          date: '',
          customDate: '',
          keyTakeaway: '',
          overallFeeling: '',
          sessionTopic: '',
          realWorldApplication: '',
          shareWin: '',
          whatsNext: '',
          recommendationScore: 5,
        })
      }
      
      if (onSuccess) onSuccess()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'recommendationScore' ? parseInt(value) : value
    }))
  }

  const isFormValid = formData.date && formData.date !== 'custom' && formData.keyTakeaway && formData.overallFeeling

  const getEngagementScore = () => {
    const optionalFields = [formData.sessionTopic, formData.realWorldApplication, formData.shareWin, formData.whatsNext]
    const filledFields = optionalFields.filter(field => field.trim().length > 0)
    return Math.round((filledFields.length / optionalFields.length) * 100)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {editingReflection ? 'Edit Your Check-in' : 'Quick AI Learning Check-in'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Required Fields Section */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick essentials</h3>
          
          <div className="space-y-4">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-900 mb-2">
                When was this? *
              </label>
              <select
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="">Select when this happened...</option>
                <option value={new Date().toISOString().split('T')[0]}>Today</option>
                <option value={new Date(Date.now() - 86400000).toISOString().split('T')[0]}>Yesterday</option>
                <option value={new Date(Date.now() - 2*86400000).toISOString().split('T')[0]}>2 days ago</option>
                <option value={new Date(Date.now() - 3*86400000).toISOString().split('T')[0]}>3 days ago</option>
                <option value={new Date(Date.now() - 4*86400000).toISOString().split('T')[0]}>4 days ago</option>
                <option value={new Date(Date.now() - 5*86400000).toISOString().split('T')[0]}>5 days ago</option>
                <option value={new Date(Date.now() - 6*86400000).toISOString().split('T')[0]}>6 days ago</option>
                <option value={new Date(Date.now() - 7*86400000).toISOString().split('T')[0]}>A week ago</option>
                <option value="custom">Choose specific date...</option>
              </select>
              {formData.date === 'custom' && (
                <input
                  type="date"
                  value={formData.customDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customDate: e.target.value, date: e.target.value }))}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              )}
            </div>

            {/* Key Takeaway */}
            <div>
              <label htmlFor="keyTakeaway" className="block text-sm font-medium text-gray-900 mb-2">
                Key Takeaway *
              </label>
              <textarea
                id="keyTakeaway"
                name="keyTakeaway"
                value={formData.keyTakeaway}
                onChange={handleChange}
                required
                rows={3}
                maxLength={500}
                placeholder="What's the most interesting thing you learned, discovered, or realized? Even questions or confusions count!"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.keyTakeaway.length}/500 characters
              </div>
            </div>

            {/* Overall Feeling */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Overall Feeling *
              </label>
              <div className="space-y-2">
                {feelingOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="overallFeeling"
                      value={option.value}
                      checked={formData.overallFeeling === option.value}
                      onChange={handleChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xl">{option.emoji}</span>
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Optional Fields Section */}
        <div className="border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 rounded-t-lg"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-lg font-medium text-gray-900">Want to share more?</span>
            </div>
            {showOptional ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showOptional && (
            <div className="p-6 space-y-4 border-t border-gray-200">
              {/* Session Topic */}
              <div>
                <label htmlFor="sessionTopic" className="block text-sm font-medium text-gray-900 mb-2">
                  Session/Topic
                </label>
                <input
                  id="sessionTopic"
                  name="sessionTopic"
                  type="text"
                  value={formData.sessionTopic}
                  onChange={handleChange}
                  placeholder="e.g., Prompt Engineering Workshop, GPT-4 experimentation, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              {/* Real World Application */}
              <div>
                <label htmlFor="realWorldApplication" className="block text-sm font-medium text-gray-900 mb-2">
                  Did you try this at work or have ideas for using it?
                </label>
                <textarea
                  id="realWorldApplication"
                  name="realWorldApplication"
                  value={formData.realWorldApplication}
                  onChange={handleChange}
                  rows={3}
                  maxLength={400}
                  placeholder="Any specific tasks, projects, or ideas where this might be useful?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.realWorldApplication.length}/400 characters
                </div>
              </div>

              {/* Share Win */}
              <div>
                <label htmlFor="shareWin" className="block text-sm font-medium text-gray-900 mb-2">
                  Got a cool result or &apos;aha!&apos; moment to share?
                </label>
                <textarea
                  id="shareWin"
                  name="shareWin"
                  value={formData.shareWin}
                  onChange={handleChange}
                  rows={3}
                  maxLength={400}
                  placeholder="What worked well or surprised you?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.shareWin.length}/400 characters
                </div>
              </div>

              {/* What's Next */}
              <div>
                <label htmlFor="whatsNext" className="block text-sm font-medium text-gray-900 mb-2">
                  One thing you want to try or learn more about?
                </label>
                <input
                  id="whatsNext"
                  name="whatsNext"
                  type="text"
                  value={formData.whatsNext}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="Next experiment, tool to explore, or skill to practice..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.whatsNext.length}/200 characters
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recommendation Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label htmlFor="recommendationScore" className="block text-sm font-medium text-gray-900 mb-2">
            Would you recommend this session/approach to a colleague?
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-600">Wouldn&apos;t recommend</span>
            <input
              id="recommendationScore"
              name="recommendationScore"
              type="range"
              min="1"
              max="10"
              value={formData.recommendationScore}
              onChange={handleChange}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-xs text-gray-600">Definitely recommend</span>
          </div>
          <div className="text-center mt-2 text-sm font-medium text-gray-700">
            {formData.recommendationScore}/10
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors ${
            isFormValid && !loading
              ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
          }`}
        >
          {loading 
            ? 'Saving...' 
            : !isFormValid 
              ? 'Please fill required fields' 
              : editingReflection 
                ? 'Update Check-in' 
                : 'Share Your Check-in'
          }
        </button>

        {!isFormValid && (
          <div className="text-center text-sm text-gray-500 mt-2">
            Required: When was this, Key Takeaway, and Overall Feeling
          </div>
        )}
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('Thanks') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Engagement Score */}
      {showOptional && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Engagement Score: {getEngagementScore()}% ({getEngagementScore() > 50 ? 'Great detail!' : 'Add more for richer insights'})
        </div>
      )}
    </div>
  )
}

// Helper functions to map between old and new data structures
function mapConfidenceToFeeling(confidence: number): string {
  if (confidence >= 9) return 'breakthrough'
  if (confidence >= 7) return 'progress'
  if (confidence >= 5) return 'practice'
  if (confidence >= 3) return 'overwhelmed'
  return 'uncertain'
}

function mapFeelingToConfidence(feeling: string): number {
  switch (feeling) {
    case 'breakthrough': return 9
    case 'progress': return 7
    case 'practice': return 5
    case 'overwhelmed': return 3
    case 'uncertain': return 1
    default: return 5
  }
}