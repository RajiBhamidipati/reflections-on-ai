'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ReflectionForm from '@/components/ReflectionForm'
import { BookOpen, Calendar, TrendingUp, Target, Plus, User, BarChart3, Lightbulb, Clock, Activity } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

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
  const [activeTab, setActiveTab] = useState('overview')
  const [editingReflection, setEditingReflection] = useState<Reflection | null>(null)
  const [stats, setStats] = useState({
    totalReflections: 0,
    avgConfidence: 0,
    learningStreak: 0,
    thisWeekReflections: 0,
    learningMomentum: 'Medium',
    topKeywords: [] as string[],
    confidenceTrend: [] as { date: string; confidence: number }[],
    sentimentTrend: [] as { date: string; sentiment: number; label: string }[],
  })
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
        calculateStats(reflections || [])
      }
      
      setLoading(false)
    }

    getUser()
  }, [router])

  const calculateStats = (reflections: Reflection[]) => {
    const totalReflections = reflections.length
    const avgConfidence = totalReflections > 0 
      ? reflections.reduce((sum, r) => sum + r.confidence_level, 0) / totalReflections
      : 0

    // Calculate this week's reflections
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const thisWeekReflections = reflections.filter(r => 
      new Date(r.created_at) >= oneWeekAgo
    ).length

    // Calculate learning streak
    const dates = reflections.map(r => new Date(r.bootcamp_date).toDateString())
    const uniqueDates = [...new Set(dates)].sort()
    const learningStreak = calculateStreak(uniqueDates)

    // Calculate learning momentum
    const recentReflections = reflections.slice(0, 5)
    const recentAvgConfidence = recentReflections.length > 0
      ? recentReflections.reduce((sum, r) => sum + r.confidence_level, 0) / recentReflections.length
      : 0
    
    let learningMomentum = 'Medium'
    if (thisWeekReflections >= 3 && recentAvgConfidence >= 7) learningMomentum = 'High'
    else if (thisWeekReflections <= 1 || recentAvgConfidence < 5) learningMomentum = 'Low'

    // Extract simple keywords
    const allText = reflections.map(r => 
      `${r.key_learnings} ${r.practical_applications} ${r.success_moment}`
    ).join(' ')
    const topKeywords = extractSimpleKeywords(allText)

    // Calculate confidence trend (last 10 reflections)
    const confidenceTrend = reflections.slice(0, 10).reverse().map(r => ({
      date: new Date(r.bootcamp_date).toLocaleDateString(),
      confidence: r.confidence_level
    }))

    // Calculate simple sentiment trend
    const sentimentTrend = reflections.slice(0, 10).reverse().map(r => {
      const text = `${r.key_learnings} ${r.practical_applications} ${r.success_moment}`.toLowerCase()
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'successful', 'confident', 'clear', 'understand', 'learned', 'progress', 'helpful', 'useful', 'effective', 'easy', 'smooth', 'better', 'improved']
      const negativeWords = ['difficult', 'hard', 'challenging', 'confusing', 'frustrated', 'stuck', 'problem', 'issue', 'trouble', 'complicated', 'unclear', 'wrong', 'mistake', 'failed', 'error']
      
      const words = text.split(' ')
      let positiveCount = 0
      let negativeCount = 0
      
      words.forEach(word => {
        if (positiveWords.includes(word)) positiveCount++
        if (negativeWords.includes(word)) negativeCount++
      })
      
      const sentiment = positiveCount - negativeCount
      const normalizedSentiment = sentiment > 0 ? Math.min(sentiment / 3, 1) : sentiment < 0 ? Math.max(sentiment / 3, -1) : 0
      
      let label = 'Neutral'
      if (normalizedSentiment > 0.2) label = 'Positive'
      else if (normalizedSentiment < -0.2) label = 'Negative'
      
      return {
        date: new Date(r.bootcamp_date).toLocaleDateString(),
        sentiment: normalizedSentiment,
        label
      }
    })

    setStats({
      totalReflections,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      learningStreak,
      thisWeekReflections,
      learningMomentum,
      topKeywords: topKeywords.slice(0, 10),
      confidenceTrend,
      sentimentTrend,
    })
  }

  const calculateStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0
    let streak = 0
    const today = new Date().toDateString()
    
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = new Date(dates[i])
      const daysDiff = Math.floor((new Date(today).getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff === streak) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  const extractSimpleKeywords = (text: string): string[] => {
    const words = text.toLowerCase().split(' ')
    const filtered = words.filter(word => word.length > 4)
    return filtered.slice(0, 10)
  }

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case 'High': return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'Low': return <Activity className="h-5 w-5 text-red-600" />
      default: return <BarChart3 className="h-5 w-5 text-yellow-600" />
    }
  }

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'High': return 'text-green-600'
      case 'Low': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

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
              📚 Learning Dashboard
            </h1>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/new-reflection')}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Entry</span>
              </button>
              <button
                onClick={() => router.push('/journal')}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                <BookOpen className="h-4 w-4" />
                <span>Journal</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <User className="h-4 w-4" />
                <span>Sign Out</span>
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
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'progress'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Progress</span>
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'insights'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Lightbulb className="h-4 w-4" />
                <span>Insights</span>
              </button>
              <button
                onClick={() => setActiveTab('entries')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'entries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>All Entries</span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Total Reflections</p>
                      <p className="text-2xl font-bold">{stats.totalReflections}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Avg Confidence</p>
                      <p className="text-2xl font-bold">{stats.avgConfidence}/10</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Learning Streak</p>
                      <p className="text-2xl font-bold">{stats.learningStreak} days</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">This Week</p>
                      <p className="text-2xl font-bold">{stats.thisWeekReflections}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    {getMomentumIcon(stats.learningMomentum)}
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Learning Momentum</p>
                      <p className={`text-2xl font-bold ${getMomentumColor(stats.learningMomentum)}`}>
                        {stats.learningMomentum}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Learning Highlights */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Learning Highlights</h3>
                  {reflections.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No reflections yet. Start your learning journey!</p>
                      <button
                        onClick={() => router.push('/new-reflection')}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                      >
                        Add Your First Reflection
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reflections.slice(0, 3).map((reflection) => (
                        <div key={reflection.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="text-sm text-gray-500">
                                {new Date(reflection.bootcamp_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  🎯 {reflection.confidence_level}/10
                                </span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  ⭐ {reflection.recommendation_score}/10
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setEditingReflection(reflection)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">
                                📝 {reflection.bootcamp_session || 'AI Learning Session'}
                              </h4>
                              <p className="text-gray-700 text-sm mt-1">
                                {reflection.key_learnings.length > 120 
                                  ? `${reflection.key_learnings.substring(0, 120)}...` 
                                  : reflection.key_learnings}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">💡 Applied to:</span>
                              <span className="text-xs text-gray-700 ml-1">
                                {reflection.practical_applications.length > 80 
                                  ? `${reflection.practical_applications.substring(0, 80)}...` 
                                  : reflection.practical_applications}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mini Confidence Chart */}
              {stats.confidenceTrend.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Recent Confidence Trend</h3>
                    <div className="h-48">
                      <Line
                        data={{
                          labels: stats.confidenceTrend.slice(-5).map(item => item.date),
                          datasets: [
                            {
                              label: 'Confidence Level',
                              data: stats.confidenceTrend.slice(-5).map(item => item.confidence),
                              borderColor: 'rgb(59, 130, 246)',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              tension: 0.1,
                              fill: true,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `Confidence: ${context.parsed.y}/10`
                                }
                              }
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 10,
                              ticks: {
                                callback: function(value) {
                                  return `${value}/10`
                                }
                              }
                            },
                          },
                        }}
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setActiveTab('progress')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View full progress charts →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => router.push('/new-reflection')}
                      className="flex items-center space-x-3 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">Add Today&apos;s Reflection</span>
                    </button>
                    <button
                      onClick={() => router.push('/journal')}
                      className="flex items-center space-x-3 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <BookOpen className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">Browse Learning Journal</span>
                    </button>
                    <button className="flex items-center space-x-3 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                      <Target className="h-5 w-5 text-purple-600" />
                      <span className="text-purple-800 font-medium">Set Learning Goal</span>
                    </button>
                    <button className="flex items-center space-x-3 p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                      <Lightbulb className="h-5 w-5 text-orange-600" />
                      <span className="text-orange-800 font-medium">Suggest Next Topic</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              {/* Confidence Progress Chart */}
              {stats.confidenceTrend.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Confidence Progress Over Time</h3>
                    <div className="h-64">
                      <Line
                        data={{
                          labels: stats.confidenceTrend.map(item => item.date),
                          datasets: [
                            {
                              label: 'Confidence Level',
                              data: stats.confidenceTrend.map(item => item.confidence),
                              borderColor: 'rgb(59, 130, 246)',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              tension: 0.1,
                              fill: true,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `Confidence: ${context.parsed.y}/10`
                                }
                              }
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 10,
                              ticks: {
                                callback: function(value) {
                                  return `${value}/10`
                                }
                              }
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sentiment Trend Chart */}
              {stats.sentimentTrend.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">😊 Learning Sentiment Over Time</h3>
                    <div className="h-64">
                      <Line
                        data={{
                          labels: stats.sentimentTrend.map(item => item.date),
                          datasets: [
                            {
                              label: 'Sentiment',
                              data: stats.sentimentTrend.map(item => item.sentiment),
                              borderColor: 'rgb(34, 197, 94)',
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              tension: 0.1,
                              fill: true,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const value = context.parsed.y
                                  const label = value > 0.2 ? 'Positive' : value < -0.2 ? 'Negative' : 'Neutral'
                                  return `Sentiment: ${label} (${value.toFixed(2)})`
                                }
                              }
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              min: -1,
                              max: 1,
                              ticks: {
                                callback: function(value) {
                                  const numValue = typeof value === 'number' ? value : parseFloat(value)
                                  if (numValue > 0.2) return 'Positive'
                                  if (numValue < -0.2) return 'Negative'
                                  return 'Neutral'
                                }
                              }
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Learning Frequency Heatmap */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Learning Activity (Last 7 Days)</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {[...Array(7)].map((_, i) => {
                      const date = new Date()
                      date.setDate(date.getDate() - (6 - i))
                      const hasReflection = reflections.some(r => 
                        new Date(r.bootcamp_date).toDateString() === date.toDateString()
                      )
                      return (
                        <div key={i} className="text-center">
                          <div className="text-xs text-gray-500 mb-1">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center text-white font-bold ${
                            hasReflection ? 'bg-green-500' : 'bg-gray-200'
                          }`}>
                            {hasReflection ? '✓' : ''}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {date.getDate()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Progress Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalReflections}</div>
                      <div className="text-sm text-blue-800">Total Reflections</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.avgConfidence}/10</div>
                      <div className="text-sm text-green-800">Average Confidence</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats.learningStreak}</div>
                      <div className="text-sm text-purple-800">Day Streak</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* Smart Insights */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Smart Insights</h3>
                  <div className="space-y-3">
                    {stats.avgConfidence >= 7 && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                        <p className="text-gray-700">You&apos;re showing high confidence in your learning - keep it up!</p>
                      </div>
                    )}
                    {stats.learningStreak >= 3 && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                        <p className="text-gray-700">Great job maintaining a {stats.learningStreak}-day learning streak!</p>
                      </div>
                    )}
                    {stats.thisWeekReflections >= 3 && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                        <p className="text-gray-700">You&apos;re very active this week with {stats.thisWeekReflections} reflections.</p>
                      </div>
                    )}
                    {stats.totalReflections === 0 && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2" />
                        <p className="text-gray-700">Start adding reflections to see personalized insights!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'entries' && (
            <div>
              {reflections.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              Confidence: {reflection.confidence_level}/10
                            </div>
                            <div className="text-sm text-gray-600">
                              Recommendation: {reflection.recommendation_score}/10
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingReflection(reflection)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
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

      {/* Edit Modal */}
      {editingReflection && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Reflection</h3>
              <button
                onClick={() => setEditingReflection(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ReflectionForm
              editingReflection={editingReflection}
              onSuccess={() => {
                setEditingReflection(null)
                // Refresh reflections
                const getUser = async () => {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return

                  const { data } = await supabase
                    .from('reflections')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                  setReflections(data || [])
                  calculateStats(data || [])
                }
                getUser()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}