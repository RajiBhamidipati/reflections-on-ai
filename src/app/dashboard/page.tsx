'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PersonalInsights from '@/components/PersonalInsights'

interface Reflection {
  id: string
  bootcamp_date: string
  bootcamp_session: string
  key_learnings: string
  practical_applications: string
  confidence_level: number
  success_moment: string
  recommendation_score: number
  created_at: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('insights')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        router.push('/')
        return
      }

      // Fetch user's reflections
      const { data: reflections, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reflections:', error)
      } else {
        setReflections(reflections || [])
      }
      
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              My Reflections
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/new-reflection')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add New Reflection
              </button>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('insights')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'insights'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Insights & Progress
              </button>
              <button
                onClick={() => setActiveTab('reflections')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reflections'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Reflections
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'insights' ? (
            <PersonalInsights />
          ) : (
            <div>
              {reflections.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    No reflections yet
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Start documenting your AI learning journey
                  </p>
                  <button
                    onClick={() => router.push('/new-reflection')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
                  >
                    Add Your First Reflection
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {reflections.map((reflection) => (
                    <div key={reflection.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {reflection.bootcamp_session || 'AI Bootcamp Session'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(reflection.bootcamp_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            Confidence: {reflection.confidence_level}/10
                          </div>
                          <div className="text-sm text-gray-600">
                            Recommendation: {reflection.recommendation_score}/10
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Key Learnings</h4>
                          <p className="text-gray-700">{reflection.key_learnings}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Practical Applications</h4>
                          <p className="text-gray-700">{reflection.practical_applications}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Success Moment</h4>
                          <p className="text-gray-700">{reflection.success_moment}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-xs text-gray-500">
                        Submitted on {new Date(reflection.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}