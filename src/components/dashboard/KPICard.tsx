interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  color: 'cyan' | 'green' | 'orange' | 'purple';
}

const colorClasses = {
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-400',
    value: 'text-cyan-400',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: 'text-green-400',
    value: 'text-green-400',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: 'text-orange-400',
    value: 'text-orange-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    value: 'text-purple-400',
  },
};

export default function KPICard({ title, value, subtitle, trend, icon, color }: KPICardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-6 transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors.bg} ${colors.icon}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={trend.isPositive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}
              />
            </svg>
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      <p className="text-slate-400 text-sm mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colors.value}`}>{value}</p>
      {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}
