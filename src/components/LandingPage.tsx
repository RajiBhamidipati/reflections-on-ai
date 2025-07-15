'use client'

import { useState } from 'react'
import { Brain, TrendingUp, Target, Users, Lightbulb, BarChart3, Award, Clock, BookOpen, Zap } from 'lucide-react'
import AuthForm from './auth/AuthForm'

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)

  const benefits = [
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "Accelerate Learning",
      description: "Transform your AI bootcamp experience into structured, actionable insights that stick."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-600" />,
      title: "Track Progress",
      description: "Visualize your confidence growth and see how you're applying AI in real work scenarios."
    },
    {
      icon: <Target className="w-8 h-8 text-purple-600" />,
      title: "Identify Patterns",
      description: "Discover what learning methods work best for you and where to focus next."
    },
    {
      icon: <Users className="w-8 h-8 text-orange-600" />,
      title: "Share Success",
      description: "Help your team and organization understand the impact of AI training."
    }
  ]

  const stats = [
    { number: "87%", label: "Faster skill adoption" },
    { number: "3x", label: "Better retention" },
    { number: "92%", label: "Higher confidence" },
    { number: "15min", label: "Daily time investment" }
  ]

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto pt-20">
          <AuthForm />
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAuth(false)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← Back to overview
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="ml-3 text-xl font-bold text-gray-900">
                AI Bootcamp Reflections
              </span>
            </div>
            <button
              onClick={() => setShowAuth(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In / Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> AI Learning</span>
              <br />Into Lasting Impact
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Document your AI bootcamp journey with structured reflections that accelerate learning, 
              boost confidence, and create measurable business impact.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowAuth(true)}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The Power of Structured Reflection
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Research shows that reflective learning significantly improves skill acquisition and retention
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Reflection Matters in AI Learning
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Move beyond passive learning to active skill development with structured reflection
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple 3-Step Process
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Turn your AI learning into actionable insights in just minutes
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Reflect</h3>
              <p className="text-gray-600">
                After each AI session, quickly capture key learnings and practical applications
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Visualize</h3>
              <p className="text-gray-600">
                See your confidence grow and identify patterns in your learning journey
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Apply</h3>
              <p className="text-gray-600">
                Use insights to accelerate your learning and demonstrate ROI to your organization
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Features That Drive Results
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Everything you need to maximize your AI learning investment
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-xl">
              <Award className="w-10 h-10 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Progress Tracking</h3>
              <p className="text-gray-300">Monitor confidence levels and skill development over time</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl">
              <Clock className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Learning Streaks</h3>
              <p className="text-gray-300">Build consistent reflection habits with streak tracking</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl">
              <Lightbulb className="w-10 h-10 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Smart Insights</h3>
              <p className="text-gray-300">Get personalized recommendations based on your learning patterns</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your AI Learning?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who are accelerating their AI skills through structured reflection
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Brain className="h-6 w-6 text-blue-400" />
            <span className="ml-2 text-lg font-semibold">AI Bootcamp Reflections</span>
          </div>
          <div className="mt-4 text-center text-gray-400">
            <p>Accelerating AI learning through structured reflection</p>
          </div>
        </div>
      </footer>
    </div>
  )
}