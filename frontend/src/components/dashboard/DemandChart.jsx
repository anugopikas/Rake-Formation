import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function DemandChart({ data, loading = false, notice = '' }) {
  return (
    <div className="chart-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">AI Demand Forecast</p>
          <h3>Demand Forecast</h3>
        </div>
      </div>
      {notice ? <p className="dashboard-data-notice">{notice}</p> : null}
      {loading ? (
        <div className="chart-loading" role="status" aria-label="Loading demand forecast">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dfe7f3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => Number(value).toLocaleString()}
              />
              <Tooltip
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value, name) => [Number(value).toLocaleString(), name]}
                contentStyle={{ borderRadius: 10, borderColor: '#dfe7f3' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
                name="Actual Demand"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#0f172a"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Forecast Demand"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="chart-caption">Forecast based on historical order and inventory patterns.</p>
    </div>
  );
}
