import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  Mail,
  Download,
  Lock,
  Phone,
  Key,
  CheckCircle,
  XCircle,
  ArrowRight,
  Award,
  TrendingUp,
  Wifi,
  ShoppingCart,
  QrCode,
  MessageCircle,
  Users,
  Smartphone,
  Globe,
  UserX,
  EyeOff,
} from 'lucide-react'
import { registerActivity } from '../utils/activityHelper'
import { addXP } from '../utils/levelHelper'
import { checkAchievements } from '../utils/achievementsHelper'
import {
  getPendingScenarios,
  selectPendingForSession,
  markScenarioMastered,
  recordTopicAttempt,
  getSimulationProgress,
  TOTAL_SIMULATION_ITEMS,
  getCumulativeTopicAnalysis,
  sanitizeTopicList,
  fetchUserProgress,
} from '../utils/progressHelper'
import { simulationAPI } from '../services/api'
import {
  shuffleArray,
  calculateRiskLevel,
  generateUniqueId,
  getCorrectScenarioOption,
  getRiskLevelColors,
} from '../utils/quizHelper'

const ICON_MAP = {
  mail: Mail,
  download: Download,
  lock: Lock,
  phone: Phone,
  key: Key,
  wifi: Wifi,
  shopping: ShoppingCart,
  qr: QrCode,
  message: MessageCircle,
  users: Users,
  smartphone: Smartphone,
  globe: Globe,
  'user-x': UserX,
  'eye-off': EyeOff,
}

function renderScenarioIcon(iconName) {
  const IconComponent = ICON_MAP[iconName] || Shield
  return <IconComponent className="w-8 h-8" />
}

function ScenarioContent({ scenario }) {
  if (!scenario?.scenario) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-700">{scenario?.description}</p>
      </div>
    )
  }

  const { type } = scenario.scenario

  if (type === 'email') {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="font-medium">De:</span>
          <span className="text-red-600">{scenario.scenario.from}</span>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Asunto:</span> {scenario.scenario.subject}
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-700">{scenario.scenario.body}</p>
        </div>
      </div>
    )
  }

  if (type === 'file') {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
          <Download className="w-8 h-8 text-red-500" />
          <div>
            <p className="font-medium text-gray-900">{scenario.scenario.filename}</p>
            <p className="text-sm text-gray-600">De: {scenario.scenario.sender}</p>
          </div>
        </div>
        <p className="text-gray-600">{scenario.scenario.message}</p>
      </div>
    )
  }

  if (type === 'passwords') {
    return (
      <div className="space-y-3">
        {scenario.scenario.options?.map((pass) => (
          <div
            key={`${scenario.id}-pass-${pass}`}
            className="p-3 bg-white rounded-lg border border-gray-200 font-mono text-sm"
          >
            {pass}
          </div>
        ))}
      </div>
    )
  }

  if (type === 'social') {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
          <Phone className="w-8 h-8 text-yellow-500" />
          <div>
            <p className="font-medium text-gray-900">{scenario.scenario.sender}</p>
          </div>
        </div>
        <p className="text-gray-700 italic">&quot;{scenario.scenario.message}&quot;</p>
      </div>
    )
  }

  if (type === '2fa') {
    return (
      <div className="space-y-3">
        {scenario.scenario.scenarios?.map((item) => (
          <div
            key={`${scenario.id}-item-${item}`}
            className="p-3 bg-white rounded-lg border border-gray-200"
          >
            {item}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <p className="text-gray-700">{scenario.description}</p>
    </div>
  )
}

function Simulations() {
  const navigate = useNavigate()
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))
  const userId = currentUser?.id

  useEffect(() => {
    console.log('[NAVIGATION] Enter Simulations', { pathname: window.location.pathname, timestamp: new Date().toISOString(), userId })
    return () => {
      console.log('[NAVIGATION] Exit Simulations', { pathname: window.location.pathname, timestamp: new Date().toISOString() })
    }
  }, [])

  const initialProgress = getSimulationProgress(userId)

  const sessionScenarios = useMemo(
    () => selectPendingForSession(getPendingScenarios(userId)),
    [userId]
  )

  const [currentSimulation, setCurrentSimulation] = useState(0)
  const [score, setScore] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [shuffledOptions, setShuffledOptions] = useState(() =>
    sessionScenarios.length > 0 ? shuffleArray(sessionScenarios[0].options) : []
  )
  const [sessionAnswers, setSessionAnswers] = useState([])
  const [completed, setCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [masteredCount, setMasteredCount] = useState(initialProgress.mastered)

  const currentSim = sessionScenarios[currentSimulation]
  const totalSession = sessionScenarios.length
  const cumulativeProgress = (masteredCount / TOTAL_SIMULATION_ITEMS) * 100

  const handleAnswer = (option) => {
    if (isLocked || !currentSim || !userId) return

    const masteredBefore = getMasteredScenarios(userId).length
    setSelectedAnswer(option)
    setIsLocked(true)

    const isCorrect = option.id === currentSim.correctAnswer || option.correct
    recordTopicAttempt(userId, currentSim.topic, isCorrect)

    console.log('[SIMULATION] Scenario answered', {
      scenarioId: currentSim.id,
      correct: isCorrect,
      masteredBefore,
      masteredAfter: isCorrect ? masteredBefore + 1 : masteredBefore
    })

    if (isCorrect) {
      setScore((prev) => prev + 1)
      const isNewMaster = markScenarioMastered(userId, currentSim.id)
      if (isNewMaster) {
        setMasteredCount((prev) => prev + 1)
        addXP('scenario', `scenario_${currentSim.id}`)
      }
    }

    setSessionAnswers((prev) => [
      ...prev,
      { scenarioId: currentSim.id, topic: currentSim.topic, correct: isCorrect },
    ])
  }

  const handleNext = () => {
    if (!isLocked || isSubmitting) return

    if (currentSimulation < totalSession - 1) {
      const nextIndex = currentSimulation + 1
      setCurrentSimulation(nextIndex)
      setShuffledOptions(shuffleArray(sessionScenarios[nextIndex].options))
      setSelectedAnswer(null)
      setIsLocked(false)
    } else {
      finishSimulations()
    }
  }

  const finishSimulations = async () => {
    setIsSubmitting(true)

    const riskLevel = calculateRiskLevel(score, totalSession)
    const { strengths, weaknesses } = getCumulativeTopicAnalysis(userId)

    const sanitizedStrengths = sanitizeTopicList(strengths)
    const sanitizedWeaknesses = sanitizeTopicList(weaknesses)

    const simulationResult = {
      id: generateUniqueId(),
      score,
      total: totalSession,
      masteredTotal: masteredCount,
      masteredGoal: TOTAL_SIMULATION_ITEMS,
      level: riskLevel,
      riskLevel,
      strengths: sanitizedStrengths,
      weaknesses: sanitizedWeaknesses,
      date: new Date().toISOString().split('T')[0],
      userId,
    }

    // Guardar en la base de datos
    if (userId) {
      try {
        await simulationAPI.create({
          score,
          total: totalSession,
          masteredTotal: masteredCount,
          masteredGoal: TOTAL_SIMULATION_ITEMS,
          riskLevel,
          strengths: sanitizedStrengths,
          weaknesses: sanitizedWeaknesses,
        })

        // Actualizar el cache local
        console.log('[SIMULATION] Session completed', {
          score,
          total: totalSession,
          percentage: Math.round((score / totalSession) * 100),
          fetchUserProgressExecuted: true
        })
        const progressResponse = await fetchUserProgress()
        console.log('[SIMULATION] fetchUserProgress response:', progressResponse)
      } catch (error) {
        console.error('Error saving simulation to database:', error)
        throw error
      }
    }

    await registerActivity('simulation', 'Sesión de simulación', `${masteredCount}/${TOTAL_SIMULATION_ITEMS} aprobados`)
    await checkAchievements({
      type: 'simulation',
      score,
      total: totalSession,
      masteredTotal: masteredCount,
    })

    setCompleted(true)
  }

  const handleBackToDashboard = () => navigate('/student')
  const handleRestart = () => window.location.reload()

  if (initialProgress.complete || masteredCount >= TOTAL_SIMULATION_ITEMS) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Simulaciones Completadas!</h1>
          <p className="text-gray-600 mb-4">Has aprobado los {TOTAL_SIMULATION_ITEMS} escenarios del programa.</p>
          <p className="text-2xl font-bold text-blue-600 mb-8">
            {TOTAL_SIMULATION_ITEMS}/{TOTAL_SIMULATION_ITEMS} — 100%
          </p>
          <button
            onClick={handleBackToDashboard}
            className="py-4 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  if (sessionScenarios.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <div className="text-center p-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay escenarios pendientes.</p>
        </div>
      </div>
    )
  }

  if (completed) {
    const pending = TOTAL_SIMULATION_ITEMS - masteredCount
    const riskLevel = calculateRiskLevel(score, totalSession)
    const riskColors = getRiskLevelColors(riskLevel)

    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sesión completada</h1>
              <p className={`text-3xl font-bold ${riskColors.text} mb-2`}>
                {masteredCount}/{TOTAL_SIMULATION_ITEMS}
              </p>
              <p className="text-gray-600">
                {pending > 0
                  ? `Te quedan ${pending} escenarios por aprobar.`
                  : '¡Has completado todas las simulaciones!'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {pending > 0 && (
                <button
                  onClick={handleRestart}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  Continuar práctica ({pending} pendientes)
                </button>
              )}
              <button
                onClick={handleBackToDashboard}
                className="flex-1 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                Volver al dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!currentSim) return null

  const correctOption = getCorrectScenarioOption(currentSim)
  const isCorrect = selectedAnswer?.id === currentSim.correctAnswer || selectedAnswer?.correct

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulaciones de Ciberseguridad</h1>
          <p className="text-gray-600">Practica los escenarios pendientes hasta dominarlos todos</p>
        </motion.div>

        <motion.div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progreso total del programa</span>
            <span className="text-sm font-bold text-blue-600">
              {masteredCount}/{TOTAL_SIMULATION_ITEMS} ({Math.round(cumulativeProgress)}%)
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
            Sesión actual: escenario {currentSimulation + 1} de {totalSession}
          </p>
        </motion.div>

        <motion.div
          key={currentSim.id}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700">
              {renderScenarioIcon(currentSim.icon)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentSim.title}</h2>
              <p className="text-gray-600">{currentSim.description}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <ScenarioContent scenario={currentSim} />
          </div>

          {!isLocked && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shuffledOptions.map((option) => (
                <motion.button
                  key={`${currentSim.id}-opt-${option.id}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(option)}
                  className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <span className="font-medium text-gray-900">{option.text}</span>
                </motion.button>
              ))}
            </div>
          )}

          {isLocked && selectedAnswer && (
            <motion.div className="space-y-4">
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
                    {isCorrect ? '¡Correcto! Escenario aprobado.' : 'Incorrecto'}
                  </p>
                  {!isCorrect && currentSim.recommendation && (
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-red-900">¿Por qué fue incorrecta?</p>
                        <p className="text-red-800">{currentSim.recommendation.whyIncorrect}</p>
                      </div>
                      <div>
                        <p className="font-medium text-red-900">¿Qué riesgo existía?</p>
                        <p className="text-red-800">{currentSim.recommendation.risk}</p>
                      </div>
                      <div>
                        <p className="font-medium text-red-900">¿Cómo actuar correctamente?</p>
                        <p className="text-red-800">{currentSim.recommendation.howToAct}</p>
                      </div>
                      {correctOption && (
                        <p className="text-red-700 font-medium">
                          Respuesta correcta: {correctOption.text}
                        </p>
                      )}
                    </div>
                  )}
                  {isCorrect && currentSim.recommendation && (
                    <p className="text-sm text-green-800">{currentSim.recommendation.howToAct}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <span>
                  {currentSimulation < totalSession - 1 ? 'Siguiente simulación' : 'Finalizar sesión'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Simulations
