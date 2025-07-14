'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

export default function AdminPage() {
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const router = useRouter()

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
  }, [router])

  const fetchReflections = async () => { // eslint-disable-line react-hooks/exhaustive-deps
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
    }
  }

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

  useEffect(() => {
    if (userProfile) {
      fetchReflections()
    }
  }, [dateFilter, teamFilter, userProfile]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const totalResponses = reflections.length
  const avgConfidence = reflections.length > 0 
    ? (reflections.reduce((sum, r) => sum + r.confidence_level, 0) / reflections.length).toFixed(1)
    : 0
  const avgRecommendation = reflections.length > 0
    ? (reflections.reduce((sum, r) => sum + r.recommendation_score, 0) / reflections.length).toFixed(1)
    : 0

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Total Responses</h3>
              <p className="text-3xl font-bold text-blue-600">{totalResponses}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Avg Confidence</h3>
              <p className="text-3xl font-bold text-green-600">{avgConfidence}/10</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Avg Recommendation</h3>
              <p className="text-3xl font-bold text-purple-600">{avgRecommendation}/10</p>
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

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
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
          </div>

          {/* All Reflections Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Reflections</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reflections.map((reflection) => (
                    <tr key={reflection.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {reflection.user_profiles?.first_name} {reflection.user_profiles?.last_name}
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
                        {reflection.confidence_level}/10
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reflection.recommendation_score}/10
                      </td>
                    </tr>
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