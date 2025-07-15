'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Search, Calendar, TrendingUp, Users, Award, Activity, ChevronUp, ChevronDown } from 'lucide-react'

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
  user_profiles: {
    first_name: string
    last_name: string
    team: string
    email: string
  }
}

interface TeamMetrics {
  team: string
  count: number
  avgConfidence: number
  avgRecommendation: number
}

interface ChartData {
  date: string
  confidence: number
  recommendation: number
  count: number
}

interface UserEngagement {
  userId: string
  name: string
  email: string
  team: string
  totalReflections: number
  avgConfidence: number
  lastActivity: string
  streak: number
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [userEngagement, setUserEngagement] = useState<UserEngagement[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedReflections, setSelectedReflections] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'recommendation'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const router = useRouter()

  const fetchReflections = useCallback(async () => {
    let query = supabase
      .from('reflections')
      .select(`
        *,
        user_profiles (
          first_name,
          last_name,
          team,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (dateFilter) {
      query = query.gte('bootcamp_date', dateFilter)
    }

    if (teamFilter) {
      query = query.eq('user_profiles.team', teamFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching reflections:', error)
    } else {
      setReflections(data || [])
      calculateTeamMetrics(data || [])
      calculateChartData(data || [])
      calculateUserEngagement(data || [])
    }
  }, [dateFilter, teamFilter])

  const calculateTeamMetrics = (reflections: Reflection[]) => {
    const teamData: { [key: string]: { count: number; totalConfidence: number; totalRecommendation: number } } = {}

    reflections.forEach(reflection => {
      const team = reflection.user_profiles?.team || 'No Team'
      if (!teamData[team]) {
        teamData[team] = { count: 0, totalConfidence: 0, totalRecommendation: 0 }
      }
      teamData[team].count++
      teamData[team].totalConfidence += reflection.confidence_level
      teamData[team].totalRecommendation += reflection.recommendation_score
    })

    const metrics = Object.entries(teamData).map(([team, data]) => ({
      team,
      count: data.count,
      avgConfidence: Number((data.totalConfidence / data.count).toFixed(1)),
      avgRecommendation: Number((data.totalRecommendation / data.count).toFixed(1))
    }))

    setTeamMetrics(metrics)
  }

  const calculateChartData = (reflections: Reflection[]) => {
    const dateData: { [key: string]: { confidence: number; recommendation: number; count: number } } = {}

    reflections.forEach(reflection => {
      const date = new Date(reflection.bootcamp_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      
      if (!dateData[date]) {
        dateData[date] = { confidence: 0, recommendation: 0, count: 0 }
      }
      
      dateData[date].confidence += reflection.confidence_level
      dateData[date].recommendation += reflection.recommendation_score
      dateData[date].count += 1
    })

    const chartData = Object.entries(dateData)
      .map(([date, data]) => ({
        date,
        confidence: Number((data.confidence / data.count).toFixed(1)),
        recommendation: Number((data.recommendation / data.count).toFixed(1)),
        count: data.count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    setChartData(chartData)
  }

  const calculateUserEngagement = (reflections: Reflection[]) => {
    const userData: { [key: string]: {
      name: string
      email: string
      team: string
      totalReflections: number
      totalConfidence: number
      lastActivity: string
      dates: string[]
    } } = {}

    reflections.forEach(reflection => {
      const userId = reflection.user_profiles?.email || 'unknown'
      const name = `${reflection.user_profiles?.first_name || ''} ${reflection.user_profiles?.last_name || ''}`.trim()
      
      if (!userData[userId]) {
        userData[userId] = {
          name: name || 'Unknown User',
          email: userId,
          team: reflection.user_profiles?.team || 'No Team',
          totalReflections: 0,
          totalConfidence: 0,
          lastActivity: reflection.created_at,
          dates: []
        }
      }
      
      userData[userId].totalReflections += 1
      userData[userId].totalConfidence += reflection.confidence_level
      userData[userId].dates.push(reflection.bootcamp_date)
      
      if (new Date(reflection.created_at) > new Date(userData[userId].lastActivity)) {
        userData[userId].lastActivity = reflection.created_at
      }
    })

    const calculateStreak = (dates: string[]) => {
      const uniqueDates = [...new Set(dates)].sort()
      let streak = 0
      const today = new Date()
      
      for (let i = uniqueDates.length - 1; i >= 0; i--) {
        const date = new Date(uniqueDates[i])
        const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === streak) {
          streak++
        } else {
          break
        }
      }
      
      return streak
    }

    const engagementData = Object.entries(userData).map(([userId, data]) => ({
      userId,
      name: data.name,
      email: data.email,
      team: data.team,
      totalReflections: data.totalReflections,
      avgConfidence: Number((data.totalConfidence / data.totalReflections).toFixed(1)),
      lastActivity: data.lastActivity,
      streak: calculateStreak(data.dates)
    }))

    setUserEngagement(engagementData.sort((a, b) => b.totalReflections - a.totalReflections))
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        router.push('/')
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUserProfile(profile)
      await fetchReflections()
      setLoading(false)
    }

    getUser()
  }, [router, fetchReflections])

  useEffect(() => {
    if (userProfile) {
      fetchReflections()
    }
  }, [dateFilter, teamFilter, userProfile, fetchReflections])

  const exportToCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Team',
      'Bootcamp Date',
      'Session',
      'Key Learnings',
      'Practical Applications',
      'Success Moment',
      'Confidence Level',
      'Recommendation Score',
      'Submitted At'
    ]

    const csvData = reflections.map(reflection => [
      `${reflection.user_profiles?.first_name || ''} ${reflection.user_profiles?.last_name || ''}`,
      reflection.user_profiles?.email || '',
      reflection.user_profiles?.team || '',
      reflection.bootcamp_date,
      reflection.bootcamp_session || '',
      reflection.key_learnings,
      reflection.practical_applications,
      reflection.success_moment,
      reflection.confidence_level,
      reflection.recommendation_score,
      new Date(reflection.created_at).toLocaleString()
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reflections-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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

  if (!user || !userProfile) {
    return null
  }

  // Filter and search reflections
  const filteredReflections = reflections.filter(reflection => {
    const matchesSearch = searchTerm === '' || 
      reflection.user_profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reflection.user_profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reflection.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reflection.key_learnings?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reflection.practical_applications?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reflection.success_moment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reflection.bootcamp_session?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Sort reflections
  const sortedReflections = [...filteredReflections].sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy) {
      case 'confidence':
        aValue = a.confidence_level
        bValue = b.confidence_level
        break
      case 'recommendation':
        aValue = a.recommendation_score
        bValue = b.recommendation_score
        break
      case 'date':
      default:
        aValue = new Date(a.bootcamp_date).getTime()
        bValue = new Date(b.bootcamp_date).getTime()
        break
    }
    
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
  })

  // Pagination
  const totalPages = Math.ceil(sortedReflections.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedReflections = sortedReflections.slice(startIndex, startIndex + itemsPerPage)

  // Stats
  const totalResponses = reflections.length
  const avgConfidence = reflections.length > 0 
    ? (reflections.reduce((sum, r) => sum + r.confidence_level, 0) / reflections.length).toFixed(1)
    : 0
  const avgRecommendation = reflections.length > 0
    ? (reflections.reduce((sum, r) => sum + r.recommendation_score, 0) / reflections.length).toFixed(1)
    : 0

  // Helper functions
  const handleSort = (field: 'date' | 'confidence' | 'recommendation') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReflections(paginatedReflections.map(r => r.id))
    } else {
      setSelectedReflections([])
    }
  }

  const handleSelectReflection = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedReflections([...selectedReflections, id])
    } else {
      setSelectedReflections(selectedReflections.filter(rid => rid !== id))
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Analytics
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Export CSV
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
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Responses</h3>
                  <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Avg Confidence</h3>
                  <p className="text-2xl font-bold text-gray-900">{avgConfidence}/10</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Avg Recommendation</h3>
                  <p className="text-2xl font-bold text-gray-900">{avgRecommendation}/10</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
                  <p className="text-2xl font-bold text-gray-900">{userEngagement.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Confidence Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Trends Over Time</h3>
              <div className="h-64">
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
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                      name="Confidence Level"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="recommendation" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                      name="Recommendation Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="team" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgConfidence" fill="#3B82F6" name="Avg Confidence" />
                    <Bar dataKey="avgRecommendation" fill="#10B981" name="Avg Recommendation" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* User Engagement */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">User Engagement</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reflections</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userEngagement.slice(0, 10).map((user) => (
                    <tr key={user.userId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.team}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.totalReflections}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.avgConfidence}/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.streak} days</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.lastActivity).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Metrics */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Team Metrics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Recommendation</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMetrics.map((team) => (
                    <tr key={team.team}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.team}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.avgConfidence}/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.avgRecommendation}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users, content, sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Teams</option>
                  {teamMetrics.map(team => (
                    <option key={team.team} value={team.team}>{team.team}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {paginatedReflections.length} of {filteredReflections.length} reflections
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            </div>
          </div>

          {/* All Reflections Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">All Reflections</h3>
                {selectedReflections.length > 0 && (
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Export Selected ({selectedReflections.length})
                    </button>
                    <button className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                      Archive Selected
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedReflections.length === paginatedReflections.length && paginatedReflections.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Date</span>
                        {sortBy === 'date' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('confidence')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Confidence</span>
                        {sortBy === 'confidence' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('recommendation')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Recommendation</span>
                        {sortBy === 'recommendation' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedReflections.map((reflection) => (
                    <>
                      <tr key={reflection.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedReflections.includes(reflection.id)}
                            onChange={(e) => handleSelectReflection(reflection.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {reflection.user_profiles?.first_name} {reflection.user_profiles?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{reflection.user_profiles?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reflection.user_profiles?.team || 'No Team'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(reflection.bootcamp_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reflection.bootcamp_session || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(reflection.confidence_level / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span>{reflection.confidence_level}/10</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${(reflection.recommendation_score / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span>{reflection.recommendation_score}/10</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => {
                              const expandedRow = document.getElementById(`expanded-${reflection.id}`)
                              if (expandedRow) {
                                expandedRow.style.display = expandedRow.style.display === 'none' ? 'table-row' : 'none'
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                      <tr id={`expanded-${reflection.id}`} style={{ display: 'none' }} className="bg-gray-50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-gray-900">Key Learnings:</h4>
                              <p className="text-gray-700 mt-1">{reflection.key_learnings}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Practical Applications:</h4>
                              <p className="text-gray-700 mt-1">{reflection.practical_applications}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Success/Aha Moment:</h4>
                              <p className="text-gray-700 mt-1">{reflection.success_moment}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                              Submitted: {new Date(reflection.created_at).toLocaleString()}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}