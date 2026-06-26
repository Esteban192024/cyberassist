// Función helper para registrar actividades - Migrado a Neon/Prisma
import { activityAPI } from '../services/api'

export const registerActivity = async (type, title, details = '') => {
  try {
    await activityAPI.create({ type, title, details })
  } catch (error) {
    // Silencioso - no bloquear flujo si falla registro de actividad
  }
}

export const getRelativeTime = (timestamp) => {
  const now = new Date()
  const past = new Date(timestamp)
  const diffInSeconds = Math.floor((now - past) / 1000)

  if (diffInSeconds < 60) {
    return 'ahora mismo'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `hace ${diffInWeeks} semana${diffInWeeks !== 1 ? 's' : ''}`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `hace ${diffInMonths} mes${diffInMonths !== 1 ? 'es' : ''}`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `hace ${diffInYears} año${diffInYears !== 1 ? 's' : ''}`
}

export const getActivityIcon = (type) => {
  switch (type) {
    case 'diagnostic':
      return '📋'
    case 'simulation':
      return '🎯'
    case 'achievement':
      return '🏆'
    case 'level_up':
      return '⬆️'
    default:
      return '📌'
  }
}

export const getUserActivities = async () => {
  try {
    const response = await activityAPI.getUserActivities()
    return response.data || []
  } catch (error) {
    console.error('[DEBUG] getUserActivities - API Error:', error)
    return []
  }
}
