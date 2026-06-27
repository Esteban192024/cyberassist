import jsPDF from 'jspdf'
import QRCode from 'qrcode'

const CERTIFICATE_TYPE_LABELS = {
  program: 'Programa Integral de Ciberseguridad',
  diagnostic: 'Diagnostico de Seguridad Digital',
  simulation: 'Simulaciones de Amenazas',
}

const BRAND = {
  primary: [15, 23, 42],
  secondary: [30, 41, 59],
  accent: [37, 99, 235],
  muted: [100, 116, 139],
  light: [248, 250, 252],
  white: [255, 255, 255],
  gold: [212, 175, 55],
}

async function loadLogoDataUrl() {
  try {
    const response = await fetch('/favicon.svg')
    const svgText = await response.text()
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 128
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, 128, 128)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Logo load failed'))
      }
      img.src = url
    })
  } catch {
    return null
  }
}

function drawShieldLogo(pdf, x, y, size) {
  pdf.setFillColor(...BRAND.accent)
  pdf.triangle(x + size / 2, y, x + size, y + size * 0.35, x, y + size * 0.35, 'F')
  pdf.rect(x, y + size * 0.35, size, size * 0.55, 'F')
  pdf.setFillColor(...BRAND.white)
  pdf.setDrawColor(...BRAND.white)
  pdf.setLineWidth(0.8)
  pdf.line(x + size * 0.28, y + size * 0.55, x + size * 0.42, y + size * 0.68)
  pdf.line(x + size * 0.42, y + size * 0.68, x + size * 0.72, y + size * 0.42)
}

export const generateCertificatePDF = async (
  studentName,
  type,
  riskLevel,
  levelName,
  xp,
  date,
  certificateId = null
) => {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const typeLabel = CERTIFICATE_TYPE_LABELS[type] || CERTIFICATE_TYPE_LABELS.program
  const certificateCode =
    certificateId ||
    `CA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  const verificationUrl = `${window.location.origin}/verify/${certificateCode}`

  pdf.setFillColor(...BRAND.light)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')

  pdf.setFillColor(...BRAND.primary)
  pdf.rect(0, 0, pageWidth, 28, 'F')

  pdf.setDrawColor(...BRAND.accent)
  pdf.setLineWidth(1.2)
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20)

  pdf.setDrawColor(...BRAND.gold)
  pdf.setLineWidth(0.4)
  pdf.rect(12, 12, pageWidth - 24, pageHeight - 24)

  const logoDataUrl = await loadLogoDataUrl()
  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, 'PNG', 16, 6, 16, 16)
  } else {
    drawShieldLogo(pdf, 16, 6, 16)
  }

  pdf.setTextColor(...BRAND.white)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CyberAssist', 35, 14)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Plataforma de Concientizacion en Ciberseguridad', 35, 20)

  pdf.setFontSize(9)
  pdf.text('Universidad Nacional de Chimborazo', pageWidth - 30, 14, { align: 'right' })
  pdf.text('Facultad de Ingeniería', pageWidth - 30, 20, { align: 'right' })

  pdf.setTextColor(...BRAND.primary)
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CERTIFICADO DE FINALIZACION', pageWidth / 2, 52, { align: 'center' })

  pdf.setDrawColor(...BRAND.accent)
  pdf.setLineWidth(0.6)
  pdf.line(pageWidth / 2 - 55, 57, pageWidth / 2 + 55, 57)

  pdf.setTextColor(...BRAND.muted)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Se certifica que', pageWidth / 2, 68, { align: 'center' })

  pdf.setTextColor(...BRAND.primary)
  pdf.setFontSize(26)
  pdf.setFont('helvetica', 'bold')
  pdf.text(studentName.toUpperCase(), pageWidth / 2, 82, { align: 'center' })

  pdf.setTextColor(...BRAND.secondary)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  const bodyText = `ha completado satisfactoriamente el ${typeLabel}, demostrando competencias en seguridad digital y gestion de riesgos informaticos.`
  pdf.text(bodyText, pageWidth / 2, 94, { align: 'center', maxWidth: pageWidth - 80 })

  pdf.setFillColor(...BRAND.white)
  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.5)
  pdf.roundedRect(24, 104, pageWidth - 48, 28, 2, 2, 'FD')

  pdf.setTextColor(...BRAND.secondary)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('NIVEL ALCANZADO', 32, 112)
  pdf.text('RIESGO DIGITAL', 32 + 62, 112)
  pdf.text('EXPERIENCIA (XP)', 32 + 124, 112)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(levelName, 32, 120)
  pdf.text(riskLevel, 32 + 62, 120)
  pdf.text(String(xp), 32 + 124, 120)

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('FECHA DE EMISION', 32, 126)
  pdf.text('CODIGO DE VERIFICACION', 32 + 62, 126)
  pdf.setFont('helvetica', 'normal')
  pdf.text(date, 32, 130)
  pdf.setTextColor(...BRAND.accent)
  pdf.setFont('helvetica', 'bold')
  pdf.text(certificateCode, 32 + 62, 130)

  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 200,
    margin: 1,
    color: { dark: '#0F172A', light: '#FFFFFF' },
  })
  pdf.addImage(qrDataUrl, 'PNG', pageWidth - 52, 104, 24, 24)
  pdf.setTextColor(...BRAND.muted)
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Escanear para verificar', pageWidth - 40, 130, { align: 'center' })

  const signatureY = pageHeight - 38

  pdf.setDrawColor(...BRAND.muted)
  pdf.setLineWidth(0.3)
  pdf.line(40, signatureY, 95, signatureY)
  pdf.line(pageWidth - 95, signatureY, pageWidth - 40, signatureY)

  pdf.setTextColor(...BRAND.secondary)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.text('FIRMA DIGITAL INSTITUCIONAL', 67.5, signatureY + 5, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text('Director Academico - UNACH', 67.5, signatureY + 10, { align: 'center' })
  pdf.text('CyberAssist Certification Authority', 67.5, signatureY + 14, { align: 'center' })

  pdf.setFont('helvetica', 'bold')
  pdf.text('TITULAR', pageWidth - 67.5, signatureY + 5, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.text(studentName, pageWidth - 67.5, signatureY + 10, { align: 'center' })
  pdf.text('Participante Certificado', pageWidth - 67.5, signatureY + 14, { align: 'center' })

  pdf.setFillColor(...BRAND.accent)
  pdf.circle(pageWidth - 18, 18, 6, 'F')
  pdf.setTextColor(...BRAND.white)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CA', pageWidth - 18, 20, { align: 'center' })

  pdf.setTextColor(...BRAND.muted)
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.text(
    'Documento verificable electronicamente. Codigo unico: ' + certificateCode,
    pageWidth / 2,
    pageHeight - 14,
    { align: 'center' }
  )

  const fileName = `Certificado_CyberAssist_${studentName.replace(/\s+/g, '_')}_${Date.now()}.pdf`
  pdf.save(fileName)
  return { fileName, certificateCode }
}

export const generateCertificateCode = () =>
  `CA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
