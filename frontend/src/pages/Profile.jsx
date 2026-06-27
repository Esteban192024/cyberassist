import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Award,
  TrendingUp,
  Edit,
  Lock,
  CheckCircle,
  XCircle,
  Star,
  Target,
  Zap,
  Crown,
  ArrowLeft,
  Trophy
} from 'lucide-react'
import { getDashboardStats } from '../store/userStore'
import { useAuth } from '../context/AuthContext'
import { userAPI } from '../services/api'
import { syncAchievements } from '../utils/achievementsHelper'
import { getCachedProgress } from '../utils/progressHelper'
import ProfileSkeleton from '../components/skeletons/ProfileSkeleton'

function Profile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [editForm, setEditForm] = useState({ nombre: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [notification, setNotification] = useState(null)
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const currentUser = user

  useEffect(() => {
    console.log('[NAVIGATION] Enter Profile', { pathname: location.pathname, timestamp: new Date().toISOString(), userId: currentUser?.id })
    console.log('[SYNC] Profile page loaded - apiProgressCache status:', getCachedProgress() ? 'EXISTS' : 'NULL')
    const loadStats = async () => {
      console.log('[SYNC] Loading data for Profile')
      setIsLoading(true)
      const start = performance.now()
      const data = await getDashboardStats()
      if (import.meta.env.DEV) {
        console.info(`[Perf] Profile.jsx: ${Math.round(performance.now() - start)}ms`)
      }
      if (data) {
        console.log('[SYNC] Final values rendered for Profile:', {
          diagnosticsCount: data.diagnosticsCount,
          simulationsCount: data.simulationsCount,
          achievementsCount: data.badgesEarned,
          certificatesCount: data.certificateUnlocked ? 1 : 0,
          xp: data.xp,
          level: data.level
        })
        setStats(data)

        // Sincronizar logros pendientes si el programa está completo
        if (data.programComplete) {
          console.log('[SYNC] Program complete detected, syncing achievements')
          await syncAchievements()
        }
      }
      setIsLoading(false)
    }
    loadStats()
    return () => {
      console.log('[NAVIGATION] Exit Profile', { pathname: location.pathname, timestamp: new Date().toISOString() })
    }
  }, [location.pathname, currentUser?.id])

  const diagnosticsCount = stats?.diagnosticsCount ?? 0
  const diagnosticsTotal = stats?.diagnosticsTotal ?? 15
  const simulationsCount = stats?.simulationsCount ?? 0
  const simulationsTotal = stats?.simulationsTotal ?? 15
  const weaknesses = stats?.weaknesses ?? []
  const xp = stats?.xp ?? 0
  const securityLevel = stats?.securityLevel ?? 'Sin datos'
  const unlockedAchievementIds = stats?.unlockedAchievements ?? []
  const allAchievements = stats?.allAchievements ?? []
  const achievementProgress = stats?.achievementProgress ?? { unlocked: 0, total: 0, percentage: 0 }

  if (isLoading || !stats) {
    return <ProfileSkeleton />
  }

  // Mapear logros con iconos y colores
  const achievementIconMap = {
    'first_diagnostic': <Target className="w-6 h-6" />,
    'diagnostic_master': <Trophy className="w-6 h-6" />,
    'perfect_score': <Star className="w-6 h-6" />,
    'first_simulation': <Zap className="w-6 h-6" />,
    'simulation_master': <Award className="w-6 h-6" />,
    'perfect_simulation': <CheckCircle className="w-6 h-6" />,
    'level_2': <Shield className="w-6 h-6" />,
    'level_3': <Shield className="w-6 h-6" />,
    'level_4': <Crown className="w-6 h-6" />,
    'level_5': <Crown className="w-6 h-6" />,
    'security_expert': <Lock className="w-6 h-6" />,
    'phishing_expert': <Star className="w-6 h-6" />,
    'program_complete': <Trophy className="w-6 h-6" />,
  }

  const achievementColorMap = {
    'first_diagnostic': 'bg-blue-500',
    'diagnostic_master': 'bg-blue-700',
    'perfect_score': 'bg-yellow-500',
    'first_simulation': 'bg-green-500',
    'simulation_master': 'bg-sky-600',
    'perfect_simulation': 'bg-orange-500',
    'level_2': 'bg-cyan-500',
    'level_3': 'bg-teal-500',
    'level_4': 'bg-[#2563EB]',
    'level_5': 'bg-amber-500',
    'security_expert': 'bg-red-500',
    'phishing_expert': 'bg-rose-500',
    'program_complete': 'bg-[#0F172A]',
  }

  // Filtrar solo los 5 logros solicitados
  const requestedAchievementIds = ['first_diagnostic', 'first_simulation', 'level_4', 'level_3', 'phishing_expert']
  const achievements = allAchievements
    .filter(a => requestedAchievementIds.includes(a.code))
    .map(a => ({
      ...a,
      id: a.code,
      icon: achievementIconMap[a.code] || <Award className="w-6 h-6" />,
      color: achievementColorMap[a.code] || 'bg-gray-500',
      unlocked: unlockedAchievementIds.includes(a.code)
    }))

  const unlockedCount = achievementProgress.unlocked
  const achievementsTotal = achievementProgress.total
  const achievementsPct = achievementProgress.percentage

  const handleEditProfile = () => {
    setEditForm({ nombre: currentUser?.nombre || '', email: currentUser?.email || '' })
    setIsEditing(true)
  }

  const handleSaveProfile = async () => {
    if (!editForm.nombre.trim() || !editForm.email.trim()) {
      showNotification('Por favor completa todos los campos', 'error')
      return
    }

    try {
      await userAPI.updateProfile({ nombre: editForm.nombre })
      
      // Actualizar el estado global del usuario
      updateUser({ nombre: editForm.nombre })

      setIsEditing(false)
      showNotification('Perfil actualizado correctamente', 'success')
      
      // Recargar stats para reflejar cambios
      const loadStats = async () => {
        const data = await getDashboardStats()
        if (data) setStats(data)
      }
      loadStats()
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification(error.response?.data?.error || 'Error al actualizar perfil', 'error')
    }
  }

  const handleChangePassword = () => {
    setPasswordForm({ current: '', new: '', confirm: '' })
    setIsChangingPassword(true)
  }

  const handleSavePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      showNotification('Por favor completa todos los campos', 'error')
      return
    }

    if (passwordForm.new !== passwordForm.confirm) {
      showNotification('Las contraseñas no coinciden', 'error')
      return
    }

    if (passwordForm.new.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres', 'error')
      return
    }

    try {
      await userAPI.updatePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new
      })
      
      setIsChangingPassword(false)
      setPasswordForm({ current: '', new: '', confirm: '' })
      showNotification('Contraseña cambiada correctamente', 'success')
    } catch (error) {
      console.error('Error updating password:', error)
      showNotification(error.response?.data?.error || 'Error al cambiar contraseña', 'error')
    }
  }

  const showNotification = (message, type) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const getRegistrationDate = () => {
    if (!currentUser?.createdAt) return 'N/A'
    const date = new Date(currentUser.createdAt)
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/student')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información y visualiza tus logros</p>
        </motion.div>

        {/* Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
              notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${
              notification.type === 'success' ? 'text-green-900' : 'text-red-900'
            }`}>
              {notification.message}
            </span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentUser?.nombre || 'Usuario'}
                </h2>
                <p className="text-gray-600 text-sm capitalize">
                  {currentUser?.role || 'Estudiante'}
                </p>
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Correo</p>
                      <p className="text-sm font-medium text-gray-900">
                        {currentUser?.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Rol</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {currentUser?.role || 'Estudiante'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Fecha de registro</p>
                      <p className="text-sm font-medium text-gray-900">
                        {getRegistrationDate()}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleEditProfile}
                      className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={handleChangePassword}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Contraseña</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Change Password Modal */}
            {isChangingPassword && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Cambiar Contraseña</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSavePassword}
                      className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Cambiar
                    </button>
                    <button
                      onClick={() => setIsChangingPassword(false)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Stats & Achievements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                  <Shield className="w-5 h-5 text-blue-700" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{diagnosticsCount}/{diagnosticsTotal}</p>
                <p className="text-xs text-gray-600">Diagnósticos aprobados</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 text-cyan-700" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{simulationsCount}/{simulationsTotal}</p>
                <p className="text-xs text-gray-600">Simulaciones aprobadas</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{securityLevel}</p>
                <p className="text-xs text-gray-600">Riesgo</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{xp}</p>
                <p className="text-xs text-gray-600">XP</p>
              </div>
            </motion.div>

            {weaknesses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="font-bold text-gray-900 mb-3">Áreas de mejora</h3>
                <ul className="space-y-1">
                  {weaknesses.map((t, index) => (
                    <li key={`profile-weakness-${index}`} className="text-sm text-red-700">{t}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Logros y progreso */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Logros</h3>
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {unlockedCount}/{achievementsTotal}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className={`p-4 rounded-xl border-2 ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
                        : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        achievement.unlocked ? achievement.color : 'bg-gray-200'
                      }`}>
                        <span className={achievement.unlocked ? 'text-white' : 'text-gray-400'}>
                          {achievement.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-1 ${
                          achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {achievement.name}
                        </h4>
                        <p className={`text-xs ${
                          achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.unlocked && (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="w-full border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Progreso de Logros</h3>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {achievementsPct}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${achievementsPct}%` }}
                    transition={{ duration: 1 }}
                  ></motion.div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {unlockedCount} de {achievementsTotal} logros desbloqueados
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
