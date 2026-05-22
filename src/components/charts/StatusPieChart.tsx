import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ComplianceRow } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  'Active':   '#22c55e',
  'Due Soon': '#f59e0b',
  'Overdue':  '#ef4444',
  'Expired':  '#6b7280',
  'Pending':  '#3b82f6',
}

interface StatusPieChartProps {
  data: ComplianceRow[]
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  const counts = data.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-48 text-sm text-slate-400">No data</div>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: '#64748b' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
