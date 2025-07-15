'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Target, Award, Calendar, Brain, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Reflection {
  id: string
  bootcamp_date: string
  confidence_level: number
  recommendation_score: number
  created_at: string
  key_learnings: string
  practical_applications: string
}

interface InsightData {
  date: string
  confidence: number
  recommendation: number
  dayOfWeek: string
}

export default function PersonalInsights() {
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<InsightData[]>([])
  const [stats, setStats] = useState({
    totalReflections: 0,
    avgConfidence: 0,
    avgRecommendation: 0,
    streak: 0,
    improvementRate: 0
  })

  useEffect(() => {
    fetchReflections()
  }, [])

  const fetchReflections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('bootcamp_date', { ascending: true })

      if (error) {
        console.error('Error fetching reflections:', error)
      } else {
        setReflections(data || [])
        processData(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const processData = (reflections: Reflection[]) => {
    // Create chart data
    const chartData = reflections.map(reflection => ({
      date: new Date(reflection.bootcamp_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      confidence: reflection.confidence_level,
      recommendation: reflection.recommendation_score,
      dayOfWeek: new Date(reflection.bootcamp_date).toLocaleDateString('en-US', { 
        weekday: 'short' 
      })
    }))

    setChartData(chartData)

    // Calculate stats
    const totalReflections = reflections.length
    const avgConfidence = totalReflections > 0 
      ? Math.round((reflections.reduce((sum, r) => sum + r.confidence_level, 0) / totalReflections) * 10) / 10
      : 0
    const avgRecommendation = totalReflections > 0
      ? Math.round((reflections.reduce((sum, r) => sum + r.recommendation_score, 0) / totalReflections) * 10) / 10
      : 0

    // Calculate improvement rate (confidence change from first to last)
    const improvementRate = reflections.length > 1
      ? Math.round(((reflections[reflections.length - 1].confidence_level - reflections[0].confidence_level) / reflections[0].confidence_level) * 100)
      : 0

    // Calculate streak (consecutive days with reflections)
    const streak = calculateStreak(reflections)

    setStats({
      totalReflections,
      avgConfidence,
      avgRecommendation,
      streak,
      improvementRate
    })
  }

  const calculateStreak = (reflections: Reflection[]) => {
    if (reflections.length === 0) return 0
    
    const dates = reflections.map(r => new Date(r.bootcamp_date).toDateString())
    const uniqueDates = [...new Set(dates)].sort()
    
    let streak = 0
    const today = new Date().toDateString()
    
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const date = new Date(uniqueDates[i])
      const daysDiff = Math.floor((new Date(today).getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === streak) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (reflections.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No reflections yet</h3>
        <p className="text-gray-600">Start documenting your AI learning journey to see insights!</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Reflections</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReflections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgConfidence}/10</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Learning Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.streak} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Improvement</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.improvementRate > 0 ? '+' : ''}{stats.improvementRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Confidence Progress Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                name="Confidence Level"
              />
              <Line 
                type="monotone" 
                dataKey="recommendation" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                name="Recommendation Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Insights */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Learning Highlights</h3>
        <div className="space-y-4">
          {reflections.slice(-3).reverse().map((reflection) => (
            <div key={reflection.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-gray-600">
                  {new Date(reflection.bootcamp_date).toLocaleDateString()}
                </p>
                <div className="flex space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Confidence: {reflection.confidence_level}/10
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Recommend: {reflection.recommendation_score}/10
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-900 font-medium mb-1">Key Learning:</p>
              <p className="text-sm text-gray-700 line-clamp-2">
                {reflection.key_learnings.substring(0, 150)}...
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}