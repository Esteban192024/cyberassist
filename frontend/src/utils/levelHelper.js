// Sistema de niveles y XP para gamificación
import { registerActivity } from './activityHelper'
import { certificateAPI, userAPI } from '../services/api'

// Cache para userLevelData para evitar múltiples llamadas a API
let userLevelDataCache = null
let userLevelDataCacheExpiry = 0

const LEVELS = {
  1: { name: 'Novato Digital', xpRequired: 0, icon: '🌱' },
  2: { name: 'Aprendiz Digital', xpRequired: 300, icon: '📚' },
  3: { name: 'Usuario Seguro', xpRequired: 700, icon: '🛡️' },
  4: { name: 'Protector Digital', xpRequired: 1200, icon: '⚔️' },
  5: { name: 'Experto en Ciberseguridad', xpRequired: 2000, icon: '🏆' }
}

export { LEVELS }

const XP_VALUES = {
  diagnostic: 100,
  simulation: 150,
  achievement: 200,
  question: 40,
  scenario: 50,
}

// Sistema de tracking de actividades recompensadas
export const getRewardedActivities = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))
  if (!currentUser) return []

  const rewarded = JSON.parse(localStorage.getItem(`rewardedActivities_${currentUser.id}`)) || []
  return rewarded
}

export const isActivityRewarded = (activityId) => {
  const rewarded = getRewardedActivities()
  return rewarded.includes(activityId)
}

export const markActivityAsRewarded = (activityId) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))
  if (!currentUser) return

  const rewarded = getRewardedActivities()
  if (!rewarded.includes(activityId)) {
    rewarded.push(activityId)
    localStorage.setItem(`rewardedActivities_${currentUser.id}`, JSON.stringify(rewarded))
  }
}

export const getLevelUpNotifications = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))
  if (!currentUser) return []
  
  try {
    return JSON.parse(localStorage.getItem(`levelUpNotifications_${currentUser.id}`)) || []
  } catch {
    return []
  }
}

export const markLevelUpNotified = (level) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))
  if (!currentUser) return
  
  const notifications = getLevelUpNotifications()
  if (!notifications.includes(level)) {
    notifications.push(level)
    localStorage.setItem(`levelUpNotifications_${currentUser.id}`, JSON.stringify(notifications))
  }
}

export const isLevelUpNotified = (level) => {
  const notifications = getLevelUpNotifications()
  return notifications.includes(level)
}

export const isCertificateUnlocked = async () => {
  try {
    const certificates = await certificateAPI.getUserCertificates()
    return certificates.data && certificates.data.length > 0
  } catch (error) {
    console.error('Error checking certificate status:', error)
    return false
  }
}

export const unlockCertificate = async (type = 'program', securityLevel = 'Alto', levelName = 'Experto en Ciberseguridad', xp = 2000) => {
  try {
    const response = await certificateAPI.create({ type, securityLevel, levelName, xp })
    return response.data
  } catch (error) {
    console.error('Error unlocking certificate:', error)
    throw error
  }
}

export const getUserLevelData = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))
  if (!currentUser) return null

  // Verificar caché
  const now = Date.now()
  if (userLevelDataCache && (now - userLevelDataCacheExpiry) < 5000) {
    console.log('[LEVEL READ] [XP READ] Usando caché local')
    return userLevelDataCache
  }

  console.log('[LEVEL READ] [XP READ] Origen: PostgreSQL, Endpoint: GET /users/profile')
  try {
    const response = await userAPI.getProfile()
    const levelData = {
      xp: response.data.xp,
      level: response.data.level
    }
    console.log('[LEVEL READ] [XP READ] Valor recibido desde PostgreSQL:', levelData)
    
    // Actualizar caché
    userLevelDataCache = levelData
    userLevelDataCacheExpiry = Date.now()
    
    return levelData
  } catch (error) {
    console.error('[LEVEL READ] [XP READ] Error al obtener datos desde API:', error)
    // Fallback a localStorage si API falla
    const userProgress = JSON.parse(localStorage.getItem(`userProgress_${currentUser.id}`)) || {
      xp: 0,
      level: 1
    }
    return userProgress
  }
}

export const invalidateUserLevelDataCache = () => {
  userLevelDataCache = null
  userLevelDataCacheExpiry = 0
}

export const calculateLevel = (xp) => {
  let level = 1
  for (let i = 5; i >= 1; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      level = i
      break
    }
  }
  return level
}

export const getLevelInfo = (level) => {
  return LEVELS[level] || LEVELS[1]
}

export const getNextLevelXP = (currentLevel) => {
  const nextLevel = currentLevel + 1
  if (nextLevel > 5) return LEVELS[5].xpRequired
  return LEVELS[nextLevel].xpRequired
}

export const getCurrentLevelXP = (currentLevel) => {
  return LEVELS[currentLevel].xpRequired
}

export const addXP = async (type, activityId = null, showLevelToast = true) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))
  if (!currentUser) return null

  const currentLevelData = await getUserLevelData()
  const oldXP = currentLevelData?.xp || 0
  const oldLevelBefore = currentLevelData?.level || 1

  console.log('[XP WRITE] Inicio de addXP', {
    activity: type,
    xpGranted: XP_VALUES[type] || 0,
    xpBefore: oldXP,
    xpAfter: oldXP + (XP_VALUES[type] || 0),
    levelBefore: oldLevelBefore
  })

  // Si el certificado ya está desbloqueado, no dar más XP
  const certificateUnlocked = await isCertificateUnlocked()
  if (certificateUnlocked) {
    const levelData = await getUserLevelData()
    return {
      xp: levelData?.xp || 0,
      level: levelData?.level || 1,
      levelUp: false,
      xpAdded: 0,
      certificateUnlocked: true
    }
  }

  // Verificar si la actividad ya fue recompensada (si se proporciona activityId)
  if (activityId && isActivityRewarded(activityId)) {
    const levelData = await getUserLevelData()
    return {
      xp: levelData?.xp || 0,
      level: levelData?.level || 1,
      levelUp: false,
      xpAdded: 0,
      alreadyRewarded: true
    }
  }

  const xpToAdd = XP_VALUES[type] || 0
  const oldLevel = currentLevelData?.level || 1
  const newXP = (currentLevelData?.xp || 0) + xpToAdd
  const newLevel = calculateLevel(newXP)

  console.log('[XP WRITE] Origen: Frontend, Endpoint: PUT /users/xp-level, Valor a enviar:', { xp: newXP, level: newLevel })

  // Actualizar en PostgreSQL
  let updatedUser
  try {
    const response = await userAPI.updateXpAndLevel({ xp: newXP, level: newLevel })
    updatedUser = response.data.user
    console.log('[XP WRITE] Resultado guardado en PostgreSQL:', { xp: updatedUser.xp, level: updatedUser.level })
    console.log('[LEVEL WRITE] Resultado guardado en PostgreSQL:', { level: updatedUser.level })
  } catch (error) {
    console.error('[XP WRITE] Error al actualizar en API:', error)
    throw error
  }

  // Actualizar caché
  userLevelDataCache = { xp: updatedUser.xp, level: updatedUser.level }
  userLevelDataCacheExpiry = Date.now()

  // También guardar en localStorage como fallback temporal
  localStorage.setItem(`userProgress_${currentUser.id}`, JSON.stringify({
    xp: updatedUser.xp,
    level: updatedUser.level
  }))

  // Marcar actividad como recompensada si se proporcionó activityId
  if (activityId) {
    markActivityAsRewarded(activityId)
  }

  // Mostrar toast de XP ganada
  if (typeof window !== 'undefined' && window.showToast && xpToAdd > 0) {
    window.showToast('xp', `+${xpToAdd} XP ganada`)
  }

  // Registrar actividad si subió de nivel
  if (newLevel > oldLevel) {
    console.log('[LEVEL WRITE] Level up', {
      oldLevel,
      newLevel
    })
    registerActivity('level_up', '¡Subiste de nivel!', `Nivel ${newLevel}: ${LEVELS[newLevel].name}`)
    
    // Mostrar toast de nivel aumentado solo si se permite y no se ha notificado este nivel
    if (showLevelToast && !isLevelUpNotified(newLevel)) {
      markLevelUpNotified(newLevel)
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('level', `🎊 ¡Nivel ${newLevel}: ${LEVELS[newLevel].name}!`)
      }
    }
  }

  return {
    xp: updatedUser.xp,
    level: updatedUser.level,
    levelUp: newLevel > oldLevel,
    xpAdded: xpToAdd
  }
}

export const getProgressPercentage = (xp, level) => {
  const currentLevelXP = getCurrentLevelXP(level)
  const nextLevelXP = getNextLevelXP(level)
  
  if (level >= 5) return 100
  
  const range = nextLevelXP - currentLevelXP
  const progress = xp - currentLevelXP
  
  return Math.min(Math.max((progress / range) * 100, 0), 100)
}
