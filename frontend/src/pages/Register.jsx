import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Mail, User, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!fullName.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (!email.trim()) {
      setError('El email es requerido')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    const result = await register(email, password, fullName)

    if (result.success) {
      navigate('/student')
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  const handleBackToLogin = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
            <Shield className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            CyberAssist
          </h1>
          <p className="text-white/80 text-center text-sm mb-8">
            Plataforma de Diagnóstico de Ciberseguridad
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-white font-medium text-sm flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Nombre completo</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                placeholder="Ingresa tu nombre completo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-white font-medium text-sm flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Correo electrónico</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                placeholder="Ingresa tu correo electrónico"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-white font-medium text-sm flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Contraseña</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                placeholder="Ingresa tu contraseña (mínimo 6 caracteres)"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-white font-medium text-sm flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Confirmar contraseña</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                placeholder="Confirma tu contraseña"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full py-3 bg-transparent border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al login</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-white/60 text-center text-xs mt-8">
          © 2024 CyberAssist. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

export default Register