'use client'

import { useState } from 'react'
import { Brain, Heart, TrendingUp, Lightbulb, Users, Zap, Mail, Lock } from 'lucide-react'

export default function Home() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Brain className="h-6 w-6 text-blue-600" />
              <span className="ml-3 text-xl font-light text-gray-900">
                Reflections on using AI
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8 fade-in">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3">
                <Brain className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-light text-gray-900">
                  Reflections on using AI
                </h1>
              </div>
              <h2 className="text-4xl font-light leading-tight text-gray-900">
                Document your AI learning journey
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Capture insights, track progress, and reflect on your experiences with AI tools, 
                technologies, and methodologies. Build a comprehensive learning portfolio.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 stagger-children">
              <div className="flex items-center gap-3 p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">AI Reflections</h3>
                  <p className="text-sm text-gray-500">Document AI learning experiences</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Progress Tracking</h3>
                  <p className="text-sm text-gray-500">Visualize your growth over time</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">AI Insights</h3>
                  <p className="text-sm text-gray-500">Smart recommendations & patterns</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Community</h3>
                  <p className="text-sm text-gray-500">Connect with AI learners</p>
                </div>
              </div>
            </div>

            {/* Additional Features */}
            <div className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Real-time sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>Mood tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <div className="scale-in">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {authMode === 'signin' ? 'Welcome back' : 'Join the community'}
                </h3>
                <p className="text-gray-600 mt-2">
                  {authMode === 'signin' 
                    ? 'Continue your AI reflection journey' 
                    : 'Start documenting your AI learning'
                  }
                </p>
              </div>
              
              <form className="space-y-6">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Enter your full name" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="password" 
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {authMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    {authMode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}