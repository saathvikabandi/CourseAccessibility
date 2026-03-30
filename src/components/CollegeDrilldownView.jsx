import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { AlertTriangle, CheckCircle, FileSpreadsheet, Activity, Building, LayoutList, Search } from 'lucide-react';
import { MetricCard } from './SharedUI';

export function CollegeDrilldownView({ collegeSummary, filteredCourses }) {
  // Sort courses for charts
  const topDelta = [...filteredCourses].filter(c => c.scoreDelta !== 0).sort((a, b) => b.scoreDelta - a.scoreDelta);
  const byErrors = [...filteredCourses].sort((a, b) => b.currErrors - a.currErrors).slice(0, 20); // Top 20 max to avoid crowding

  // Group for scatter payload natively expected by Recharts
  const scatterData = [{ college: collegeSummary?.college || 'College', courses: filteredCourses }];

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
        <MetricCard title="Courses Analyzed" value={collegeSummary.courseCount} previousValue={collegeSummary.courseCount} icon={LayoutList} />
        <MetricCard title="Average Score" value={collegeSummary.avgCurrScore} previousValue={collegeSummary.avgBaseScore} icon={CheckCircle} />
        <MetricCard title="Total Errors" value={collegeSummary.currErrors} previousValue={collegeSummary.baseErrors} inverseGood icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 40 }}>
        <MetricCard title="Average Delta" value={collegeSummary.avgScoreDelta} previousValue={0} icon={Activity} />
        <MetricCard title="Total Suggestions" value={collegeSummary.currSuggestions} previousValue={collegeSummary.baseSuggestions} inverseGood icon={FileSpreadsheet} />
        <MetricCard title="Efficiency" value={collegeSummary.efficiency} previousValue={collegeSummary.baseEfficiency} icon={CheckCircle} />
      </div>

      <div className="glass-panel" style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 20 }}>Score Shift Progress (Course Deltas)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          Net change in accessibility score per course.
        </p>
        <div style={{ width: '100%', height: 350 }}>
          {topDelta.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={topDelta} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{fill: 'var(--text-muted)', fontSize: 11}} angle={-45} textAnchor="end" />
                <YAxis tick={{fill: 'var(--text-muted)'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  formatter={(value) => [(value > 0 ? '+' : '') + value.toFixed(1) + '%', 'Score Difference']}
                />
                <Bar dataKey="scoreDelta" name="Score Difference" radius={[4, 4, 0, 0]}>
                  {topDelta.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.scoreDelta > 0 ? 'var(--success)' : (entry.scoreDelta < 0 ? 'var(--danger)' : 'var(--text-muted)')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No score shifts recorded for this college.
            </div>
          )}
        </div>
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
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }} 
                    cursor={{strokeDasharray: '3 3'}}
                    formatter={(v, n) => [v, n === 'currErrors' ? 'Errors' : 'Score']}
                  />
                  <Scatter data={filteredCourses} fill="var(--warning)" opacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'auto', marginBottom: 40 }}>
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={20} color="var(--primary)" /> Course Progress Detail
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Base Score</th>
              <th>Curr Score</th>
              <th>Delta</th>
              <th>Errors</th>
              <th>Suggestions</th>
              <th>Fixed</th>
              <th>Scanned (Cnt)</th>
              <th>Reviewed (Fl)</th>
              <th>Density</th>
              <th>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {[...filteredCourses].sort((a, b) => b.currErrors - a.currErrors).map((course, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 500 }} title={course.fullName}>{course.name}</td>
                <td>{course.baseScore.toFixed(0)}%</td>
                <td style={{ fontWeight: 600 }}>{course.currScore.toFixed(0)}%</td>
                <td className={course.scoreDelta > 0 ? 'delta-positive' : (course.scoreDelta < 0 ? 'delta-negative' : 'delta-neutral')}>
                  {course.scoreDelta > 0 ? '+' : ''}{course.scoreDelta.toFixed(1)}
                </td>
                <td style={{ color: course.currErrors > 50 ? 'var(--danger)' : 'inherit' }}>{course.currErrors}</td>
                <td>{course.currSuggestions}</td>
                <td>{course.currFixed}</td>
                <td>{course.currContentScanned}</td>
                <td>{course.currReviewed}</td>
                <td style={{ color: course.currDensity > 1 ? 'var(--danger)' : 'inherit' }}>{course.currDensity.toFixed(2)}</td>
                <td>{course.currReviewed > 0 ? ((course.currFixed / course.currReviewed) * 100).toFixed(1) + '%' : '0%'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
