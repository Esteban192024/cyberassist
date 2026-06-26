import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Star, TrendingUp, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { generateUniqueId } from '../utils/quizHelper'

const MAX_VISIBLE_TOASTS = 3

const Toast = ({ type, message, onClose, duration = 3000, index }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getToastConfig = () => {
    switch (type) {
      case 'achievement':
        return {
          icon: <Star className="w-5 h-5" />,
          bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
          textColor: 'text-white'
        }
      case 'xp':
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          textColor: 'text-white'
        }
      case 'level':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
          textColor: 'text-white'
        }
      default:
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bgColor: 'bg-gray-800',
          textColor: 'text-white'
        }
    }
  }

  const config = getToastConfig()

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ 
        type: 'spring', 
        damping: 25, 
        stiffness: 300,
        delay: index * 0.1
      }}
      className={`${config.bgColor} ${config.textColor} px-6 py-4 rounded-xl shadow-xl flex items-center space-x-3 min-w-[300px] max-w-md`}
    >
      <div className="flex-shrink-0">
        {config.icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

const ToastContainer = () => {
  const [toasts, setToasts] = useState([])
  const [queue, setQueue] = useState([])

  const addToast = (type, message, duration = 3000) => {
    // Verificar si ya existe un toast idéntico en cola o visible
    const isDuplicate = [...toasts, ...queue].some(
      toast => toast.type === type && toast.message === message
    )
    
    if (isDuplicate) {
      return // No agregar toast duplicado
    }
    
    const id = generateUniqueId()
    const newToast = { id, type, message, duration }
    
    setToasts(prev => {
      if (prev.length < MAX_VISIBLE_TOASTS) {
        return [...prev, newToast]
      }
      return prev
    })
    
    if (toasts.length >= MAX_VISIBLE_TOASTS) {
      setQueue(prev => [...prev, newToast])
    }
  }

  const removeToast = (id) => {
    setToasts(prev => {
      const filtered = prev.filter(toast => toast.id !== id)
      
      // Si hay toasts en cola, agregar el siguiente
      if (filtered.length < MAX_VISIBLE_TOASTS && queue.length > 0) {
        const nextToast = queue[0]
        setQueue(prev => prev.slice(1))
        return [...filtered, nextToast]
      }
      
      return filtered
    })
  }

  const addToastRef = useRef(addToast)

  useEffect(() => {
    addToastRef.current = addToast
  }, [addToast])

  // Exponer función globalmente
  useEffect(() => {
    window.showToast = (...args) => addToastRef.current(...args)
  }, [])

  return (
    <div className="fixed top-24 right-6 z-50 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast, index) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ 
                type: 'spring', 
                damping: 25, 
                stiffness: 300,
                delay: index * 0.05
              }}
            >
              <Toast
                type={toast.type}
                message={toast.message}
                onClose={() => removeToast(toast.id)}
                duration={toast.duration}
                index={index}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ToastContainer
