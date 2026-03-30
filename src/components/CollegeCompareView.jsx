import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { AlertTriangle, CheckCircle, FileSpreadsheet, Activity, Building, LayoutList } from 'lucide-react';
import { MetricCard } from './SharedUI';

export function CollegeCompareView({ metrics, collegeSummaries }) {
  // Sort colleges for visuals
  const byCourses = [...collegeSummaries].sort((a, b) => b.courseCount - a.courseCount);
  const byScore = [...collegeSummaries].sort((a, b) => b.avgCurrScore - a.avgCurrScore);
  const byErrors = [...collegeSummaries].sort((a, b) => b.currErrors - a.currErrors);
  const byEfficiency = [...collegeSummaries].sort((a, b) => b.efficiency - a.efficiency);

  return (
    <div className="animate-fade-in">
      {/* Top Level KPIs */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 40 }}>
        <MetricCard title="Total Colleges" value={metrics.totalColleges} previousValue={metrics.totalColleges} icon={Building} />
        <MetricCard title="Courses Analyzed" value={metrics.matchedCount} previousValue={metrics.matchedCount} icon={LayoutList} />
        <MetricCard title="Average Score" value={metrics.avgCurrScore} previousValue={metrics.avgBaseScore} icon={CheckCircle} />
        <MetricCard title="Total Errors" value={metrics.totalCurrErrors} previousValue={metrics.totalBaseErrors} inverseGood icon={AlertTriangle} />
        <MetricCard title="Efficiency" value={metrics.currEfficiency} previousValue={metrics.baseEfficiency} icon={Activity} />
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 40 }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20 }}>Number of Courses Found</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={byCourses} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="college" tick={{fill: 'var(--text-muted)', fontSize: 11}} angle={-45} textAnchor="end" />
                <YAxis tick={{fill: 'var(--text-muted)'}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }} />
                <Bar dataKey="courseCount" name="Total Courses" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: 20 }}>Average Score (Current)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={byScore} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="college" tick={{fill: 'var(--text-muted)', fontSize: 11}} angle={-45} textAnchor="end" />
                <YAxis tick={{fill: 'var(--text-muted)'}} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }} formatter={(v) => v.toFixed(1) + '%'} />
                <Bar dataKey="avgCurrScore" name="Avg Score" fill="var(--success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 40 }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20 }}>Total Errors</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={byErrors} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="college" tick={{fill: 'var(--text-muted)', fontSize: 11}} angle={-45} textAnchor="end" />
                <YAxis tick={{fill: 'var(--text-muted)'}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }} />
                <Bar dataKey="currErrors" name="Total Errors" fill="var(--danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: 20 }}>Efficiency (Fixes / Files Reviewed)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={byEfficiency} layout="vertical" margin={{ top: 20, right: 30, left: 50, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" tick={{fill: 'var(--text-muted)'}} />
                <YAxis type="category" dataKey="college" tick={{fill: 'var(--text-muted)', fontSize: 11}} width={80} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }} formatter={(v) => v.toFixed(1) + '%'} />
                <Bar dataKey="efficiency" name="Efficiency" fill="var(--warning)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
