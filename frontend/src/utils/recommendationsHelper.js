// Sistema de recomendaciones dinámicas basadas en respuestas incorrectas

const RECOMMENDATIONS_MAP = {
  q1: {
    topic: 'Contraseñas',
    icon: '🔐',
    recommendations: [
      'Utiliza un gestor de contraseñas como Bitwarden, LastPass o 1Password',
      'Crea contraseñas únicas para cada cuenta con mínimo 12 caracteres',
      'Incluye mayúsculas, minúsculas, números y caracteres especiales',
      'Nunca reutilices contraseñas entre diferentes servicios',
      'Activa la verificación en dos pasos donde sea posible'
    ]
  },
  q2: {
    topic: 'Autenticación 2FA',
    icon: '🔑',
    recommendations: [
      'Activa la autenticación de dos factores en todas tus cuentas importantes',
      'Usa una app autenticadora (Google Authenticator, Authy) en lugar de SMS',
      'Configura códigos de recuperación seguros',
      'Prioriza 2FA en correo, banca y redes sociales',
      'Revisa regularmente los dispositivos conectados a tus cuentas'
    ]
  },
  q3: {
    topic: 'Actualizaciones',
    icon: '💻',
    recommendations: [
      'Configura actualizaciones automáticas en tu sistema operativo',
      'Mantén actualizado tu navegador web y aplicaciones',
      'No ignores las alertas de seguridad de Windows/Mac',
      'Actualiza drivers y firmware regularmente',
      'Revisa el historial de actualizaciones mensualmente'
    ]
  },
  q4: {
    topic: 'Phishing',
    icon: '📧',
    recommendations: [
      'Verifica siempre el remitente antes de hacer clic en enlaces',
      'Usa herramientas de análisis de URLs antes de visitar sitios sospechosos',
      'Nunca descargues adjuntos de correos desconocidos',
      'Desconfía de correos con urgencia o que pidan información sensible',
      'Reporta correos de phishing a tu proveedor de correo'
    ]
  },
  q5: {
    topic: 'Antivirus',
    icon: '🛡️',
    recommendations: [
      'Instala un antivirus confiable (Windows Defender, Kaspersky, Norton)',
      'Mantén el antivirus actualizado con las últimas definiciones',
      'Realiza escaneos completos del sistema semanalmente',
      'Activa la protección en tiempo real',
      'Configura escaneos automáticos de archivos descargados'
    ]
  },
  q6: {
    topic: 'Copias de Seguridad',
    icon: '💾',
    recommendations: [
      'Realiza copias de seguridad de tus datos importantes semanalmente',
      'Usa la regla 3-2-1: 3 copias, 2 tipos de almacenamiento, 1 en la nube',
      'Considera servicios como Google Drive, Dropbox o OneDrive',
      'Verifica que tus copias de seguridad funcionen correctamente',
      'Encripta información sensible en tus copias de seguridad'
    ]
  }
}

export const generatePersonalizedRecommendations = (answers, questions) => {
  const personalizedRecommendations = []

  questions.forEach(question => {
    const answer = answers[question.id]
    
    // Considerar incorrecto si la respuesta no es "siempre" (o "nunca" para preguntas invertidas)
    const isIncorrect = question.inverted
      ? answer !== 'nunca'
      : answer !== 'siempre'

    if (isIncorrect && answer !== '') {
      const recommendationData = RECOMMENDATIONS_MAP[question.id]
      if (recommendationData) {
        personalizedRecommendations.push({
          questionId: question.id,
          topic: recommendationData.topic,
          icon: recommendationData.icon,
          answer: answer,
          recommendations: recommendationData.recommendations
        })
      }
    }
  })

  return personalizedRecommendations
}

export const getGeneralRecommendations = (riskLevel) => {
  const generalRecs = {
    Bajo: [
      'Mantén tus buenas prácticas de seguridad',
      'Continúa actualizando tus sistemas regularmente',
      'Sigue utilizando autenticación de dos factores',
      'Realiza auditorías de seguridad periódicas',
    ],
    Medio: [
      'Mejora tus contraseñas usando un gestor de contraseñas',
      'Activa la autenticación de dos factores en todas tus cuentas',
      'Revisa los permisos de tus aplicaciones móviles',
      'Mantén tu antivirus actualizado',
    ],
    Alto: [
      'URGENTE: Refuerza tus contraseñas y activa MFA en todas tus cuentas',
      'No abras enlaces ni adjuntos de correos desconocidos',
      'Instala y configura un antivirus confiable',
      'Desconfía de mensajes con urgencia o premios inesperados',
      'Actualiza tu sistema operativo y aplicaciones',
      'Evita compartir credenciales o códigos de verificación',
    ],
  }

  return generalRecs[riskLevel] || []
}
