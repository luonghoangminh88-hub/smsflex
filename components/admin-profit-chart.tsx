"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ChartData {
  date: string
  revenue: number
  profit: number
}

export function AdminProfitChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value: number) => `${value.toLocaleString("vi-VN")}đ`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(217, 91%, 60%)"
          strokeWidth={2.5}
          name="Doanh thu"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="hsl(142, 71%, 45%)"
          strokeWidth={2.5}
          name="Lợi nhuận"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
