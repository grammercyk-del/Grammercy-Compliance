import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, parseISO, isValid, startOfMonth, addMonths } from 'date-fns'
import type { ComplianceRow } from '@/types'

interface RenewalBarChartProps {
  data: ComplianceRow[]
}

export function RenewalBarChart({ data }: RenewalBarChartProps) {
  // Group renewals by month for next 6 months
  const today = new Date()
  const months: { label: string; start: Date; end: Date; count: number }[] = []

  for (let i = 0; i < 6; i++) {
    const start = startOfMonth(addMonths(today, i))
    const end = startOfMonth(addMonths(today, i + 1))
    months.push({ label: format(start, 'MMM yy'), start, end, count: 0 })
  }

  data.forEach((r) => {
    if (!r.next_renewal_date) return
    try {
      const d = parseISO(r.next_renewal_date)
      if (!isValid(d)) return
      const idx = months.findIndex((m) => d >= m.start && d < m.end)
      if (idx !== -1) months[idx].count++
    } catch { /* noop */ }
  })

  const chartData = months.map(({ label, count }) => ({ label, count }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: 12 }}
          cursor={{ fill: '#f1f5f9' }}
        />
        <Bar dataKey="count" name="Renewals" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
