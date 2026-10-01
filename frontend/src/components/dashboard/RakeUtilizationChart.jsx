import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#2563eb', '#0f172a', '#10b981', '#f59e0b'];

export default function RakeUtilizationChart({ data }) {
  return (
    <div className="chart-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Utilization</p>
          <h3>Rake Utilization</h3>
        </div>
      </div>
      <div className="donut-panel">
        <div className="chart-wrap donut-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="legend-list">
          {data.map((entry, index) => (
            <div key={entry.name} className="legend-item">
              <span className="legend-dot" style={{ background: COLORS[index % COLORS.length] }} />
              <span>{entry.name}</span>
              <strong>{entry.value}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
