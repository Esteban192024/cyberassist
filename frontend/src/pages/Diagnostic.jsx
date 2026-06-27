import { useState, useMemo, useEffect } from 'react'
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
  getMasteredQuestions,
  getTopicLearningStats,
  TOTAL_DIAGNOSTIC_ITEMS,
  getCumulativeTopicAnalysis,
  sanitizeTopicList,
  fetchUserProgress,
} from '../utils/progressHelper'
import { diagnosticAPI } from '../services/api'
import {
  shuffleArray,
  calculateRiskLevel,
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
  }, [userId])

  const initialProgress = getDiagnosticProgress()
  const [masteredCount, setMasteredCount] = useState(initialProgress.mastered)
  const [sessionQuestions, setSessionQuestions] = useState(() => {
    return selectPendingForSession(getPendingQuestions())
  })

  useEffect(() => {
    if (!userId) return
    let isMounted = true

    const loadProgress = async () => {
      await fetchUserProgress()
      if (!isMounted) return
      setMasteredCount(getDiagnosticProgress().mastered)
    }

    loadProgress()
    return () => {
      isMounted = false
    }
  }, [userId])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const [sessionAnswers, setSessionAnswers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)

  const currentQuestion = sessionQuestions[currentIndex]
  const shuffledOptions = useMemo(
    () => (currentQuestion?.options ? shuffleArray(currentQuestion.options) : []),
    [currentQuestion]
  )
  const totalSession = sessionQuestions.length
  const cumulativeProgress = (masteredCount / TOTAL_DIAGNOSTIC_ITEMS) * 100
  const allDiagnosticsComplete = masteredCount >= TOTAL_DIAGNOSTIC_ITEMS

  const handleSelectAnswer = (option) => {
    console.log('[DIAGNOSTIC ANSWER] 1. handleSelectAnswer called with option:', option)
    if (isLocked || !currentQuestion || !userId) {
      console.log('[DIAGNOSTIC ANSWER] 2. Retornando porque:', { isLocked, hasCurrentQuestion: !!currentQuestion, hasUserId: !!userId })
      return
    }

    const masteredBefore = getMasteredQuestions().length
    console.log('[DIAGNOSTIC ANSWER] 3. masteredBefore:', masteredBefore)
    setSelectedAnswer(option)
    setIsLocked(true)

    const isCorrect = option === currentQuestion.correctAnswer
    console.log('[DIAGNOSTIC ANSWER] 4. currentQuestion:', currentQuestion)
    console.log('[DIAGNOSTIC ANSWER] 5. isCorrect:', isCorrect, '(correctAnswer:', currentQuestion.correctAnswer, 'selectedAnswer:', option, ')')
    recordTopicAttempt(userId, currentQuestion.topic, isCorrect)

    console.log('[DIAGNOSTIC] Question answered', {
      questionId: currentQuestion.id,
      correct: isCorrect,
      masteredBefore,
      masteredAfter: isCorrect ? masteredBefore + 1 : masteredBefore,
    })

    if (isCorrect) {
      console.log('[DIAGNOSTIC ANSWER] 6. Respuesta correcta, llamando a markQuestionMastered')
      const isNewMaster = markQuestionMastered(userId, currentQuestion.id)
      if (isNewMaster) {
        console.log('[DIAGNOSTIC ANSWER] 7. Nueva pregunta dominada, incrementando masteredCount y addXP')
        setMasteredCount((prev) => prev + 1)
        addXP('question', `question_${currentQuestion.id}`)
      } else {
        console.log('[DIAGNOSTIC ANSWER] 7. Pregunta ya era dominada, no hacemos nada')
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
  }

  const handleNext = () => {
    if (!isLocked) return

    if (currentIndex < totalSession - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
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
    const { strengths, weaknesses } = getCumulativeTopicAnalysis()
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

    const masteredQuestionIds = getMasteredQuestions()
    const topicLearningStats = getTopicLearningStats()

    console.log('[DIAGNOSTIC FINISH] 1. INICIO');
    console.log('[DIAGNOSTIC FINISH] 2. masteredQuestionIds:', JSON.stringify(masteredQuestionIds, null, 2));
    console.log('[DIAGNOSTIC FINISH] 3. masteredQuestionIds.length:', masteredQuestionIds.length);
    console.log('[DIAGNOSTIC FINISH] 4. masteredCount:', masteredCount);
    console.log('[DIAGNOSTIC FINISH] 5. topicLearningStats:', JSON.stringify(topicLearningStats, null, 2));

    // Guardar en la base de datos
    if (userId) {
      try {
        const actualMasteredCount = masteredQuestionIds.length; // <-- FIX: use actual length of mastered IDs array instead of state
        const apiPayload = {
          score: correctCount,
          total: totalSession,
          masteredTotal: actualMasteredCount,
          masteredGoal: TOTAL_DIAGNOSTIC_ITEMS,
          riskLevel,
          strengths: sanitizedStrengths,
          weaknesses: sanitizedWeaknesses,
          personalizedRecommendations,
          generalRecommendations,
          diagnosticMasteredIds: masteredQuestionIds,
          topicLearning: topicLearningStats,
        }

        console.log('[DIAGNOSTIC FINISH] 6. Llamando a diagnosticAPI.create() con payload:', JSON.stringify(apiPayload, null, 2));

        const response = await diagnosticAPI.create(apiPayload)
        console.log('[DIAGNOSTIC FINISH] 7. Respuesta de diagnosticAPI.create():', response);

        console.log('[DIAGNOSTIC] Session completed', {
          score: correctCount,
          total: totalSession,
          percentage: Math.round((correctCount / totalSession) * 100),
          fetchUserProgressExecuted: true
        })

        await fetchUserProgress()
        const newMasteredCount = getDiagnosticProgress().mastered
        console.log('[DIAGNOSTIC FINISH] 8. Después de fetchUserProgress, newMasteredCount:', newMasteredCount);
        setMasteredCount(newMasteredCount)
      } catch (error) {
        console.error('[DIAGNOSTIC FINISH] ERROR en diagnosticAPI.create():', error)
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

  const handleContinuePractice = async () => {
    // Reiniciar el estado local para cargar nuevas preguntas pendientes
    await fetchUserProgress()
    const newPending = getPendingQuestions()
    setSessionQuestions(selectPendingForSession(newPending))
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsLocked(false)
    setSessionAnswers([])
    setSessionComplete(false)
    setIsSubmitting(false)
    setMasteredCount(getDiagnosticProgress().mastered)
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
