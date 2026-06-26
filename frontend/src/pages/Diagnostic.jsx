import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, XCircle, ArrowRight, Award, TrendingUp } from 'lucide-react'
import { registerActivity } from '../utils/activityHelper'
import { addXP } from '../utils/levelHelper'
import { getGeneralRecommendations } from '../utils/recommendationsHelper'
import { checkAchievements } from '../utils/achievementsHelper'
import {
  getPendingQuestions,
  selectPendingForSession,
  markQuestionMastered,
  recordTopicAttempt,
  getDiagnosticProgress,
  TOTAL_DIAGNOSTIC_ITEMS,
  getCumulativeTopicAnalysis,
  sanitizeTopicList,
  fetchUserProgress,
} from '../utils/progressHelper'
import { diagnosticAPI } from '../services/api'
import {
  shuffleArray,
  calculateRiskLevel,
  generateUniqueId,
} from '../utils/quizHelper'

function Diagnostic() {
  const navigate = useNavigate()
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))
  const userId = currentUser?.id

  useEffect(() => {
    console.log('[NAVIGATION] Enter Diagnostic', { pathname: window.location.pathname, timestamp: new Date().toISOString(), userId })
    return () => {
      console.log('[NAVIGATION] Exit Diagnostic', { pathname: window.location.pathname, timestamp: new Date().toISOString() })
    }
  }, [])

  const initialProgress = getDiagnosticProgress(userId)
  const [refreshKey, setRefreshKey] = useState(0)

  const sessionQuestions = useMemo(
    () => selectPendingForSession(getPendingQuestions(userId)),
    [userId, refreshKey]
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [shuffledOptions, setShuffledOptions] = useState(() =>
    sessionQuestions.length > 0 ? shuffleArray(sessionQuestions[0].options) : []
  )
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const [sessionAnswers, setSessionAnswers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [masteredCount, setMasteredCount] = useState(initialProgress.mastered)
  const [sessionComplete, setSessionComplete] = useState(false)

  const currentQuestion = sessionQuestions[currentIndex]

  // Actualizar shuffledOptions cuando cambia la pregunta actual
  useEffect(() => {
    if (currentQuestion?.options) {
      setShuffledOptions(shuffleArray(currentQuestion.options))
    }
  }, [currentQuestion])
  const totalSession = sessionQuestions.length
  const cumulativeProgress = (masteredCount / TOTAL_DIAGNOSTIC_ITEMS) * 100
  const allDiagnosticsComplete = masteredCount >= TOTAL_DIAGNOSTIC_ITEMS

  const handleSelectAnswer = useCallback(
    (option) => {
      if (isLocked || !currentQuestion || !userId) return

      const masteredBefore = getMasteredQuestions(userId).length
      setSelectedAnswer(option)
      setIsLocked(true)

      const isCorrect = option === currentQuestion.correctAnswer
      recordTopicAttempt(userId, currentQuestion.topic, isCorrect)

      console.log('[DIAGNOSTIC] Question answered', {
        questionId: currentQuestion.id,
        correct: isCorrect,
        masteredBefore,
        masteredAfter: isCorrect ? masteredBefore + 1 : masteredBefore
      })

      if (isCorrect) {
        const isNewMaster = markQuestionMastered(userId, currentQuestion.id)
        if (isNewMaster) {
          setMasteredCount((prev) => prev + 1)
          addXP('question', `question_${currentQuestion.id}`)
        }
      }

      setSessionAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          topic: currentQuestion.topic,
          correct: isCorrect,
          selectedAnswer: option,
        },
      ])
    },
    [isLocked, currentQuestion, userId]
  )

  const handleNext = () => {
    if (!isLocked) return

    if (currentIndex < totalSession - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setShuffledOptions(shuffleArray(sessionQuestions[nextIndex].options))
      setSelectedAnswer(null)
      setIsLocked(false)
    } else {
      finishSession()
    }
  }

  const finishSession = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const correctCount = sessionAnswers.filter((a) => a.correct).length
    const riskLevel = calculateRiskLevel(correctCount, totalSession)
    const { strengths, weaknesses } = getCumulativeTopicAnalysis(userId)
    const generalRecommendations = getGeneralRecommendations(riskLevel)

    const sanitizedStrengths = sanitizeTopicList(strengths)
    const sanitizedWeaknesses = sanitizeTopicList(weaknesses)

    const personalizedRecommendations = sessionAnswers
      .filter((a) => !a.correct)
      .map((a) => {
        const q = sessionQuestions.find((sq) => sq.id === a.questionId)
        return {
          questionId: a.questionId,
          topic: q?.topic || 'General',
          icon: '⚠️',
          answer: a.selectedAnswer,
          recommendations: q ? [q.recommendation.howToAct, q.recommendation.risk] : [],
        }
      })

    const result = {
      id: generateUniqueId(),
      score: correctCount,
      total: totalSession,
      masteredTotal: masteredCount,
      masteredGoal: TOTAL_DIAGNOSTIC_ITEMS,
      level: riskLevel,
      riskLevel,
      date: new Date().toISOString().split('T')[0],
      personalizedRecommendations,
      generalRecommendations,
      strengths: sanitizedStrengths,
      weaknesses: sanitizedWeaknesses,
      userId,
    }

    // Guardar en la base de datos
    if (userId) {
      try {
        await diagnosticAPI.create({
          score: correctCount,
          total: totalSession,
          masteredTotal: masteredCount,
          masteredGoal: TOTAL_DIAGNOSTIC_ITEMS,
          riskLevel,
          strengths: sanitizedStrengths,
          weaknesses: sanitizedWeaknesses,
          personalizedRecommendations,
          generalRecommendations,
        })

        // Actualizar el cache local
        console.log('[DIAGNOSTIC] Session completed', {
          score: correctCount,
          total: totalSession,
          percentage: Math.round((correctCount / totalSession) * 100),
          fetchUserProgressExecuted: true
        })
        const progressResponse = await fetchUserProgress()
        console.log('[DIAGNOSTIC] fetchUserProgress response:', progressResponse)
      } catch (error) {
        console.error('Error saving diagnostic to database:', error)
        throw error
      }
    }

    await registerActivity(
      'diagnostic',
      'Sesión de diagnóstico',
      `Progreso: ${masteredCount}/${TOTAL_DIAGNOSTIC_ITEMS} aprobados`
    )

    await checkAchievements({
      type: 'diagnostic',
      score: correctCount,
      total: totalSession,
      masteredTotal: masteredCount,
    })

    setSessionComplete(true)
  }

  const handleContinuePractice = () => {
    // Forzar recálculo de preguntas pendientes
    setRefreshKey((prev) => prev + 1)
    
    // Reiniciar el estado local para cargar nuevas preguntas pendientes
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsLocked(false)
    setSessionAnswers([])
    setSessionComplete(false)
    setIsSubmitting(false)
    
    // Recargar progreso actualizado
    const updatedProgress = getDiagnosticProgress(userId)
    setMasteredCount(updatedProgress.mastered)
  }

  const handleViewResults = () => navigate('/results')

  if (initialProgress.complete || allDiagnosticsComplete) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Diagnóstico Completado!</h1>
          <p className="text-gray-600 mb-6">
            Has aprobado las {TOTAL_DIAGNOSTIC_ITEMS} preguntas del programa.
          </p>
          <p className="text-2xl font-bold text-blue-600 mb-8">
            {TOTAL_DIAGNOSTIC_ITEMS}/{TOTAL_DIAGNOSTIC_ITEMS} — 100%
          </p>
          <button
            onClick={() => navigate('/student')}
            className="py-4 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  if (sessionQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <div className="text-center p-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay preguntas pendientes.</p>
        </div>
      </div>
    )
  }

  if (sessionComplete) {
    const pending = TOTAL_DIAGNOSTIC_ITEMS - masteredCount
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sesión completada</h2>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {masteredCount}/{TOTAL_DIAGNOSTIC_ITEMS}
            </p>
            <p className="text-gray-600 mb-6">
              {pending > 0
                ? `Te quedan ${pending} preguntas por aprobar.`
                : '¡Has completado todas las preguntas!'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {pending > 0 && (
                <button
                  onClick={handleContinuePractice}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  Continuar práctica ({pending} pendientes)
                </button>
              )}
              <button
                onClick={handleViewResults}
                className="flex-1 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diagnóstico de Ciberseguridad</h1>
          <p className="text-gray-600">Practica las preguntas pendientes hasta dominarlas todas</p>
        </motion.div>

        <motion.div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progreso total del programa</span>
            <span className="text-sm font-bold text-blue-600">
              {masteredCount}/{TOTAL_DIAGNOSTIC_ITEMS} ({Math.round(cumulativeProgress)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full"
              animate={{ width: `${cumulativeProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Sesión actual: pregunta {currentIndex + 1} de {totalSession}
          </p>
        </motion.div>

        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <p className="text-lg font-semibold text-gray-900 mb-6">
            {currentQuestion.question}
          </p>

          <div className="space-y-3 mb-6">
            {shuffledOptions.map((option) => {
              const isSelected = selectedAnswer === option
              const isCorrectOption = option === currentQuestion.correctAnswer
              let optionClass = 'border-gray-200 hover:border-gray-300'

              if (isLocked) {
                if (isCorrectOption) optionClass = 'border-green-500 bg-green-50'
                else if (isSelected && !isCorrect) optionClass = 'border-red-500 bg-red-50'
                else optionClass = 'border-gray-200 opacity-60'
              } else if (isSelected) {
                optionClass = 'border-blue-500 bg-blue-50'
              }

              return (
                <button
                  key={`${currentQuestion.id}-${option}`}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleSelectAnswer(option)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${optionClass} ${
                    isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <span className="font-medium text-gray-900">{option}</span>
                </button>
              )
            })}
          </div>

          {isLocked && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div
                className={`p-4 rounded-xl flex items-start space-x-3 ${
                  isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                    {isCorrect ? '¡Correcto! Pregunta aprobada.' : 'Incorrecto'}
                  </p>
                  {!isCorrect && (
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-red-900">¿Por qué fue incorrecta?</p>
                        <p className="text-red-800">{currentQuestion.recommendation.whyIncorrect}</p>
                      </div>
                      <div>
                        <p className="font-medium text-red-900">¿Qué riesgo existía?</p>
                        <p className="text-red-800">{currentQuestion.recommendation.risk}</p>
                      </div>
                      <div>
                        <p className="font-medium text-red-900">¿Cómo actuar correctamente?</p>
                        <p className="text-red-800">{currentQuestion.recommendation.howToAct}</p>
                      </div>
                      <p className="text-red-700 font-medium">
                        Respuesta correcta: {currentQuestion.correctAnswer}
                      </p>
                    </div>
                  )}
                  {isCorrect && (
                    <p className="text-sm text-green-800">{currentQuestion.recommendation.howToAct}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{currentIndex < totalSession - 1 ? 'Siguiente' : 'Finalizar sesión'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Diagnostic
