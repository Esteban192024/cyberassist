import { CheckCircle, AlertTriangle } from 'lucide-react'

const VARIANTS = {
  strength: {
    badge: 'bg-green-50 text-green-800 border-green-200',
    icon: CheckCircle,
    iconClass: 'text-green-600',
  },
  weakness: {
    badge: 'bg-red-50 text-red-800 border-red-200',
    icon: AlertTriangle,
    iconClass: 'text-red-600',
  },
}

function TopicBadges({ topics, variant = 'strength', keyPrefix = 'topic' }) {
  if (!topics?.length) return null

  const { badge, icon: Icon, iconClass } = VARIANTS[variant] || VARIANTS.strength

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
      {topics.map((topic, index) => (
        <span
          key={`${keyPrefix}-${topic}-${index}`}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border ${badge}`}
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />
          <span className="leading-tight">{topic}</span>
        </span>
      ))}
    </div>
  )
}

export default TopicBadges
