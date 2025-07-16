'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Search, Calendar, TrendingUp, Users, Award, Activity, ChevronUp, ChevronDown, Moon, Sun, Download, RefreshCw, BookOpen, Heart, Clock, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Sentiment from 'sentiment'

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

interface JournalEntry {
  id: string
  title?: string
  content: string
  mood?: string
  tags?: string[]
  created_at: string
  user_id: string
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
  totalJournalEntries: number
  avgConfidence: number
  lastActivity: string
  streak: number
}

interface SentimentData {
  date: string
  sentiment: number
  moodDistribution: {
    great: number
    good: number
    okay: number
    down: number
  }
}

interface ParticipationPattern {
  hour: number
  dayOfWeek: number
  count: number
  day: string
}

interface LearningProgress {
  userId: string
  name: string
  confidenceProgression: Array<{
    date: string
    confidence: number
    week: number
  }>
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [userEngagement, setUserEngagement] = useState<UserEngagement[]>([])
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([])
  const [participationPatterns, setParticipationPatterns] = useState<ParticipationPattern[]>([])
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
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
    }
  }, [dateFilter, teamFilter])

  const fetchJournalEntries = useCallback(async () => {
    let query = supabase
      .from('journal_entries')
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
      query = query.gte('created_at', dateFilter)
    }

    if (teamFilter) {
      query = query.eq('user_profiles.team', teamFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching journal entries:', error)
    } else {
      setJournalEntries(data || [])
    }
  }, [dateFilter, teamFilter])

  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchReflections(), fetchJournalEntries()])
  }, [fetchReflections, fetchJournalEntries])

  // Calculate all metrics when data changes
  useEffect(() => {
    if (reflections.length > 0 || journalEntries.length > 0) {
      calculateTeamMetrics(reflections)
      calculateChartData(reflections)
      calculateUserEngagement(reflections, journalEntries)
      calculateSentimentData(reflections, journalEntries)
      calculateParticipationPatterns(reflections, journalEntries)
      calculateLearningProgress(reflections)
    }
  }, [reflections, journalEntries])

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

  const calculateUserEngagement = (reflections: Reflection[], journalEntries: JournalEntry[]) => {
    const userData: { [key: string]: {
      name: string
      email: string
      team: string
      totalReflections: number
      totalJournalEntries: number
      totalConfidence: number
      lastActivity: string
      dates: string[]
    } } = {}

    // Process reflections
    reflections.forEach(reflection => {
      const userId = reflection.user_profiles?.email || 'unknown'
      const name = `${reflection.user_profiles?.first_name || ''} ${reflection.user_profiles?.last_name || ''}`.trim()
      
      if (!userData[userId]) {
        userData[userId] = {
          name: name || 'Unknown User',
          email: userId,
          team: reflection.user_profiles?.team || 'No Team',
          totalReflections: 0,
          totalJournalEntries: 0,
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

    // Process journal entries
    journalEntries.forEach(entry => {
      const userId = entry.user_profiles?.email || 'unknown'
      const name = `${entry.user_profiles?.first_name || ''} ${entry.user_profiles?.last_name || ''}`.trim()
      
      if (!userData[userId]) {
        userData[userId] = {
          name: name || 'Unknown User',
          email: userId,
          team: entry.user_profiles?.team || 'No Team',
          totalReflections: 0,
          totalJournalEntries: 0,
          totalConfidence: 0,
          lastActivity: entry.created_at,
          dates: []
        }
      }
      
      userData[userId].totalJournalEntries += 1
      userData[userId].dates.push(entry.created_at.split('T')[0])
      
      if (new Date(entry.created_at) > new Date(userData[userId].lastActivity)) {
        userData[userId].lastActivity = entry.created_at
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
      totalJournalEntries: data.totalJournalEntries,
      avgConfidence: data.totalReflections > 0 ? Number((data.totalConfidence / data.totalReflections).toFixed(1)) : 0,
      lastActivity: data.lastActivity,
      streak: calculateStreak(data.dates)
    }))

    setUserEngagement(engagementData.sort((a, b) => (b.totalReflections + b.totalJournalEntries) - (a.totalReflections + a.totalJournalEntries)))
  }

  const calculateSentimentData = (reflections: Reflection[], journalEntries: JournalEntry[]) => {
    const sentiment = new Sentiment()
    const dateData: { [key: string]: { 
      sentimentScores: number[]
      moods: { great: number; good: number; okay: number; down: number }
    } } = {}

    // Process reflections for sentiment
    reflections.forEach(reflection => {
      const date = new Date(reflection.bootcamp_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      
      if (!dateData[date]) {
        dateData[date] = {
          sentimentScores: [],
          moods: { great: 0, good: 0, okay: 0, down: 0 }
        }
      }
      
      const text = `${reflection.key_learnings} ${reflection.practical_applications} ${reflection.success_moment}`
      const score = sentiment.analyze(text).score
      dateData[date].sentimentScores.push(score)
    })

    // Process journal entries for sentiment and mood
    journalEntries.forEach(entry => {
      const date = new Date(entry.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      
      if (!dateData[date]) {
        dateData[date] = {
          sentimentScores: [],
          moods: { great: 0, good: 0, okay: 0, down: 0 }
        }
      }
      
      const score = sentiment.analyze(entry.content).score
      dateData[date].sentimentScores.push(score)
      
      if (entry.mood) {
        const mood = entry.mood as 'great' | 'good' | 'okay' | 'down'
        if (mood in dateData[date].moods) {
          dateData[date].moods[mood]++
        }
      }
    })

    const sentimentData = Object.entries(dateData)
      .map(([date, data]) => ({
        date,
        sentiment: data.sentimentScores.length > 0 
          ? data.sentimentScores.reduce((sum, score) => sum + score, 0) / data.sentimentScores.length
          : 0,
        moodDistribution: data.moods
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    setSentimentData(sentimentData)
  }

  const calculateParticipationPatterns = (reflections: Reflection[], journalEntries: JournalEntry[]) => {
    const patterns: { [key: string]: number } = {}
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    // Process reflections
    reflections.forEach(reflection => {
      const date = new Date(reflection.created_at)
      const hour = date.getHours()
      const dayOfWeek = date.getDay()
      const key = `${dayOfWeek}-${hour}`
      patterns[key] = (patterns[key] || 0) + 1
    })

    // Process journal entries
    journalEntries.forEach(entry => {
      const date = new Date(entry.created_at)
      const hour = date.getHours()
      const dayOfWeek = date.getDay()
      const key = `${dayOfWeek}-${hour}`
      patterns[key] = (patterns[key] || 0) + 1
    })

    const participationData = Object.entries(patterns).map(([key, count]) => {
      const [dayOfWeek, hour] = key.split('-').map(Number)
      return {
        hour,
        dayOfWeek,
        count,
        day: daysOfWeek[dayOfWeek]
      }
    })

    setParticipationPatterns(participationData)
  }

  const calculateLearningProgress = (reflections: Reflection[]) => {
    const userProgress: { [key: string]: {
      name: string
      confidencePoints: Array<{ date: string; confidence: number }>
    } } = {}

    reflections.forEach(reflection => {
      const userId = reflection.user_profiles?.email || 'unknown'
      const name = `${reflection.user_profiles?.first_name || ''} ${reflection.user_profiles?.last_name || ''}`.trim()
      
      if (!userProgress[userId]) {
        userProgress[userId] = {
          name: name || 'Unknown User',
          confidencePoints: []
        }
      }
      
      userProgress[userId].confidencePoints.push({
        date: reflection.bootcamp_date,
        confidence: reflection.confidence_level
      })
    })

    const progressData = Object.entries(userProgress).map(([userId, data]) => {
      const sortedPoints = data.confidencePoints.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      
      const confidenceProgression = sortedPoints.map((point, index) => ({
        date: point.date,
        confidence: point.confidence,
        week: index + 1
      }))

      return {
        userId,
        name: data.name,
        confidenceProgression
      }
    })

    setLearningProgress(progressData.filter(user => user.confidenceProgression.length > 1))
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
      await fetchAllData()
      setLoading(false)
    }

    getUser()
  }, [router, fetchAllData])

  useEffect(() => {
    if (userProfile) {
      fetchAllData()
    }
  }, [dateFilter, teamFilter, userProfile, fetchAllData])

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAllData()
      }, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, fetchAllData])

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

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

  const exportToPDF = async () => {
    const pdf = new jsPDF()
    const dashboardElement = document.getElementById('dashboard-content')
    
    if (dashboardElement) {
      const canvas = await html2canvas(dashboardElement, {
        scale: 0.5,
        useCORS: true,
        allowTaint: true
      })
      
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      pdf.save(`admin-dashboard-${new Date().toISOString().split('T')[0]}.pdf`)
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
  const totalJournalEntries = journalEntries.length
  const totalEntries = totalResponses + totalJournalEntries
  const avgConfidence = reflections.length > 0 
    ? (reflections.reduce((sum, r) => sum + r.confidence_level, 0) / reflections.length).toFixed(1)
    : 0
  const avgRecommendation = reflections.length > 0
    ? (reflections.reduce((sum, r) => sum + r.recommendation_score, 0) / reflections.length).toFixed(1)
    : 0
  const avgSentiment = sentimentData.length > 0
    ? (sentimentData.reduce((sum, s) => sum + s.sentiment, 0) / sentimentData.length).toFixed(1)
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
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`shadow transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className={`text-3xl font-bold transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Admin Analytics Dashboard
            </h1>
            <div className="flex space-x-4 items-center">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                  autoRefresh 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  darkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                onClick={exportToPDF}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
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
        <div id="dashboard-content" className="px-4 py-6 sm:px-0">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className={`text-sm font-medium transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Entries</h3>
                  <p className={`text-2xl font-bold transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalEntries}</p>
                  <p className={`text-xs transition-colors duration-200 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {totalResponses} reflections, {totalJournalEntries} journal
                  </p>
                </div>
              </div>
            </div>
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className={`text-sm font-medium transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Confidence</h3>
                  <p className={`text-2xl font-bold transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{avgConfidence}/10</p>
                </div>
              </div>
            </div>
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className={`text-sm font-medium transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Recommendation</h3>
                  <p className={`text-2xl font-bold transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{avgRecommendation}/10</p>
                </div>
              </div>
            </div>
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Heart className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className={`text-sm font-medium transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Sentiment</h3>
                  <p className={`text-2xl font-bold transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{avgSentiment}</p>
                </div>
              </div>
            </div>
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className={`text-sm font-medium transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active Users</h3>
                  <p className={`text-2xl font-bold transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userEngagement.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Confidence Trends */}
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Confidence Trends Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="date" tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                    <YAxis domain={[0, 10]} tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                        color: darkMode ? '#FFFFFF' : '#000000'
                      }} 
                    />
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

            {/* Sentiment Analysis */}
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sentiment Trends Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sentimentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="date" tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                    <YAxis tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                        color: darkMode ? '#FFFFFF' : '#000000'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sentiment" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.3}
                      name="Sentiment Score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team Performance */}
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Team Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="team" tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                    <YAxis tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                        color: darkMode ? '#FFFFFF' : '#000000'
                      }} 
                    />
                    <Bar dataKey="avgConfidence" fill="#3B82F6" name="Avg Confidence" />
                    <Bar dataKey="avgRecommendation" fill="#10B981" name="Avg Recommendation" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Learning Progress */}
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Learning Progress (Top 5 Users)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={learningProgress.slice(0, 5).flatMap(user => 
                    user.confidenceProgression.map(point => ({
                      ...point,
                      user: user.name
                    }))
                  )}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="week" tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                    <YAxis domain={[0, 10]} tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                        color: darkMode ? '#FFFFFF' : '#000000'
                      }} 
                    />
                    {learningProgress.slice(0, 5).map((user, index) => (
                      <Line 
                        key={user.userId}
                        type="monotone" 
                        dataKey="confidence" 
                        stroke={['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'][index]}
                        strokeWidth={2}
                        dot={{ fill: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'][index], strokeWidth: 2, r: 3 }}
                        name={user.name}
                        data={user.confidenceProgression}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* New Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Participation Patterns Heatmap */}
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Participation Patterns (By Hour & Day)</h3>
              <div className="h-64">
                <div className="grid grid-cols-7 gap-1 h-full">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                    <div key={day} className="flex flex-col">
                      <div className={`text-xs text-center mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {day}
                      </div>
                      <div className="flex-1 grid grid-rows-24 gap-0.5">
                        {Array.from({ length: 24 }, (_, hour) => {
                          const pattern = participationPatterns.find(p => p.dayOfWeek === dayIndex && p.hour === hour)
                          const intensity = pattern ? Math.min(pattern.count / 10, 1) : 0
                          return (
                            <div
                              key={hour}
                              className={`rounded-sm transition-all duration-200 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-100'
                              }`}
                              style={{
                                backgroundColor: intensity > 0 
                                  ? `rgba(59, 130, 246, ${intensity})` 
                                  : darkMode ? '#374151' : '#F3F4F6'
                              }}
                              title={`${day} ${hour}:00 - ${pattern?.count || 0} submissions`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mood Distribution Pie Chart */}
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Overall Mood Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Great', value: sentimentData.reduce((sum, s) => sum + s.moodDistribution.great, 0), fill: '#10B981' },
                        { name: 'Good', value: sentimentData.reduce((sum, s) => sum + s.moodDistribution.good, 0), fill: '#3B82F6' },
                        { name: 'Okay', value: sentimentData.reduce((sum, s) => sum + s.moodDistribution.okay, 0), fill: '#F59E0B' },
                        { name: 'Down', value: sentimentData.reduce((sum, s) => sum + s.moodDistribution.down, 0), fill: '#EF4444' }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Great', value: sentimentData.reduce((sum, s) => sum + s.moodDistribution.great, 0), fill: '#10B981' },
                        { name: 'Good', value: sentimentData.reduce((sum, s) => sum + s.moodDistribution.good, 0), fill: '#3B82F6' },
                        { name: 'Okay', value: sentimentData.reduce((sum, s) => sum + s.moodDistribution.okay, 0), fill: '#F59E0B' },
                        { name: 'Down', value: sentimentData.reduce((sum, s) => sum + s.moodDistribution.down, 0), fill: '#EF4444' }
                      ].filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                        color: darkMode ? '#FFFFFF' : '#000000'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* User Engagement */}
          <div className={`rounded-lg shadow mb-8 transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b transition-colors duration-200 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Engagement</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`transition-colors duration-200 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>User</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Team</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reflections</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Journal</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Confidence</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Streak</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Activity</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors duration-200 ${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                  {userEngagement.slice(0, 10).map((user) => (
                    <tr key={user.userId} className={`transition-colors duration-200 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                        <div className={`text-sm transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{user.team}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {user.totalReflections}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {user.totalJournalEntries}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{user.avgConfidence}/10</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {user.streak} days
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
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