'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, Calendar, BookOpen, Filter, Clock, Tag, TrendingUp, Brain, Smile, Meh, Frown, Plus, Edit3, Trash2 } from 'lucide-react'
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

interface JournalEntry {
  id: string
  title?: string
  content: string
  mood?: string
  tags?: string[]
  created_at: string
  updated_at: string
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
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [filteredJournalEntries, setFilteredJournalEntries] = useState<JournalEntry[]>([])
  const [activeTab, setActiveTab] = useState<'entries' | 'reflections'>('entries')
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
    learningStreak: 0,
    avgSentiment: 0,
    sentimentTrend: [] as { date: string; sentiment: number; label: string }[]
  })

  const router = useRouter()

  useEffect(() => {
    getUser()
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterReflections()
    filterJournalEntries()
  }, [filters, reflections, journalEntries]) // eslint-disable-line react-hooks/exhaustive-deps

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

    // Calculate sentiment analysis
    const sentimentData = analyzeSentiment(reflections)

    setSearchStats({
      totalReflections,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      topKeywords: keywords.slice(0, 5),
      learningStreak: streak,
      avgSentiment: sentimentData.avgSentiment,
      sentimentTrend: sentimentData.sentimentTrend
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

  const analyzeSentiment = (reflections: Reflection[]) => {
    // Simple sentiment analysis without external library
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'wonderful', 'brilliant', 'successful', 'confident', 'excited', 'happy', 'love', 'enjoy', 'fun', 'easy', 'clear', 'understand', 'learned', 'progress', 'achievement', 'breakthrough', 'effective', 'efficient', 'productive', 'satisfied', 'accomplished', 'mastered', 'impressed', 'useful', 'valuable', 'helpful', 'insightful', 'engaging', 'motivating', 'inspiring', 'rewarding', 'satisfying', 'beneficial', 'powerful', 'innovative', 'creative', 'solution', 'success', 'victory', 'win', 'positive', 'better', 'improved', 'enhanced', 'optimized', 'perfect', 'ideal', 'smooth', 'seamless', 'intuitive', 'elegant', 'sophisticated', 'advanced', 'cutting-edge', 'state-of-the-art', 'revolutionary', 'groundbreaking', 'game-changing', 'transformative', 'remarkable', 'outstanding', 'exceptional', 'extraordinary', 'incredible', 'phenomenal', 'spectacular', 'magnificent', 'superb', 'superior', 'top-notch', 'first-class', 'world-class', 'premium', 'high-quality', 'flawless', 'impeccable', 'pristine', 'immaculate', 'spotless', 'pristine', 'crystal-clear', 'transparent', 'straightforward', 'user-friendly', 'accessible', 'convenient', 'practical', 'applicable', 'relevant', 'pertinent', 'significant', 'meaningful', 'impactful', 'influential', 'substantial', 'considerable', 'noteworthy', 'remarkable', 'notable', 'memorable', 'unforgettable', 'lasting', 'enduring', 'permanent', 'stable', 'reliable', 'dependable', 'trustworthy', 'credible', 'authentic', 'genuine', 'legitimate', 'valid', 'sound', 'solid', 'robust', 'strong', 'sturdy', 'durable', 'resilient', 'flexible', 'adaptable', 'versatile', 'dynamic', 'agile', 'responsive', 'quick', 'fast', 'rapid', 'swift', 'speedy', 'efficient', 'streamlined', 'optimized', 'refined', 'polished', 'sophisticated', 'mature', 'developed', 'evolved', 'progressed', 'advanced', 'modern', 'contemporary', 'current', 'up-to-date', 'fresh', 'new', 'novel', 'original', 'unique', 'distinctive', 'special', 'rare', 'exclusive', 'premium', 'luxury', 'high-end', 'top-tier', 'elite', 'professional', 'expert', 'skilled', 'talented', 'gifted', 'capable', 'competent', 'qualified', 'experienced', 'knowledgeable', 'informed', 'educated', 'enlightened', 'aware', 'conscious', 'mindful', 'attentive', 'focused', 'concentrated', 'dedicated', 'committed', 'devoted', 'passionate', 'enthusiastic', 'eager', 'keen', 'interested', 'curious', 'fascinated', 'intrigued', 'captivated', 'engaged', 'absorbed', 'immersed', 'involved', 'active', 'participatory', 'interactive', 'collaborative', 'cooperative', 'supportive', 'encouraging', 'motivating', 'inspiring', 'uplifting', 'empowering', 'enabling', 'facilitating', 'assisting', 'helping', 'aiding', 'supporting', 'backing', 'endorsing', 'promoting', 'advocating', 'championing', 'defending', 'protecting', 'safeguarding', 'securing', 'ensuring', 'guaranteeing', 'promising', 'delivering', 'providing', 'offering', 'giving', 'contributing', 'sharing', 'distributing', 'spreading', 'extending', 'expanding', 'growing', 'developing', 'building', 'constructing', 'creating', 'generating', 'producing', 'manufacturing', 'crafting', 'designing', 'planning', 'organizing', 'coordinating', 'managing', 'leading', 'directing', 'guiding', 'mentoring', 'coaching', 'training', 'teaching', 'educating', 'instructing', 'demonstrating', 'showing', 'explaining', 'clarifying', 'illustrating', 'describing', 'detailing', 'outlining', 'summarizing', 'highlighting', 'emphasizing', 'stressing', 'underlining', 'pointing out', 'indicating', 'suggesting', 'recommending', 'proposing', 'advising', 'counseling', 'consulting', 'deliberating', 'discussing', 'debating', 'negotiating', 'mediating', 'resolving', 'solving', 'fixing', 'repairing', 'restoring', 'renovating', 'refreshing', 'revitalizing', 'rejuvenating', 'renewing', 'regenerating', 'reviving', 'resurrecting', 'rekindling', 'reigniting', 'reactivating', 'restarting', 'resuming', 'continuing', 'persisting', 'persevering', 'enduring', 'lasting', 'surviving', 'thriving', 'flourishing', 'blooming', 'blossoming', 'growing', 'expanding', 'spreading', 'multiplying', 'increasing', 'rising', 'climbing', 'ascending', 'elevating', 'lifting', 'raising', 'boosting', 'enhancing', 'improving', 'bettering', 'upgrading', 'advancing', 'progressing', 'developing', 'evolving', 'transforming', 'changing', 'shifting', 'moving', 'transitioning', 'converting', 'adapting', 'adjusting', 'modifying', 'altering', 'updating', 'revising', 'editing', 'refining', 'perfecting', 'optimizing', 'maximizing', 'minimizing', 'reducing', 'decreasing', 'cutting', 'trimming', 'streamlining', 'simplifying', 'clarifying', 'purifying', 'cleansing', 'clearing', 'opening', 'unlocking', 'releasing', 'freeing', 'liberating', 'emancipating', 'empowering', 'enabling', 'permitting', 'allowing', 'authorizing', 'approving', 'endorsing', 'supporting', 'backing', 'promoting', 'encouraging', 'motivating', 'inspiring', 'uplifting', 'elevating', 'raising', 'boosting', 'enhancing', 'improving', 'bettering', 'upgrading', 'advancing', 'progressing', 'developing', 'evolving', 'transforming', 'changing', 'shifting', 'moving', 'transitioning', 'converting', 'adapting', 'adjusting', 'modifying', 'altering', 'updating', 'revising', 'editing', 'refining', 'perfecting', 'optimizing', 'maximizing']
    
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'difficult', 'hard', 'challenging', 'confusing', 'frustrated', 'stuck', 'lost', 'overwhelmed', 'struggling', 'failed', 'error', 'problem', 'issue', 'trouble', 'worry', 'concerned', 'disappointed', 'sad', 'unhappy', 'annoyed', 'irritated', 'angry', 'hate', 'dislike', 'boring', 'tedious', 'slow', 'unclear', 'complicated', 'complex', 'buggy', 'broken', 'wrong', 'incorrect', 'mistake', 'fault', 'flaw', 'defect', 'weakness', 'limitation', 'restriction', 'obstacle', 'barrier', 'hindrance', 'impediment', 'setback', 'delay', 'postponement', 'cancellation', 'rejection', 'denial', 'refusal', 'decline', 'decrease', 'reduction', 'loss', 'damage', 'harm', 'injury', 'hurt', 'pain', 'suffering', 'distress', 'agony', 'torture', 'nightmare', 'disaster', 'catastrophe', 'crisis', 'emergency', 'urgent', 'critical', 'serious', 'severe', 'extreme', 'intense', 'harsh', 'rough', 'tough', 'rigid', 'stiff', 'tight', 'narrow', 'limited', 'restricted', 'confined', 'trapped', 'stuck', 'blocked', 'jammed', 'clogged', 'congested', 'crowded', 'packed', 'full', 'overloaded', 'overwhelmed', 'stressed', 'pressured', 'forced', 'compelled', 'obliged', 'required', 'demanded', 'expected', 'needed', 'necessary', 'essential', 'crucial', 'vital', 'important', 'significant', 'major', 'main', 'primary', 'principal', 'chief', 'leading', 'top', 'highest', 'maximum', 'ultimate', 'final', 'last', 'end', 'finish', 'complete', 'done', 'over', 'finished', 'concluded', 'terminated', 'ended', 'stopped', 'ceased', 'discontinued', 'abandoned', 'given up', 'quit', 'resigned', 'retired', 'withdrawn', 'removed', 'eliminated', 'deleted', 'erased', 'wiped out', 'destroyed', 'demolished', 'ruined', 'wrecked', 'damaged', 'broken', 'shattered', 'cracked', 'split', 'torn', 'ripped', 'cut', 'sliced', 'chopped', 'crushed', 'smashed', 'squashed', 'flattened', 'compressed', 'squeezed', 'pressed', 'pushed', 'pulled', 'dragged', 'forced', 'compelled', 'obliged', 'required', 'demanded', 'expected', 'needed', 'necessary', 'essential', 'crucial', 'vital', 'important', 'significant', 'major', 'main', 'primary', 'principal', 'chief', 'leading', 'top', 'highest', 'maximum', 'ultimate', 'final', 'last', 'end', 'finish', 'complete', 'done', 'over', 'finished', 'concluded', 'terminated', 'ended', 'stopped', 'ceased', 'discontinued', 'abandoned', 'given up', 'quit', 'resigned', 'retired', 'withdrawn', 'removed', 'eliminated', 'deleted', 'erased', 'wiped out', 'destroyed', 'demolished', 'ruined', 'wrecked', 'damaged', 'broken', 'shattered', 'cracked', 'split', 'torn', 'ripped', 'cut', 'sliced', 'chopped', 'crushed', 'smashed', 'squashed', 'flattened', 'compressed', 'squeezed', 'pressed', 'pushed', 'pulled', 'dragged']

    const sentimentTrend = reflections.map(reflection => {
      const text = `${reflection.key_learnings} ${reflection.practical_applications} ${reflection.success_moment}`.toLowerCase()
      const words = text.split(/\s+/)
      
      let positiveCount = 0
      let negativeCount = 0
      
      words.forEach(word => {
        if (positiveWords.includes(word)) positiveCount++
        if (negativeWords.includes(word)) negativeCount++
      })
      
      const sentiment = positiveCount - negativeCount
      let normalizedSentiment = 0
      
      if (sentiment > 0) {
        normalizedSentiment = Math.min(sentiment / 3, 1) // Normalize to 0-1
      } else if (sentiment < 0) {
        normalizedSentiment = Math.max(sentiment / 3, -1) // Normalize to -1-0
      }
      
      let label = 'Neutral'
      if (normalizedSentiment > 0.2) label = 'Positive'
      else if (normalizedSentiment < -0.2) label = 'Negative'
      
      return {
        date: reflection.bootcamp_date,
        sentiment: normalizedSentiment,
        label
      }
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const avgSentiment = sentimentTrend.length > 0 
      ? sentimentTrend.reduce((sum, item) => sum + item.sentiment, 0) / sentimentTrend.length
      : 0

    return {
      avgSentiment: Math.round(avgSentiment * 100) / 100,
      sentimentTrend
    }
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

  const filterJournalEntries = () => {
    let filtered = [...journalEntries]

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.content.toLowerCase().includes(term) ||
        entry.title?.toLowerCase().includes(term) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(term))
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
      
      filtered = filtered.filter(entry => new Date(entry.created_at) >= cutoff)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredJournalEntries(filtered)
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

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.2) return <Smile className="h-5 w-5 text-green-600" />
    if (sentiment < -0.2) return <Frown className="h-5 w-5 text-red-600" />
    return <Meh className="h-5 w-5 text-gray-600" />
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.2) return 'text-green-600'
    if (sentiment < -0.2) return 'text-red-600'
    return 'text-gray-600'
  }

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.2) return 'Positive'
    if (sentiment < -0.2) return 'Negative'
    return 'Neutral'
  }

  const getThemesFromKeywords = (keywords: string[]) => {
    const themes = [
      {
        name: 'Technical Skills',
        color: 'bg-blue-500',
        keywords: keywords.filter(k => 
          ['python', 'javascript', 'react', 'node', 'api', 'database', 'code', 'programming', 'development', 'technical', 'algorithm', 'data', 'machine', 'learning', 'model', 'training'].includes(k.toLowerCase())
        )
      },
      {
        name: 'Problem Solving',
        color: 'bg-green-500',
        keywords: keywords.filter(k => 
          ['problem', 'solution', 'solve', 'debug', 'fix', 'issue', 'challenge', 'approach', 'strategy', 'method', 'process', 'analysis', 'thinking', 'logic'].includes(k.toLowerCase())
        )
      },
      {
        name: 'Learning & Growth',
        color: 'bg-purple-500',
        keywords: keywords.filter(k => 
          ['learn', 'understand', 'knowledge', 'skill', 'improvement', 'progress', 'growth', 'development', 'study', 'practice', 'experience', 'insight', 'discovery', 'breakthrough'].includes(k.toLowerCase())
        )
      }
    ].filter(theme => theme.keywords.length > 0)
    
    return themes
  }

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'great': return <Smile className="h-5 w-5 text-green-600" />
      case 'good': return <Smile className="h-5 w-5 text-blue-600" />
      case 'okay': return <Meh className="h-5 w-5 text-yellow-600" />
      case 'down': return <Frown className="h-5 w-5 text-red-600" />
      default: return null
    }
  }

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'great': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'okay': return 'text-yellow-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return
    
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
    
    if (error) {
      console.error('Error deleting entry:', error)
    } else {
      setJournalEntries(prev => prev.filter(entry => entry.id !== entryId))
    }
  }


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

    // Fetch user's journal entries
    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (entriesError) {
      console.error('Error fetching journal entries:', entriesError)
    } else {
      setJournalEntries(entries || [])
      setFilteredJournalEntries(entries || [])
    }
    
    setLoading(false)
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
                onClick={() => router.push('/new-journal-entry')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Journal Entry</span>
              </button>
              <button
                onClick={() => router.push('/new-reflection')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Reflection
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
          

          {/* Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('entries')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'entries'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Journal Entries ({journalEntries.length})
              </button>
              <button
                onClick={() => setActiveTab('reflections')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reflections'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bootcamp Reflections ({reflections.length})
              </button>
            </nav>
          </div>

          {/* Stats Overview - Only show for reflections */}
          {activeTab === 'reflections' && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
                {getSentimentIcon(searchStats.avgSentiment)}
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Avg Sentiment</p>
                  <p className={`text-2xl font-bold ${getSentimentColor(searchStats.avgSentiment)}`}>
                    {getSentimentLabel(searchStats.avgSentiment)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Tag className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Top Keywords</p>
                  <p className="text-sm font-medium">{searchStats.topKeywords.slice(0, 2).join(', ')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Trend Chart */}
          {searchStats.sentimentTrend.length > 0 && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Trend Over Time</h3>
                <div className="h-64">
                  <Line
                    data={{
                      labels: searchStats.sentimentTrend.map(item => 
                        new Date(item.date).toLocaleDateString()
                      ),
                      datasets: [
                        {
                          label: 'Sentiment',
                          data: searchStats.sentimentTrend.map(item => item.sentiment),
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

          {/* Keyword Analysis */}
          {searchStats.topKeywords.length > 0 && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Keywords & Themes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Keywords */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Most Frequent Keywords</h4>
                    <div className="space-y-2">
                      {searchStats.topKeywords.slice(0, 10).map((keyword, index) => (
                        <div key={keyword} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">{keyword}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(20, (10 - index) * 10)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{10 - index}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Keyword Cloud */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Keyword Cloud</h4>
                    <div className="flex flex-wrap gap-2">
                      {searchStats.topKeywords.slice(0, 20).map((keyword, index) => (
                        <span
                          key={keyword}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                            index < 5 
                              ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                              : index < 10 
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                          onClick={() => handleFilterChange('searchTerm', keyword)}
                          style={{ 
                            fontSize: `${Math.max(0.7, 1 - index * 0.03)}rem`,
                            fontWeight: index < 5 ? 'bold' : 'medium'
                          }}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Learning Themes */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-md font-medium text-gray-800 mb-3">Learning Themes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getThemesFromKeywords(searchStats.topKeywords).map((theme) => (
                      <div key={theme.name} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${theme.color}`} />
                          <span className="font-medium text-gray-800">{theme.name}</span>
                        </div>
                        <div className="space-y-1">
                          {theme.keywords.map(keyword => (
                            <span 
                              key={keyword}
                              className="inline-block bg-white px-2 py-1 rounded text-xs text-gray-600 mr-1 mb-1 cursor-pointer hover:bg-gray-100"
                              onClick={() => handleFilterChange('searchTerm', keyword)}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
          )}

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
                  {activeTab === 'entries' 
                    ? `${filteredJournalEntries.length} Journal Entr${filteredJournalEntries.length !== 1 ? 'ies' : 'y'}`
                    : `${filteredReflections.length} Reflection${filteredReflections.length !== 1 ? 's' : ''}`
                  }
                </h2>
                {filters.searchTerm && (
                  <span className="text-sm text-gray-500">
                    Results for &quot;{filters.searchTerm}&quot;
                  </span>
                )}
              </div>
              
              {activeTab === 'entries' ? (
                // Journal Entries
                filteredJournalEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No journal entries found</h3>
                    <p className="text-gray-600">
                      {filters.searchTerm ? 'Try adjusting your search terms' : 'Start writing your thoughts and experiences'}
                    </p>
                    <button
                      onClick={() => router.push('/new-journal-entry')}
                      className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Write Your First Entry</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredJournalEntries.map((entry) => (
                      <div 
                        key={entry.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm text-gray-600">
                                {new Date(entry.created_at).toLocaleDateString()}
                              </span>
                              {entry.mood && (
                                <div className="flex items-center space-x-1">
                                  {getMoodIcon(entry.mood)}
                                  <span className={`text-xs font-medium capitalize ${getMoodColor(entry.mood)}`}>
                                    {entry.mood}
                                  </span>
                                </div>
                              )}
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {entry.tags.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {entry.title && (
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {entry.title}
                              </h3>
                            )}
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {entry.content.length > 200 
                                ? `${entry.content.substring(0, 200)}...` 
                                : entry.content
                              }
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => router.push(`/new-journal-entry?edit=${entry.id}`)}
                              className="text-indigo-600 hover:text-indigo-800 p-1"
                              title="Edit entry"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Reflections
                filteredReflections.length === 0 ? (
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
                )
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