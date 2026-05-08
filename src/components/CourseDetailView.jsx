import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { AlertTriangle, CheckCircle, FileSpreadsheet, Activity, LayoutList, Search, Info } from 'lucide-react';
import { MetricCard, CircularKPICard } from './SharedUI';

export function CourseDetailView({ activeCourse }) {
  if (!activeCourse) return null;

  const historyData = activeCourse.history.map(tick => ({
     label: tick.periodLabel,
     score: tick.score,
     errors: tick.errors
  }));

  const issueData = [
    { name: 'Issues', Errors: activeCourse.currErrors, Suggestions: activeCourse.currSuggestions }
  ];

  const filesData = [
    { name: 'Files Tracker', Scanned: activeCourse.currScanned, Reviewed: activeCourse.currReviewed }
  ];


  let interpretationText = [];
  if (activeCourse.scoreDelta > 0) {
    interpretationText.push(`This course improved its accessibility score by ${activeCourse.scoreDelta.toFixed(1)} points vs the previous reporting period.`);
  } else if (activeCourse.scoreDelta < 0) {
    interpretationText.push(`This course's accessibility score declined by ${Math.abs(activeCourse.scoreDelta).toFixed(1)} points.`);
  } else {
    interpretationText.push(`This course's accessibility score remained strictly unchanged.`);
  }

  if (activeCourse.currDensity > 1) {
    interpretationText.push(`High error density (${activeCourse.currDensity.toFixed(2)} err/file) indicates significant formatting issues distributed across a dense dataset.`);
  } else if (activeCourse.currErrors > 0) {
    interpretationText.push(`A manageable error density (${activeCourse.currDensity.toFixed(2)} err/file) means isolated issues can be resolved rapidly.`);
  } else {
    interpretationText.push(`Excellent zero error density achieved.`);
  }


  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ marginBottom: 40, borderLeft: '4px solid var(--primary)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Search size={24} /> {activeCourse.fullName}
        </h2>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4 }}>
          {activeCourse.college}
        </span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: 40, marginBottom: 40 }}>
        {/* Giant Circular KPI */}
        <div style={{ height: 320 }}>
           <CircularKPICard 
             score={activeCourse.currScore}
             courseName="Latest Accessible Score"
             subLabel={`Bi-Weekly Delta: ${activeCourse.scoreDelta > 0 ? '+' : ''}${activeCourse.scoreDelta.toFixed(1)}`}
             trendVisible={false}
           />
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-2" style={{ gap: 16 }}>
          <MetricCard title="Total Errors" value={activeCourse.currErrors} previousValue={activeCourse.baseErrors} inverseGood icon={AlertTriangle} />
          <MetricCard title="Suggestions" value={activeCourse.currSuggestions} previousValue={activeCourse.baseSuggestions} inverseGood icon={FileSpreadsheet} />
          <MetricCard title="Error Density" value={activeCourse.currDensity} previousValue={activeCourse.baseDensity} inverseGood icon={Activity} />
          <MetricCard title="Files Fixed" value={activeCourse.currFixed} previousValue={activeCourse.baseFixed} icon={CheckCircle} />
        </div>
      </div>

      {/* Interpretation Alert */}
      <div className="glass-panel" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'var(--primary)', marginBottom: 40 }}>
        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Info size={18} color="var(--primary)"/> Analytical Insight</h3>
        <ul style={{ paddingLeft: 20, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {interpretationText.map((text, i) => <li key={i}>{text}</li>)}
        </ul>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 40 }}>
        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: 20 }}>Detailed Score Progression</h3>
          <div style={{ width: '100%', height: 300 }}>
            {historyData.length > 1 ? (
              <ResponsiveContainer>
                <LineChart data={historyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)' }} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }}
                     formatter={(v) => v.toFixed(1) + '%'}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={4} dot={{ r: 5 }} activeDot={{ r: 8 }} name="Course Score" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Need at least 2 reporting periods to track progress.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: 20 }}>Metrics Profile</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={issueData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{fill: 'var(--text-muted)'}} />
                <YAxis tick={{fill: 'var(--text-muted)'}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Bar dataKey="Errors" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Suggestions" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
