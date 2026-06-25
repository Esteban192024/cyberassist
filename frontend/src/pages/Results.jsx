import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Calendar,
  Award,
  Lightbulb,
  Filter,
  History,
  Target,
  AlertCircle,
  ThumbsUp,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import CertificateGenerator from '../components/CertificateGenerator'
import ResultsSkeleton from '../components/skeletons/ResultsSkeleton'
import { loadResultsPageData, invalidateUserCache } from '../store/userStore'
import { unlockCertificate } from '../utils/levelHelper'
import { getRiskLevelColors } from '../utils/quizHelper'
import { sanitizeTopicList } from '../utils/progressHelper'
import TopicBadges from '../components/TopicBadges'

function Results() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsData, setResultsData] = useState(null)
  const [allHistory, setAllHistory] = useState([])
  const [chartData, setChartData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const itemsPerPage = 5

  const currentUser = JSON.parse(localStorage.getItem('currentUser'))

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const start = performance.now()
      const data = await loadResultsPageData()
      if (import.meta.env.DEV) {
        console.info(`[Perf] Results.jsx: ${Math.round(performance.now() - start)}ms`)
      }
      if (data) {
        setResultsData(data)
        setAllHistory(data.allHistory || [])
        setChartData(data.chartData || [])
      }
      setIsLoading(false)
    }
    loadData()
  }, [])

  const results = resultsData?.results || []
  const simulationsResults = resultsData?.simulationsResults || []
  const certificateUnlocked = resultsData?.certificateUnlocked || false
  const canUnlockCertificate = resultsData?.canUnlockCertificate || false
  const latestResult = resultsData?.latestResult || null
  const userLevelData = { xp: resultsData?.xp || 0, level: resultsData?.level || 1 }
  const levelName = resultsData?.levelName || 'Novato Digital'
  const securityLevel = resultsData?.securityLevel || 'Sin datos'
  const diagnosticsCount = resultsData?.diagnosticsCount || 0
  const diagnosticsTotal = resultsData?.diagnosticsTotal || 15
  const simulationsCount = resultsData?.simulationsCount || 0
  const simulationsTotal = resultsData?.simulationsTotal || 15
  const storeStrengths = resultsData?.strengths || []
  const storeWeaknesses = resultsData?.weaknesses || []

  const typeFiltered =
    typeFilter === 'all' ? allHistory : allHistory.filter((item) => item.type === typeFilter)

  const parseHistoryDate = (dateStr) => {
    if (!dateStr) return null
    return new Date(`${dateStr}T12:00:00`)
  }

  const today = new Date().toISOString().split('T')[0]
  const dateFiltered =
    dateFilter === 'all'
      ? typeFiltered
      : dateFilter === 'today'
        ? typeFiltered.filter((item) => item.date === today)
        : dateFilter === 'week'
          ? typeFiltered.filter((item) => {
              const itemDate = parseHistoryDate(item.date)
              if (!itemDate) return false
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              weekAgo.setHours(0, 0, 0, 0)
              return itemDate >= weekAgo
            })
          : dateFilter === 'month'
            ? typeFiltered.filter((item) => {
                const itemDate = parseHistoryDate(item.date)
                if (!itemDate) return false
                const monthAgo = new Date()
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                monthAgo.setHours(0, 0, 0, 0)
                return itemDate >= monthAgo
              })
            : typeFiltered

  const filteredResults =
    filter === 'all' ? dateFiltered : dateFiltered.filter((r) => r.level === filter)

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleNewDiagnostic = () => {
    navigate('/diagnostic')
  }

  const handleBackToDashboard = () => {
    navigate('/student')
  }

  if (isLoading) {
    return <ResultsSkeleton />
  }

  if (!latestResult) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full mx-4"
        >
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Resultados</h1>
            <p className="text-gray-600 mb-6">No existe ningún diagnóstico registrado</p>
            <button
              onClick={handleBackToDashboard}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
            >
              Volver al dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const riskLevel = latestResult.riskLevel || latestResult.level || 'Medio'
  const maxScore = latestResult.total || latestResult.masteredGoal || 5
  const masteredTotal = latestResult.masteredTotal ?? diagnosticsCount
  const masteredGoal = latestResult.masteredGoal ?? diagnosticsTotal
  const diagnosticProgressPct =
    masteredGoal > 0 ? Math.round((masteredTotal / masteredGoal) * 100) : 0
  const personalizedRecommendations = latestResult.personalizedRecommendations || []
  const generalRecommendations = latestResult.generalRecommendations || []
  const strengths = sanitizeTopicList(storeStrengths)
  const weaknesses = sanitizeTopicList(storeWeaknesses)
  const levelColor = getRiskLevelColors(riskLevel)
  const percentage = maxScore > 0 ? (latestResult.score / maxScore) * 100 : 0

  const getLevelIcon = (level) => {
    switch (level) {
      case 'Bajo':
        return <CheckCircle className="w-8 h-8" />
      case 'Medio':
        return <AlertTriangle className="w-8 h-8" />
      case 'Alto':
        return <AlertCircle className="w-8 h-8" />
      default:
        return <Shield className="w-8 h-8" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resultados del Diagnóstico</h1>
          <p className="text-gray-600">Análisis completo de tu nivel de riesgo digital</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke={levelColor.hex}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: percentage / 100 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  style={{ pathLength: percentage / 100 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{latestResult.score}</span>
                <span className="text-sm text-gray-500">/ {maxScore}</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div
                className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full ${levelColor.light} mb-4`}
              >
                <span className={levelColor.text}>{getLevelIcon(riskLevel)}</span>
                <span className={`text-2xl font-bold ${levelColor.text}`}>
                  Riesgo {riskLevel}
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2 text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{latestResult.date}</span>
              </div>
              <p className="text-gray-600">
                {riskLevel === 'Bajo'
                  ? 'Excelente desempeño. Tu exposición al riesgo digital es baja.'
                  : riskLevel === 'Medio'
                    ? 'Riesgo moderado. Hay áreas que puedes mejorar con práctica.'
                    : 'Riesgo alto. Te recomendamos reforzar tus conocimientos de ciberseguridad.'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Progreso acumulativo del programa</h3>
            <span className="text-sm font-bold text-blue-600">
              {masteredTotal}/{masteredGoal} diagnósticos · {simulationsCount}/{simulationsTotal} simulaciones
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <motion.div
              className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600"
              initial={{ width: 0 }}
              animate={{ width: `${diagnosticProgressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-600">
            Sesión actual: {latestResult.score}/{maxScore} correctas
          </p>
        </motion.div>

        {strengths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8"
          >
            <div className="flex items-center space-x-2 mb-4">
              <ThumbsUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">Fortalezas</h3>
            </div>
            <TopicBadges topics={strengths} variant="strength" keyPrefix="results-strength" />
          </motion.div>
        )}

        {weaknesses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-gray-900">Áreas de mejora</h3>
            </div>
            <TopicBadges topics={weaknesses} variant="weakness" keyPrefix="results-weakness" />
          </motion.div>
        )}

        {personalizedRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8"
          >
            <div className="flex items-center space-x-2 mb-6">
              <Target className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-gray-900">Recomendaciones por tema</h3>
            </div>
            <div className="space-y-4">
              {personalizedRecommendations.map((rec) => (
                <motion.div
                  key={`rec-${rec.questionId}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-red-200 bg-red-50 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{rec.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{rec.topic}</h4>
                      <p className="text-sm text-gray-600">Tu respuesta: {rec.answer}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 ml-11">
                    {(rec.recommendations || []).map((recItem, recIndex) => (
                      <li
                        key={`rec-item-${rec.questionId}-${recIndex}`}
                        className="flex items-start space-x-2 text-sm text-gray-700"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{recItem}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-gray-900">Recomendaciones Generales</h3>
          </div>
          <div className="space-y-3">
            {(generalRecommendations || []).map((rec, index) => (
              <motion.div
                key={`general-rec-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${levelColor.light}`}
                >
                  <span className={`text-xs font-bold ${levelColor.text}`}>{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700">{rec}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {allHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Historial</h3>
                <span className="text-sm text-gray-500">({filteredResults.length} registros)</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="diagnostic">Diagnósticos</option>
                  <option value="simulation">Simulaciones</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="today">Hoy</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mes</option>
                </select>
              </div>

              {(typeFilter === 'all' || typeFilter === 'diagnostic') && (
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <select
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los niveles de riesgo</option>
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>
              )}
            </div>

            {(typeFilter === 'all' || typeFilter === 'diagnostic') &&
              results.length > 1 && (
                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} domain={[0, 5]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

            <div className="space-y-3">
              {paginatedResults.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No hay resultados con estos filtros
                </p>
              ) : (
                paginatedResults.map((result, index) => {
                  const resultRisk = result.riskLevel || result.level
                  const resultColor = resultRisk
                    ? getRiskLevelColors(resultRisk)
                    : { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' }
                  const displayScore = result.total
                    ? `${result.score}/${result.total}`
                    : `${result.score}/${result.total || 5}`
                  const historyKey =
                    result.id || `${result.type}-${result.date}-${result.score}-${index}`

                  return (
                    <motion.div
                      key={historyKey}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${resultColor.light}`}
                        >
                          <span className={`text-sm font-bold ${resultColor.text}`}>
                            {result.type === 'simulation'
                              ? 'S'
                              : resultRisk
                                ? resultRisk.charAt(0)
                                : 'D'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {result.displayType}
                            </span>
                            <p className="font-medium text-gray-900">{result.date}</p>
                          </div>
                          <p className="text-sm text-gray-600">Puntuación: {displayScore}</p>
                        </div>
                      </div>
                      {resultRisk && (
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${resultColor.light} ${resultColor.text}`}
                        >
                          Riesgo {resultRisk}
                        </div>
                      )}
                    </motion.div>
                  )
                })
              )}
            </div>

            {filteredResults.length > itemsPerPage && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredResults.length)} de{' '}
                  {filteredResults.length}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className={`px-3 py-1 text-sm border rounded-lg ${
                          currentPage === totalPages
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <button
            onClick={handleNewDiagnostic}
            className="py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Award className="w-5 h-5" />
            <span>Realizar nuevo diagnóstico</span>
          </button>
          <button
            onClick={handleBackToDashboard}
            className="py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <ArrowRight className="w-5 h-5" />
            <span>Volver al dashboard</span>
          </button>
        </motion.div>

        {certificateUnlocked && currentUser && userLevelData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8"
          >
            <CertificateGenerator
              studentName={currentUser.nombre || 'Usuario'}
              type="program"
              riskLevel={securityLevel}
              levelName={levelName}
              xp={userLevelData.xp}
              date={today}
            />
          </motion.div>
        )}

        {canUnlockCertificate && currentUser && !certificateUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8"
          >
            <button
              disabled={isUnlocking}
              onClick={async () => {
                setIsUnlocking(true)
                try {
                  await unlockCertificate('program', securityLevel, levelName, userLevelData.xp)
                  invalidateUserCache()
                  setResultsData((prev) =>
                    prev
                      ? {
                          ...prev,
                          certificateUnlocked: true,
                          canUnlockCertificate: false,
                        }
                      : prev
                  )
                  if (typeof window !== 'undefined' && window.Swal) {
                    window.Swal.fire({
                      icon: 'success',
                      title: 'Certificado Desbloqueado',
                      text: 'Tu certificado ya esta disponible para descargar.',
                      confirmButtonColor: '#2563EB',
                    })
                  }
                } catch (error) {
                  if (typeof window !== 'undefined' && window.Swal) {
                    window.Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text:
                        error.response?.data?.error ||
                        'No se pudo desbloquear el certificado. Por favor intenta nuevamente.',
                      confirmButtonColor: '#2563EB',
                    })
                  }
                } finally {
                  setIsUnlocking(false)
                }
              }}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#2563EB] py-4 font-semibold text-white transition-all duration-200 hover:bg-[#1d4ed8] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Award className="w-5 h-5" />
              <span>{isUnlocking ? 'Desbloqueando...' : 'Desbloquear Certificado de Finalizacion'}</span>
            </button>
            <p className="text-center text-sm text-gray-600 mt-2">
              Has aprobado todos los contenidos del programa. Felicidades.
            </p>
          </motion.div>
        )}

        {!certificateUnlocked && !canUnlockCertificate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 bg-gray-50 rounded-xl p-6 text-center border border-gray-200"
          >
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Certificado de Finalización</h3>
            <p className="text-sm text-gray-600 mb-3">
              Completa todos los contenidos para desbloquear tu certificado.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="text-center">
                <p className="font-bold text-gray-900">
                  {diagnosticsCount}/{diagnosticsTotal}
                </p>
                <p className="text-gray-600">Diagnósticos aprobados</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">
                  {simulationsCount}/{simulationsTotal}
                </p>
                <p className="text-gray-600">Simulaciones aprobadas</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Results
