import { useState, useEffect } from 'react'
import axios from 'axios'
import { Brain, Trophy, Clock, X, ChevronRight, CheckCircle, XCircle, Award, TrendingUp } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function HistoryQuiz({ isOpen, onClose }) {
  const [quizState, setQuizState] = useState('menu') // menu, loading, quiz, results, scores
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [userAnswers, setUserAnswers] = useState([])
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [recentScores, setRecentScores] = useState([])
  const [stats, setStats] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    if (isOpen && quizState === 'menu') {
      loadRecentScores()
      loadStats()
    }
  }, [isOpen, quizState])

  const loadRecentScores = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/quiz/scores?limit=5`)
      setRecentScores(response.data.scores || [])
    } catch (error) {
      console.error('Error loading scores:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/quiz/stats`)
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const startQuiz = async () => {
    setLoading(true)
    setQuizState('loading')
    
    try {
      const response = await axios.post(`${API_URL}/api/quiz/generate`, {
        num_questions: 10
      })
      
      setQuestions(response.data.questions)
      setCurrentQuestion(0)
      setSelectedAnswer(null)
      setUserAnswers([])
      setScore(0)
      setStartTime(Date.now())
      setQuizState('quiz')
    } catch (error) {
      console.error('Error generating quiz:', error)
      alert(error.response?.data?.detail || 'Failed to generate quiz. Make sure you have enough browsing history!')
      setQuizState('menu')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return // Already answered
    setSelectedAnswer(answerIndex)
    setShowExplanation(true)
    
    const isCorrect = answerIndex === questions[currentQuestion].correct_answer
    if (isCorrect) {
      setScore(score + 1)
    }
    
    setUserAnswers([...userAnswers, {
      question: questions[currentQuestion].question,
      selected: answerIndex,
      correct: questions[currentQuestion].correct_answer,
      is_correct: isCorrect,
      explanation: questions[currentQuestion].explanation
    }])
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = async () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    
    try {
      await axios.post(`${API_URL}/api/quiz/save-score`, {
        score: score,
        total_questions: questions.length,
        questions: userAnswers,
        time_taken_seconds: timeTaken
      })
      
      setQuizState('results')
      loadRecentScores()
      loadStats()
    } catch (error) {
      console.error('Error saving score:', error)
      setQuizState('results')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const resetQuiz = () => {
    setQuizState('menu')
    setQuestions([])
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setUserAnswers([])
    setScore(0)
    setShowExplanation(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Brain size={24} className="text-primary" />
            <h2 className="text-xl font-bold">History Quiz</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Menu State */}
          {quizState === 'menu' && (
            <div className="space-y-6">
              {/* Stats */}
              {stats && stats.total_quizzes > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-secondary rounded-lg text-center">
                    <Trophy className="mx-auto mb-2 text-yellow-500" size={24} />
                    <div className="text-2xl font-bold">{stats.total_quizzes}</div>
                    <div className="text-sm text-muted-foreground">Quizzes Taken</div>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg text-center">
                    <TrendingUp className="mx-auto mb-2 text-green-500" size={24} />
                    <div className="text-2xl font-bold">{stats.average_score}%</div>
                    <div className="text-sm text-muted-foreground">Average Score</div>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg text-center">
                    <Award className="mx-auto mb-2 text-blue-500" size={24} />
                    <div className="text-2xl font-bold">{stats.best_score}%</div>
                    <div className="text-sm text-muted-foreground">Best Score</div>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg text-center">
                    <Brain className="mx-auto mb-2 text-purple-500" size={24} />
                    <div className="text-2xl font-bold">{stats.total_questions_answered}</div>
                    <div className="text-sm text-muted-foreground">Questions Answered</div>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <div className="text-center py-8">
                <Brain size={64} className="mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-2">Test Your Knowledge!</h3>
                <p className="text-muted-foreground mb-6">
                  Take a 10-question quiz based on your browsing history
                </p>
                <button
                  onClick={startQuiz}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-semibold text-lg"
                >
                  Start Quiz
                </button>
              </div>

              {/* Recent Scores */}
              {recentScores.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Scores</h3>
                  <div className="space-y-2">
                    {recentScores.map((scoreItem, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Trophy size={20} className={
                            scoreItem.percentage >= 80 ? 'text-yellow-500' :
                            scoreItem.percentage >= 60 ? 'text-blue-500' :
                            'text-gray-500'
                          } />
                          <div>
                            <div className="font-semibold">
                              {scoreItem.score}/{scoreItem.total_questions} ({scoreItem.percentage.toFixed(1)}%)
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(scoreItem.completed_at)}
                            </div>
                          </div>
                        </div>
                        {scoreItem.time_taken_seconds && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock size={16} />
                            {formatTime(scoreItem.time_taken_seconds)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {quizState === 'loading' && (
            <div className="text-center py-12">
              <Brain size={64} className="mx-auto mb-4 text-primary animate-pulse" />
              <h3 className="text-xl font-semibold mb-2">Generating Your Quiz...</h3>
              <p className="text-muted-foreground">
                AI is analyzing your browsing history to create personalized questions
              </p>
            </div>
          )}

          {/* Quiz State */}
          {quizState === 'quiz' && questions.length > 0 && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>Score: {score}/{currentQuestion + (selectedAnswer !== null ? 1 : 0)}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <div className="p-6 bg-secondary rounded-lg">
                <h3 className="text-xl font-semibold mb-4">
                  {questions[currentQuestion].question}
                </h3>

                {/* Options */}
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option, index) => {
                    const isSelected = selectedAnswer === index
                    const isCorrect = index === questions[currentQuestion].correct_answer
                    const showResult = selectedAnswer !== null
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={selectedAnswer !== null}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          showResult
                            ? isCorrect
                              ? 'border-green-500 bg-green-500/10'
                              : isSelected
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-border bg-background'
                            : isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background hover:border-primary/50'
                        } ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {showResult && isCorrect && <CheckCircle size={20} className="text-green-500" />}
                          {showResult && isSelected && !isCorrect && <XCircle size={20} className="text-red-500" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Explanation */}
                {showExplanation && (
                  <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                    <div className="font-semibold mb-2">Explanation:</div>
                    <p className="text-sm text-muted-foreground">{questions[currentQuestion].explanation}</p>
                  </div>
                )}
              </div>

              {/* Next Button */}
              {selectedAnswer !== null && (
                <button
                  onClick={nextQuestion}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-semibold flex items-center justify-center gap-2"
                >
                  {currentQuestion < questions.length - 1 ? (
                    <>Next Question <ChevronRight size={20} /></>
                  ) : (
                    <>Finish Quiz <Trophy size={20} /></>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Results State */}
          {quizState === 'results' && (
            <div className="text-center space-y-6">
              <Trophy size={80} className={`mx-auto ${
                (score / questions.length) >= 0.8 ? 'text-yellow-500' :
                (score / questions.length) >= 0.6 ? 'text-blue-500' :
                'text-gray-500'
              }`} />
              
              <div>
                <h3 className="text-3xl font-bold mb-2">Quiz Complete!</h3>
                <p className="text-xl text-muted-foreground">
                  You scored {score} out of {questions.length}
                </p>
                <p className="text-3xl font-bold text-primary mt-2">
                  {((score / questions.length) * 100).toFixed(1)}%
                </p>
              </div>

              {startTime && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock size={20} />
                  <span>Time: {formatTime(Math.floor((Date.now() - startTime) / 1000))}</span>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={startQuiz}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-semibold"
                >
                  Try Again
                </button>
                <button
                  onClick={resetQuiz}
                  className="px-6 py-3 bg-secondary rounded-lg hover:bg-muted font-semibold"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
