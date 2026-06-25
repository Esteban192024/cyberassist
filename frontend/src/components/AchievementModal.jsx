import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy } from 'lucide-react'

function AchievementModal({ achievement, onClose, isOpen }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen && achievement) {
      setIsVisible(true)
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, achievement])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  if (!achievement) return null

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-500 to-gray-600'
      case 'rare':
        return 'from-blue-500 to-blue-600'
      case 'epic':
        return 'from-purple-500 to-purple-600'
      case 'legendary':
        return 'from-yellow-500 to-orange-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getRarityBadge = (rarity) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-600'
      case 'rare':
        return 'bg-blue-100 text-blue-600'
      case 'epic':
        return 'bg-purple-100 text-purple-600'
      case 'legendary':
        return 'bg-yellow-100 text-yellow-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ 
                type: 'spring',
                damping: 20,
                stiffness: 300
              }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>

              {/* Content */}
              <div className="text-center">
                {/* Celebration Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.2,
                    type: 'spring',
                    damping: 15,
                    stiffness: 200
                  }}
                  className="w-24 h-24 mx-auto mb-6 relative"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(achievement.rarity)} rounded-full blur-xl opacity-30`} />
                  <div className={`relative w-full h-full bg-gradient-to-br ${getRarityColor(achievement.rarity)} rounded-full flex items-center justify-center`}>
                    <span className="text-5xl">{achievement.icon}</span>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4"
                >
                  <div className="inline-flex items-center space-x-2 mb-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getRarityBadge(achievement?.rarity)}`}>
                      {achievement?.rarity
                        ? achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)
                        : 'Común'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🎉 Nuevo logro desbloqueado
                  </h2>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {achievement.name}
                  </h3>
                </motion.div>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 mb-8"
                >
                  {achievement.description}
                </motion.p>

                {/* Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleClose}
                  className={`w-full py-4 bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200`}
                >
                  Continuar
                </motion.button>
              </div>

              {/* Confetti Effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: '50%', 
                      y: '50%', 
                      scale: 0,
                      opacity: 1
                    }}
                    animate={{
                      x: `${Math.random() * 100}%`,
                      y: `${Math.random() * 100}%`,
                      scale: 1,
                      opacity: 0
                    }}
                    transition={{
                      delay: 0.3 + i * 0.05,
                      duration: 1.5,
                      ease: 'easeOut'
                    }}
                    className="absolute w-2 h-2"
                    style={{
                      backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)]
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AchievementModal
