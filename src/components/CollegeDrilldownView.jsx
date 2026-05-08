import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { AlertTriangle, CheckCircle, FileSpreadsheet, Activity, Building, LayoutList, Search } from 'lucide-react';
import { MetricCard } from './SharedUI';

export function CollegeDrilldownView({ collegeSummary, filteredCourses }) {
  
  const byErrors = [...filteredCourses].sort((a, b) => b.currErrors - a.currErrors).slice(0, 20); // Top 20 max to avoid crowding

  const colors = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--danger)', '#ec4899', '#8b5cf6', '#06b6d4'];

  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
          <div style={{ marginBottom: 8, color: 'var(--text-main)', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-muted)' }}>Course : </span>{data.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.9rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Errors : </span><span style={{ fontWeight: 600, color: 'var(--danger)' }}>{data.currErrors}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Score : </span><span style={{ fontWeight: 600, color: 'var(--success)' }}>{data.currScore.toFixed(1)}%</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!collegeSummary) return null;

  return (
    <div className="animate-fade-in">
      {/* Top Level KPIs */}
      <div className="grid grid-cols-4" style={{ marginBottom: 40 }}>
        <div className="glass-panel metric-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span className="metric-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Building size={16}/> College</span>
          <div className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.8rem', lineHeight: 1.2, marginTop: 4 }}>
            {collegeSummary.college}
          </div>
        </div>
        <MetricCard title="Courses Analyzed" value={collegeSummary.courseCount} previousValue={collegeSummary.courseCount} icon={LayoutList} hideDelta={true} />
        <MetricCard title="Average Score" value={collegeSummary.avgCurrScore} previousValue={collegeSummary.avgBaseScore} icon={CheckCircle} />
        <MetricCard title="Total Errors" value={collegeSummary.currErrors} previousValue={collegeSummary.baseErrors} inverseGood icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 40 }}>
        <MetricCard title="Average Delta" value={collegeSummary.avgScoreDelta} previousValue={0} icon={Activity} />
        <MetricCard title="Total Suggestions" value={collegeSummary.currSuggestions} previousValue={collegeSummary.baseSuggestions} inverseGood icon={FileSpreadsheet} />
        <MetricCard title="Efficiency" value={collegeSummary.efficiency} previousValue={collegeSummary.baseEfficiency} icon={CheckCircle} />
      </div>

      <div className="grid grid-cols-1" style={{ marginBottom: 40 }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20 }}>Errors vs Score (Correlation)</h3>
          <div style={{ width: '100%', height: 350 }}>
             <ResponsiveContainer>
                <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" dataKey="currErrors" name="Errors" tick={{fill: 'var(--text-muted)'}} label={{ value: 'Total Errors', position: 'insideBottom', offset: -10, fill: 'var(--text-muted)' }} />
                  <YAxis type="number" dataKey="currScore" name="Score" domain={[0, 100]} tick={{fill: 'var(--text-muted)'}} label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', offset: -10, fill: 'var(--text-muted)' }} />
                  <ZAxis type="category" dataKey="name" name="Course" />
                  <Tooltip 
                    cursor={{strokeDasharray: '3 3'}}
                    content={<CustomScatterTooltip />}
                  />
                  <Scatter data={filteredCourses} fill="var(--warning)" opacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1" style={{ marginBottom: 40 }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20 }}>Course Score Shift (Current vs Previous)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
            Highlights the net change in accessibility score from the previous reporting period.
          </p>
          <div style={{ width: '100%', height: 700 }}>
            <ResponsiveContainer>
              <BarChart data={filteredCourses} margin={{ top: 20, right: 30, left: 0, bottom: 250 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{fill: 'var(--text-muted)', fontSize: 11}} angle={-75} textAnchor="end" />
                <YAxis tick={{fill: 'var(--text-muted)'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }} 
                  formatter={(v) => (v > 0 ? '+' : '') + v.toFixed(1) + ' pts'}
                />
                <Bar dataKey="scoreDelta" name="Score Shift" radius={[4, 4, 4, 4]}>
                  {filteredCourses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.scoreDelta > 0 ? 'var(--success)' : (entry.scoreDelta < 0 ? 'var(--danger)' : 'rgba(255,255,255,0.1)')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
