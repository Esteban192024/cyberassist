import { motion } from 'framer-motion'
import { Download, Award, Shield, QrCode, CheckCircle2 } from 'lucide-react'
import { generateCertificatePDF } from '../utils/certificateHelper'

const CERTIFICATE_TYPE_LABELS = {
  program: 'Programa Integral de Ciberseguridad',
  diagnostic: 'Diagnostico de Seguridad Digital',
  simulation: 'Simulaciones de Amenazas',
}

function CertificateGenerator({ studentName, type, riskLevel, levelName, xp, date }) {
  const typeLabel = CERTIFICATE_TYPE_LABELS[type] || CERTIFICATE_TYPE_LABELS.program

  const handleDownloadCertificate = async () => {
    try {
      const { fileName } = await generateCertificatePDF(
        studentName,
        type,
        riskLevel,
        levelName,
        xp,
        date
      )

      if (typeof window !== 'undefined' && window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: 'Certificado generado',
          text: `Descargado como ${fileName}`,
          confirmButtonColor: '#2563EB',
        })
      }
    } catch (error) {
      console.error('Error generating certificate:', error)
      if (typeof window !== 'undefined' && window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el certificado. Por favor intenta nuevamente.',
          confirmButtonColor: '#2563EB',
        })
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
    >
      <div className="bg-[#0F172A] px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2563EB]">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Certificado Oficial CyberAssist</h3>
              <p className="text-sm text-slate-300">Credencial verificable de finalizacion</p>
            </div>
          </div>
          <Award className="h-8 w-8 text-[#2563EB]" />
        </div>
      </div>

      <div className="relative border-b border-slate-100 bg-[#1E293B] px-6 py-8 text-center">
        <div className="absolute left-4 top-4 h-16 w-16 rounded-full border border-[#2563EB]/30" />
        <div className="absolute right-4 bottom-4 h-12 w-12 rounded-full border border-[#2563EB]/20" />
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Certificado de Finalizacion
        </p>
        <p className="mb-1 text-2xl font-bold text-white">{studentName}</p>
        <p className="text-sm text-slate-300">{typeLabel}</p>
        <div className="mx-auto mt-4 h-px w-24 bg-[#2563EB]" />
      </div>

      <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        {[
          { label: 'Nivel', value: levelName },
          { label: 'Riesgo', value: riskLevel },
          { label: 'XP', value: xp },
          { label: 'Fecha', value: date },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 text-sm font-bold text-[#0F172A]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
        <QrCode className="h-5 w-5 text-[#2563EB]" />
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-600">Incluye codigo unico y QR de verificacion</p>
          <p className="text-xs text-slate-400">Documento PDF listo para impresion profesional</p>
        </div>
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      </div>

      <div className="p-6 pt-0">
        <button
          onClick={handleDownloadCertificate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-4 font-semibold text-white transition-all duration-200 hover:bg-[#1d4ed8] hover:shadow-lg"
        >
          <Download className="h-5 w-5" />
          <span>Descargar Certificado PDF</span>
        </button>
      </div>
    </motion.div>
  )
}

export default CertificateGenerator
