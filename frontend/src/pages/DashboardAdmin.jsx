import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  BarChart3, 
  Shield, 
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

function DashboardAdmin() {
  const navigate = useNavigate()
  
  const users = JSON.parse(localStorage.getItem('users')) || []
  const results = JSON.parse(localStorage.getItem('results')) || []
  
  // Calcular estadísticas
  const totalUsers = users.length
  const totalDiagnostics = results.length
  const activeUsers = users.filter(u => u.rol === 'estudiante').length
  const avgScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)
    : 0

  const handleViewUsers = () => {
    console.log('Ver usuarios')
  }

  const handleViewReports = () => {
    console.log('Ver reportes')
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel Administrador
          </h1>
          <p className="text-gray-600">
            Gestión y supervisión de la plataforma
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{totalUsers}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total de Usuarios</p>
          </div>

          {/* Total Diagnostics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-secondary-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{totalDiagnostics}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total de Diagnósticos</p>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{activeUsers}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{avgScore}/10</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Puntuación Promedio</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* View Users */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={handleViewUsers}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Gestionar Usuarios</h3>
                <p className="text-white/80 text-sm mb-4">
                  Administra los usuarios registrados y sus permisos
                </p>
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <span>Ver usuarios</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* View Reports */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewReports}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ver Reportes</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Consulta estadísticas detalladas y análisis de datos
                </p>
                <div className="flex items-center space-x-2 text-sm font-medium text-primary-600">
                  <span>Ver reportes</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Actividad Reciente</h3>
            <Activity className="w-5 h-5 text-primary-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Nuevo usuario registrado</p>
                <p className="text-xs text-gray-500">Hace 2 minutos</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Diagnóstico completado</p>
                <p className="text-xs text-gray-500">Hace 15 minutos</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Alerta de seguridad generada</p>
                <p className="text-xs text-gray-500">Hace 1 hora</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardAdmin