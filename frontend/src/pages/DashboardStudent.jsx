import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Shield,
  BarChart3,
  Award,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Clock,
  Star,
  Zap,
  Target,
  ThumbsUp,
} from 'lucide-react'
import { getRelativeTime, getActivityIcon } from '../utils/activityHelper'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import UserLevelCard from '../components/UserLevelCard'
import TopicBadges from '../components/TopicBadges'
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton'
import { loadDashboardPageData } from '../store/userStore'
import { sanitizeHistoricalData } from '../utils/progressHelper'

function DashboardStudent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dashboardStats, setDashboardStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Obtener datos adicionales del store
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))

  useEffect(() => {
    console.log('[NAVIGATION] Enter Dashboard', { pathname: location.pathname, timestamp: new Date().toISOString(), userId: currentUser?.id })
    const loadData = async () => {
      console.log('[SYNC] Loading data for Dashboard')
      setIsLoading(true)
      const start = performance.now()
      const data = await loadDashboardPageData()
      if (import.meta.env.DEV) {
        console.info(`[Perf] DashboardStudent.jsx: ${Math.round(performance.now() - start)}ms`)
      }
      if (data) {
        console.log('[SYNC] Final values rendered for Dashboard:', {
          diagnosticsCount: data.dashboardStats.diagnosticsCount,
          simulationsCount: data.dashboardStats.simulationsCount,
          achievementsCount: data.dashboardStats.badgesEarned,
          certificatesCount: data.dashboardStats.certificateUnlocked ? 1 : 0,
          xp: data.dashboardStats.xp,
          level: data.dashboardStats.level
        })
        setDashboardStats(data.dashboardStats)
        setChartData(data.chartData)
        setActivities(data.activities)
      }
      setIsLoading(false)
    }
    loadData()
    return () => {
      console.log('[NAVIGATION] Exit Dashboard', { pathname: location.pathname, timestamp: new Date().toISOString() })
    }
  }, [location.pathname])

  const results = dashboardStats?.results || []

  // Limpiar datos históricos corruptos (una sola vez)
  if (currentUser) {
    sanitizeHistoricalData(currentUser.id)
  }

  const diagnosticsCount = dashboardStats?.diagnosticsCount || 0
  const diagnosticsTotal = dashboardStats?.diagnosticsTotal || 15
  const simulationsCompleted = dashboardStats?.simulationsCount || 0
  const simulationsTotal = dashboardStats?.simulationsTotal || 15
  const badgesEarned = dashboardStats?.badgesEarned || 0
  const riskLevel = dashboardStats?.securityLevel || 'Sin datos'
  const strengths = dashboardStats?.strengths || []
  const weaknesses = dashboardStats?.weaknesses || []
  const diagnosticPct = dashboardStats?.diagnosticProgress?.percentage ?? 0
  const simulationPct = dashboardStats?.simulationProgress?.percentage ?? 0
  const programTotal = diagnosticsTotal + simulationsTotal
  const programCompleted = diagnosticsCount + simulationsCompleted
  const programPct = programTotal > 0 ? Math.round((programCompleted / programTotal) * 100) : 0

  // Calcular estadísticas adicionales
  const latestResult = results.length > 0 ? results[0] : null
  const bestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0
  const lastScore = latestResult?.score || 0
  const averageScore = dashboardStats?.avgScore || 0

  const getRiskColor = (level) => {
    switch (level) {
      case 'Bajo':
        return 'text-green-500 bg-green-50'
      case 'Medio':
        return 'text-yellow-500 bg-yellow-50'
      case 'Alto':
        return 'text-red-500 bg-red-50'
      default:
        return 'text-gray-500 bg-gray-50'
    }
  }

  const getRiskIcon = (level) => {
    switch (level) {
      case 'Bajo':
        return <CheckCircle className="w-5 h-5" />
      case 'Medio':
        return <AlertTriangle className="w-5 h-5" />
      case 'Alto':
        return <AlertTriangle className="w-5 h-5" />
      default:
        return <Activity className="w-5 h-5" />
    }
  }

  const handleStartDiagnostic = () => {
    navigate('/diagnostic')
  }

  const handleViewResults = () => {
    navigate('/results')
  }

  const handleStartSimulations = () => {
    navigate('/simulations')
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido, {currentUser?.nombre || 'Usuario'}
          </h1>
          <p className="text-gray-600">
            Panel de control de ciberseguridad
          </p>
        </div>

        {/* User Level Card */}
        <div className="mb-8">
          <UserLevelCard />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Diagnostics Completed */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-700" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{diagnosticsCount}/{diagnosticsTotal}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Preguntas aprobadas</p>
          </div>

          {/* Risk Level */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getRiskColor(riskLevel).split(' ')[1]}`}>
                {getRiskIcon(riskLevel)}
              </div>
              <span className={`text-lg font-bold ${getRiskColor(riskLevel).split(' ')[0]}`}>
                {riskLevel}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600">Nivel de riesgo actual</p>
          </div>

          {/* Simulations Completed */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-cyan-700" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{simulationsCompleted}/{simulationsTotal}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Escenarios aprobados</p>
          </div>

          {/* Badges Earned */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{badgesEarned}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Insignias obtenidas</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Actividad Reciente</h3>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay actividad reciente</p>
              <p className="text-sm text-gray-400">Completa diagnósticos o simulaciones para ver tu progreso</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="text-2xl">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    {activity.details && (
                      <p className="text-sm text-gray-500">{activity.details}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{getRelativeTime(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Evolution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Evolución de Seguridad</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>

          {results.length < 2 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aún no hay suficientes diagnósticos para mostrar una evolución.</p>
              <p className="text-sm text-gray-400">Completa al menos 2 diagnósticos para ver tu progreso</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 text-emerald-600 mr-1" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{bestScore}/5</p>
                  <p className="text-sm text-emerald-600">Mejor puntaje</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="w-5 h-5 text-blue-700 mr-1" />
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{lastScore}/5</p>
                  <p className="text-sm text-blue-600">Último puntaje</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="w-5 h-5 text-[#2563EB] mr-1" />
                  </div>
                  <p className="text-2xl font-bold text-[#0F172A]">{averageScore}/5</p>
                  <p className="text-sm text-slate-600">Promedio</p>
                </div>
              </div>

              {/* Chart */}
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 5]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Start Diagnostic */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={handleStartDiagnostic}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Diagnóstico</h3>
              <p className="text-white/80 text-sm mb-4">
                Evalúa tu nivel de seguridad
              </p>
              <div className="flex items-center space-x-2 text-sm font-medium">
                <span>Comenzar</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Simulations */}
          <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-2xl p-8 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={handleStartSimulations}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Simulaciones</h3>
              <p className="text-white/80 text-sm mb-4">
                Practica con escenarios reales
              </p>
              <div className="flex items-center space-x-2 text-sm font-medium">
                <span>Iniciar</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* View Results */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={handleViewResults}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Resultados</h3>
              <p className="text-gray-600 text-sm mb-4">
                Consulta tu historial
              </p>
              <div className="flex items-center space-x-2 text-sm font-medium text-blue-600">
                <span>Ver</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Program Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-900">Diagnósticos aprobados</p>
              <span className="text-sm font-bold text-blue-600">
                {diagnosticsCount}/{diagnosticsTotal} ({diagnosticPct}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${diagnosticPct}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-900">Simulaciones aprobadas</p>
              <span className="text-sm font-bold text-cyan-600">
                {simulationsCompleted}/{simulationsTotal} ({simulationPct}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-600 to-teal-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${simulationPct}%` }}
              />
            </div>
          </div>
        </div>

        {strengths.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-900">Fortalezas</h3>
            </div>
            <TopicBadges topics={strengths} variant="strength" keyPrefix="dash-strength" />
          </div>
        )}

        {weaknesses.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Áreas de mejora</h3>
            </div>
            <TopicBadges topics={weaknesses} variant="weakness" keyPrefix="dash-weakness" />
          </div>
        )}

        {/* Diagnostics Stats Card */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#2563EB]/10 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Progreso del programa</p>
                <p className="text-lg font-bold text-gray-900">
                  {diagnosticsCount + simulationsCompleted}/{(diagnosticsTotal + simulationsTotal)} contenidos
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#2563EB]">{programPct}%</p>
              <p className="text-xs text-gray-500">Completado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardStudent