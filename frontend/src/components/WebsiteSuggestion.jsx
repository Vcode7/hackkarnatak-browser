import { useState } from 'react'
import { Globe, Send, Loader2, ChevronLeft, ChevronRight, ExternalLink, X, ArrowRight, ArrowLeft } from 'lucide-react'
import { isCapacitor, isElectron } from '../utils/platform'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function WebsiteSuggestion() {
  const [isOpen, setIsOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedWebsites, setSuggestedWebsites] = useState([])
  const [currentWebsiteIndex, setCurrentWebsiteIndex] = useState(0)
  
  // Two-step flow state
  const [step, setStep] = useState(1) // 1: topic input, 2: questions, 3: results
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const handleGenerateQuestions = async () => {
    if (!topic.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/ai/generate-questions`, {
        topic: topic.trim()
      })

      if (response.data.success && response.data.questions) {
        setQuestions(response.data.questions)
        setAnswers(new Array(response.data.questions.length).fill(''))
        setCurrentQuestionIndex(0)
        setStep(2)
      } else {
        alert('Failed to generate questions. Please try again.')
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      alert('Failed to generate questions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetSuggestions = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/ai/suggest-websites-ai`, {
        topic: topic.trim(),
        questions: questions,
        answers: answers
      })

      if (response.data.suggested_websites && response.data.suggested_websites.length > 0) {
        setSuggestedWebsites(response.data.suggested_websites)
        setCurrentWebsiteIndex(0)
        setStep(3)
      } else {
        setSuggestedWebsites([])
        alert('No websites found for this topic. Try a different search term.')
      }
    } catch (error) {
      console.error('Error fetching website suggestions:', error)
      alert('Failed to get website suggestions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (step === 1) {
        handleGenerateQuestions()
      }
    }
  }

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // All questions answered, get suggestions
      handleGetSuggestions()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const canProceed = answers[currentQuestionIndex]?.trim().length > 0

  const navigateToWebsite = (url) => {
    window.dispatchEvent(new CustomEvent('navigate-to-url', { detail: { url } }))
  }

  const handlePreviousWebsite = () => {
    if (currentWebsiteIndex > 0) {
      setCurrentWebsiteIndex(currentWebsiteIndex - 1)
    }
  }

  const handleNextWebsite = () => {
    if (currentWebsiteIndex < suggestedWebsites.length - 1) {
      setCurrentWebsiteIndex(currentWebsiteIndex + 1)
    }
  }

  const handleClear = () => {
    setSuggestedWebsites([])
    setCurrentWebsiteIndex(0)
    setTopic('')
    setStep(1)
    setQuestions([])
    setAnswers([])
    setCurrentQuestionIndex(0)
  }

  const handleBackToTopic = () => {
    setStep(1)
    setQuestions([])
    setAnswers([])
    setCurrentQuestionIndex(0)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed p-4 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform z-100 ${
          isElectron() ? 'bottom-36 right-4' : 'bottom-36 right-4'
        }`}
        title="Website Suggestions"
      >
        <Globe size={24} />
      </button>
    )
  }

  const currentWebsite = suggestedWebsites[currentWebsiteIndex]

  return (
    <div
      className={`fixed bg-background border border-border rounded-lg shadow-2xl flex flex-col z-50 ${
        !isElectron() ? 'bottom-36 right-2 left-2' : 'bottom-24 right-6'
      }`}
      style={{
        width: !isElectron() ? 'calc(100vw - 2rem)' : '400px',
        maxHeight: !isElectron() ? '400px' : '500px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Globe size={20} />
          <h3 className="font-semibold">Website Suggestions</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Topic Input */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Enter a topic to get personalized website suggestions:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Machine Learning, Cooking, Travel..."
                  className="flex-1 px-3 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleGenerateQuestions}
                  disabled={isLoading || !topic.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Continue"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                We'll ask you a few questions to personalize your suggestions
              </p>
            </div>

            {/* Empty State */}
            <div className="mt-8 text-center text-muted-foreground">
              <Globe size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Enter a topic to get AI-powered website recommendations</p>
            </div>
          </div>
        )}

        {/* Step 2: Questions */}
        {step === 2 && questions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToTopic}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <ArrowLeft size={16} />
                Change Topic
              </button>
              <span className="text-sm font-semibold text-blue-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-muted-foreground mb-2">Topic: {topic}</p>
              <h4 className="text-lg font-semibold text-foreground mb-4">
                {questions[currentQuestionIndex]}
              </h4>
              <textarea
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-3 py-2 bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex-1 flex items-center justify-center gap-2 p-2 bg-secondary hover:bg-muted rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={!canProceed || isLoading}
                className="flex-1 flex items-center justify-center gap-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : currentQuestionIndex === questions.length - 1 ? (
                  <>Get Suggestions</>
                ) : (
                  <>Next</>
                )}
                {!isLoading && <ChevronRight size={18} />}
              </button>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mt-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentQuestionIndex
                      ? 'w-8 bg-blue-600'
                      : answers[index]?.trim()
                      ? 'w-2 bg-green-500'
                      : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Website Results */}
        {step === 3 && suggestedWebsites.length > 0 && currentWebsite && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-600">
                  Website {currentWebsiteIndex + 1} of {suggestedWebsites.length}
                </span>
                <button
                  onClick={handleClear}
                  className="text-xs px-2 py-1 bg-secondary hover:bg-muted rounded"
                  title="Clear Results"
                >
                  Clear
                </button>
              </div>

              {/* Current Website Card */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-1">
                      {currentWebsite.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {currentWebsite.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Globe size={14} />
                    <span className="truncate">{currentWebsite.url}</span>
                  </div>

                  <button
                    onClick={() => navigateToWebsite(currentWebsite.url)}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink size={16} />
                    Visit Website
                  </button>
                </div>
              </div>

              {/* Navigation Buttons */}
              {suggestedWebsites.length > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousWebsite}
                    disabled={currentWebsiteIndex === 0}
                    className="flex-1 flex items-center justify-center gap-2 p-2 bg-secondary hover:bg-muted rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Website"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>
                  <button
                    onClick={handleNextWebsite}
                    disabled={currentWebsiteIndex === suggestedWebsites.length - 1}
                    className="flex-1 flex items-center justify-center gap-2 p-2 bg-secondary hover:bg-muted rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Website"
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
        )}
      </div>
    </div>
  )
}
