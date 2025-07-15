'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, Calendar, BookOpen, Filter, Clock, Tag, TrendingUp, Brain } from 'lucide-react'

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

interface SearchFilters {
  searchTerm: string
  dateRange: 'all' | 'week' | 'month' | 'quarter' | 'year'
  confidenceRange: 'all' | 'low' | 'medium' | 'high'
  sortBy: 'recent' | 'oldest' | 'confidence' | 'relevance'
}

export default function JournalPage() {
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [filteredReflections, setFilteredReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null)
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    dateRange: 'all',
    confidenceRange: 'all',
    sortBy: 'recent'
  })
  const [searchStats, setSearchStats] = useState({
    totalReflections: 0,
    avgConfidence: 0,
    topKeywords: [] as string[],
    learningStreak: 0
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
        setFilteredReflections(reflections || [])
        calculateStats(reflections || [])
      }
      
      setLoading(false)
    }

    getUser()
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterReflections()
  }, [filters, reflections]) // eslint-disable-line react-hooks/exhaustive-deps

  const calculateStats = (reflections: Reflection[]) => {
    const totalReflections = reflections.length
    const avgConfidence = totalReflections > 0 
      ? reflections.reduce((sum, r) => sum + r.confidence_level, 0) / totalReflections
      : 0

    // Extract keywords from reflections
    const allText = reflections.map(r => 
      `${r.key_learnings} ${r.practical_applications} ${r.success_moment} ${r.bootcamp_session}`
    ).join(' ')
    
    const keywords = extractKeywords(allText)
    
    // Calculate learning streak
    const dates = reflections.map(r => new Date(r.bootcamp_date).toDateString())
    const uniqueDates = [...new Set(dates)].sort()
    const streak = calculateStreak(uniqueDates)

    setSearchStats({
      totalReflections,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      topKeywords: keywords.slice(0, 5),
      learningStreak: streak
    })
  }

  const extractKeywords = (text: string): string[] => {
    // Simple keyword extraction - remove common words and get frequency
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their']
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
    
    const frequency: { [key: string]: number } = {}
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .map(([word]) => word)
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

  const filterReflections = () => {
    let filtered = [...reflections]

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(r => 
        r.key_learnings.toLowerCase().includes(term) ||
        r.practical_applications.toLowerCase().includes(term) ||
        r.success_moment.toLowerCase().includes(term) ||
        r.bootcamp_session.toLowerCase().includes(term)
      )
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      
      switch (filters.dateRange) {
        case 'week':
          cutoff.setDate(now.getDate() - 7)
          break
        case 'month':
          cutoff.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          cutoff.setMonth(now.getMonth() - 3)
          break
        case 'year':
          cutoff.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(r => new Date(r.bootcamp_date) >= cutoff)
    }

    // Confidence range filter
    if (filters.confidenceRange !== 'all') {
      filtered = filtered.filter(r => {
        switch (filters.confidenceRange) {
          case 'low': return r.confidence_level <= 4
          case 'medium': return r.confidence_level >= 5 && r.confidence_level <= 7
          case 'high': return r.confidence_level >= 8
          default: return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'confidence':
          return b.confidence_level - a.confidence_level
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredReflections(filtered)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      dateRange: 'all',
      confidenceRange: 'all',
      sortBy: 'recent'
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'text-green-600 bg-green-100'
    if (confidence >= 5) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 8) return 'High'
    if (confidence >= 5) return 'Medium'
    return 'Low'
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
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Learning Journal
              </h1>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/new-reflection')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Entry
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Total Entries</p>
                  <p className="text-2xl font-bold">{searchStats.totalReflections}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Avg Confidence</p>
                  <p className="text-2xl font-bold">{searchStats.avgConfidence}/10</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Learning Streak</p>
                  <p className="text-2xl font-bold">{searchStats.learningStreak} days</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Tag className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Top Keywords</p>
                  <p className="text-sm font-medium">{searchStats.topKeywords.slice(0, 3).join(', ')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <Search className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search your reflections..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Time</option>
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="quarter">Last Quarter</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Level</label>
                    <select
                      value={filters.confidenceRange}
                      onChange={(e) => handleFilterChange('confidenceRange', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="high">High (8-10)</option>
                      <option value="medium">Medium (5-7)</option>
                      <option value="low">Low (1-4)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="oldest">Oldest First</option>
                      <option value="confidence">Highest Confidence</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {filteredReflections.length} Reflection{filteredReflections.length !== 1 ? 's' : ''}
                </h2>
                {filters.searchTerm && (
                  <span className="text-sm text-gray-500">
                    Results for &quot;{filters.searchTerm}&quot;
                  </span>
                )}
              </div>
              
              {filteredReflections.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No reflections found</h3>
                  <p className="text-gray-600">
                    {filters.searchTerm ? 'Try adjusting your search terms' : 'Start documenting your AI learning journey'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReflections.map((reflection) => (
                    <div 
                      key={reflection.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedReflection(reflection)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm text-gray-600">
                              {new Date(reflection.bootcamp_date).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getConfidenceColor(reflection.confidence_level)}`}>
                              {getConfidenceLabel(reflection.confidence_level)}
                            </span>
                            {reflection.bootcamp_session && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {reflection.bootcamp_session}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium mb-1">
                            {reflection.key_learnings.substring(0, 100)}...
                          </p>
                          <p className="text-sm text-gray-600">
                            {reflection.practical_applications.substring(0, 150)}...
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(reflection.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Reflection Detail Modal */}
      {selectedReflection && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedReflection.bootcamp_session || 'AI Learning Reflection'}
              </h3>
              <button
                onClick={() => setSelectedReflection(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{new Date(selectedReflection.bootcamp_date).toLocaleDateString()}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getConfidenceColor(selectedReflection.confidence_level)}`}>
                  Confidence: {selectedReflection.confidence_level}/10
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Recommend: {selectedReflection.recommendation_score}/10
                </span>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Learnings</h4>
                <p className="text-gray-700">{selectedReflection.key_learnings}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Practical Applications</h4>
                <p className="text-gray-700">{selectedReflection.practical_applications}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Success Moment</h4>
                <p className="text-gray-700">{selectedReflection.success_moment}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}