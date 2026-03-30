import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { AlertTriangle, CheckCircle, FileSpreadsheet, Activity, LayoutList, Search, Info } from 'lucide-react';
import { MetricCard } from './SharedUI';

export function CourseDetailView({ activeCourse }) {
  if (!activeCourse) return null;

  const scoreData = [
    { name: 'Accessibility Score', Baseline: activeCourse.baseScore, Current: activeCourse.currScore }
  ];

  const issueData = [
    { name: 'Issues', Errors: activeCourse.currErrors, Suggestions: activeCourse.currSuggestions }
  ];

  const filesData = [
    { name: 'Files Tracker', Scanned: activeCourse.currScanned, Reviewed: activeCourse.currReviewed }
  ];


  let interpretationText = [];
  if (activeCourse.scoreDelta > 0) {
    interpretationText.push(`This course improved its accessibility score by ${activeCourse.scoreDelta.toFixed(1)} points from the baseline.`);
  } else if (activeCourse.scoreDelta < 0) {
    interpretationText.push(`This course's accessibility score declined by ${Math.abs(activeCourse.scoreDelta).toFixed(1)} points.`);
  } else {
    interpretationText.push(`This course's accessibility score remained unchanged.`);
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

      <div className="grid grid-cols-4" style={{ marginBottom: 40 }}>
        <MetricCard title="Current Score" value={activeCourse.currScore} previousValue={activeCourse.baseScore} icon={CheckCircle} />
        <MetricCard title="Total Errors" value={activeCourse.currErrors} previousValue={activeCourse.baseErrors} inverseGood icon={AlertTriangle} />
        <MetricCard title="Suggestions" value={activeCourse.currSuggestions} previousValue={activeCourse.baseSuggestions} inverseGood icon={FileSpreadsheet} />
        <MetricCard title="Error Density" value={activeCourse.currDensity} previousValue={activeCourse.baseDensity} inverseGood icon={Activity} />
      </div>

      {/* Interpretation Alert */}
      <div className="glass-panel" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'var(--primary)', marginBottom: 40 }}>
        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Info size={18} color="var(--primary)"/> Analytical Insight</h3>
        <ul style={{ paddingLeft: 20, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {interpretationText.map((text, i) => <li key={i}>{text}</li>)}
        </ul>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 40 }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20 }}>Score Progression</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={scoreData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{fill: 'var(--text-muted)'}} />
                <YAxis domain={[0, 100]} tick={{fill: 'var(--text-muted)'}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Bar dataKey="Baseline" fill="var(--secondary)" opacity={0.6} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Current" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: 20 }}>Issues vs Suggestions</h3>
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

        <div className="glass-panel">
          <h3 style={{ marginBottom: 20 }}>Files Reviewed vs Scanned</h3>
          <div style={{ width: '100%', height: 300 }}>
             <ResponsiveContainer>
              <BarChart data={filesData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{fill: 'var(--text-muted)'}} />
                <YAxis tick={{fill: 'var(--text-muted)'}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Bar dataKey="Reviewed" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Scanned" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
