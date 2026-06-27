import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Zap } from 'lucide-react'
import { 
  getUserLevelData, 
  getLevelInfo, 
  getNextLevelXP, 
  getProgressPercentage 
} from '../utils/levelHelper'

function UserLevelCard() {
  const [levelData] = useState(() => getUserLevelData())
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (levelData && showAnimation) {
      const timer = setTimeout(() => setShowAnimation(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showAnimation, levelData])

  if (!levelData) return null

  const levelInfo = getLevelInfo(levelData.level)
  const nextLevelXP = getNextLevelXP(levelData.level)
  const progress = getProgressPercentage(levelData.xp, levelData.level)
  const isMaxLevel = levelData.level >= 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Level Up Animation */}
      {showAnimation && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-6xl mb-2"
            >
              🎉
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold"
            >
              ¡Nivel {levelData.level}!
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm"
            >
              {levelInfo.name}
            </motion.p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-0">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">{levelInfo.icon}</div>
          <div>
            <p className="text-sm font-medium text-white/80">Nivel {levelData.level}</p>
            <p className="text-xl font-bold">{levelInfo.name}</p>
          </div>
        </div>
        <Trophy className="w-8 h-8 text-yellow-300" />
      </div>

      {/* XP Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 relative z-0">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">XP Actual</span>
          </div>
          <p className="text-2xl font-bold">{levelData.xp}</p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isMaxLevel ? 'Nivel Máximo' : 'Siguiente Nivel'}
            </span>
          </div>
          <p className="text-2xl font-bold">
            {isMaxLevel ? '∞' : nextLevelXP}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progreso</span>
          <span className="text-sm font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full relative"
          >
            <motion.div
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        </div>
        {!isMaxLevel && (
          <p className="text-xs text-white/70 mt-2">
            {nextLevelXP - levelData.xp} XP restantes para el nivel {levelData.level + 1}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default UserLevelCard
