import React from 'react';

export function MetricCard({ title, value, previousValue, inverseGood = false, icon: Icon }) {
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
      <div className="metric-delta">
        <span className={isZero ? 'delta-neutral' : (isGood ? 'delta-positive' : 'delta-negative')}>
          {isPositive ? '+' : ''}
          {typeof delta === 'number' && !Number.isInteger(delta) 
            ? delta.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
            : delta.toLocaleString()}
        </span>
        <span style={{ color: 'var(--text-muted)' }}> vs baseline</span>
      </div>
    </div>
  );
}
