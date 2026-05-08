import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function MetricCard({ title, value, previousValue, inverseGood = false, icon: Icon, deltaLabel = "vs previous", hideDelta = false }) {
  const delta = value - previousValue;
  const isPositive = delta > 0;
  const isZero = delta === 0;
  
  let isGood = isPositive;
  if (inverseGood) {
    isGood = !isPositive;
  }
  
  if (isZero) isGood = null;

  return (
    <div className="glass-panel metric-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="metric-label">{title}</span>
        {Icon && <Icon size={18} color="var(--primary)" />}
      </div>
      <div className="metric-value">
        {typeof value === 'number' && !Number.isInteger(value) 
          ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
          : value.toLocaleString()}
      </div>
      {!hideDelta && (
        <div className="metric-delta">
          <span className={isZero ? 'delta-neutral' : (isGood ? 'delta-positive' : 'delta-negative')}>
            {isPositive ? '+' : ''}
            {typeof delta === 'number' && !Number.isInteger(delta) 
              ? delta.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
              : delta.toLocaleString()}
          </span>
          <span style={{ color: 'var(--text-muted)' }}> {deltaLabel}</span>
        </div>
      )}
    </div>
  );
}

export function CircularKPICard({ score, courseName, subLabel, trendVisible = false, trendDelta = 0 }) {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: Math.max(0, 100 - score) }
  ];

  const isGood = score >= 85;
  const isWarning = score >= 70 && score < 85;
  const strokeColor = isGood ? 'var(--success)' : (isWarning ? 'var(--warning)' : 'var(--danger)');

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '24px 16px', position: 'relative', height: '100%' }}>
      <div style={{ width: 110, height: 110, position: 'relative', marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
             <Pie
               data={data}
               innerRadius="75%"
               outerRadius="100%"
               startAngle={90}
               endAngle={-270}
               dataKey="value"
               stroke="none"
             >
               <Cell fill={strokeColor} />
               <Cell fill="rgba(255,255,255,0.05)" />
             </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
           <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>{score.toFixed(0)}<span style={{ fontSize: '1rem' }}>%</span></span>
        </div>
      </div>
      
      <h4 style={{ margin: 0, textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={courseName}>
        {courseName}
      </h4>
      {subLabel && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 0 0', textAlign: 'center' }}>{subLabel}</p>}
      
      {trendVisible && trendDelta !== 0 && (
         <div style={{ position: 'absolute', top: 12, right: 12, fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: 12, background: trendDelta > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: trendDelta > 0 ? 'var(--success)' : 'var(--danger)' }}>
           {trendDelta > 0 ? '+' : ''}{trendDelta.toFixed(1)}
         </div>
      )}
    </div>
  );
}
