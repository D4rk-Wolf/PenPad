'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DailySignup } from '@/app/actions/admin'

interface SignupChartProps {
  data: DailySignup[]
}

export function SignupChart({ data }: SignupChartProps) {
  const formatted = data.map(d => ({
    signups: d.signups,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    }),
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10.5, fill: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}
          tickLine={false}
          axisLine={false}
          interval={6}
        />
        <YAxis
          tick={{ fontSize: 10.5, fill: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={28}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-elev)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '12px',
            padding: '6px 10px',
            boxShadow: 'var(--shadow-sm)',
          }}
          labelStyle={{ color: 'var(--fg-muted)', marginBottom: '2px', fontFamily: 'var(--font-mono)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          itemStyle={{ color: 'var(--fg)', fontWeight: 600 }}
          cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="signups"
          stroke="#b91c1c"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, fill: '#b91c1c', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
