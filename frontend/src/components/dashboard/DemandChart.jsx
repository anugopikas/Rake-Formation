import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function DemandChart({ data }) {
  return (
    <div className="chart-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Forecast</p>
          <h3>Demand Forecast</h3>
        </div>
      </div>
      {data.length ? <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="historicalFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="forecastFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dfe7f3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="historical" stroke="#2563eb" fill="url(#historicalFill)" strokeWidth={2.5} name="Historical Demand" />
            <Area type="monotone" dataKey="forecast" stroke="#0f172a" fill="url(#forecastFill)" strokeWidth={2.5} name="Forecast Demand" />
          </AreaChart>
        </ResponsiveContainer>
      </div> : <div className="chart-empty">Forecast data is not available from the connected API yet.</div>}
    </div>
  );
}
