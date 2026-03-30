import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Share2, FileSpreadsheet, TrendingUp, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import './index.css';

// Helper to extract Sheet ID from URL
const parseSheetUrl = (url) => {
  try {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) return null;
    return idMatch[1];
  } catch (e) {
    return null;
  }
};

// Fetch XLSX file directly
const fetchSheetXLSX = async (id) => {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
  const response = await fetch(exportUrl);
  if (!response.ok) throw new Error('Failed to fetch workbook. Make sure it is public.');
  const arrayBuffer = await response.arrayBuffer();
  return XLSX.read(arrayBuffer, { type: 'array' });
};

// Metric Card UI Component
const MetricCard = ({ title, value, previousValue, icon: Icon, inverseGood = false }) => {
  const delta = value - previousValue;
  const percentChange = previousValue === 0 ? 0 : (delta / previousValue) * 100;
  
  let isGood = delta > 0;
  if (inverseGood) isGood = delta < 0; 
  
  const deltaClass = delta === 0 ? 'delta-neutral' : (isGood ? 'delta-positive' : 'delta-negative');
  const deltaSymbol = delta > 0 ? '+' : '';

  return (
    <div className="glass-panel metric-card animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="metric-label">{title}</span>
        {Icon && <Icon size={20} color="var(--text-muted)" />}
      </div>
      <div className="metric-value">{value.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
      <div className={`metric-delta ${deltaClass}`}>
        {deltaSymbol}{delta.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        <span style={{ marginLeft: 4, fontWeight: 'normal', opacity: 0.8 }}>
          ({deltaSymbol}{percentChange.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
};

export default function App() {
  const [baselineUrl, setBaselineUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // All matched courses loaded from sheets
  const [allData, setAllData] = useState(null);
  
  // Filters
  const [selectedCollege, setSelectedCollege] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');

  const handleLoad = async () => {
    if (!baselineUrl || !currentUrl) {
      setError("Please provide both URLs.");
      return;
    }

    const baseId = parseSheetUrl(baselineUrl);
    const currId = parseSheetUrl(currentUrl);

    if (!baseId || !currId) {
      setError("Invalid Google Sheets URLs. Ensure they contain /d/sheet_id");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [baseWb, currWb] = await Promise.all([
        fetchSheetXLSX(baseId),
        fetchSheetXLSX(currId)
      ]);

      processWorkbooks(baseWb, currWb);
    } catch (err) {
      setError("Failed to load or parse data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const processWorkbooks = (baseWb, currWb) => {
    const isRowValid = r => r && r['Course Name'] && String(r['Course Name']).trim() !== '';
    
    const parseScore = val => {
      if (!val) return 0;
      const num = parseFloat(String(val).replace('%', ''));
      // Handle decimals as percentages (e.g. 0.85 -> 85%)
      if (num > 0 && num <= 1) return num * 100;
      return isNaN(num) ? 0 : num;
    };
    
    const parseNum = val => {
      if (!val) return 0;
      const num = parseInt(val, 10);
      return isNaN(num) ? 0 : num;
    };

    // Extract all tabs from Baseline
    const baseMap = new Map();
    baseWb.SheetNames.forEach(sheetName => {
      // Ignore sheets that look like instructions
      if (sheetName.toLowerCase().includes('instruction') || sheetName.toLowerCase().includes('refresher')) return;
      
      const sheetData = XLSX.utils.sheet_to_json(baseWb.Sheets[sheetName]);
      sheetData.filter(isRowValid).forEach(r => {
        // Unique key per college/course combination
        const key = `${sheetName}::${r['Course Name']}`;
        baseMap.set(key, {
          college: sheetName,
          score: parseScore(r['Score']),
          errors: parseNum(r['Errors']),
          suggestions: parseNum(r['Suggestions'])
        });
      });
    });

    const matchedCourses = [];
    const collegesSet = new Set();
    const coursesSet = new Set();

    // Extract all tabs from Current
    currWb.SheetNames.forEach(sheetName => {
      if (sheetName.toLowerCase().includes('instruction') || sheetName.toLowerCase().includes('refresher')) return;
      
      const sheetData = XLSX.utils.sheet_to_json(currWb.Sheets[sheetName]);
      sheetData.filter(isRowValid).forEach(r => {
        const name = r['Course Name'];
        const key = `${sheetName}::${name}`;
        const baseEntry = baseMap.get(key);
        
        if (baseEntry) {
          const score = parseScore(r['Score']);
          const errors = parseNum(r['Errors']);
          const suggestions = parseNum(r['Suggestions']);

          collegesSet.add(sheetName);
          coursesSet.add(name);

          matchedCourses.push({
            college: sheetName,
            name: name.substring(0, 45) + (name.length > 45 ? '...' : ''), 
            fullName: name,
            baseScore: baseEntry.score,
            currScore: score,
            scoreDelta: score - baseEntry.score,
            baseErrors: baseEntry.errors,
            currErrors: errors,
            errorsDelta: errors - baseEntry.errors,
            baseSuggestions: baseEntry.suggestions,
            currSuggestions: suggestions
          });
        }
      });
    });

    if (matchedCourses.length === 0) {
      throw new Error("No overlapping courses found across colleges in the two sheets. Check your tab names and course names.");
    }

    setAllData({
      courses: matchedCourses,
      collegesList: Array.from(collegesSet).sort(),
      coursesList: Array.from(coursesSet).sort()
    });
    setSelectedCollege('All');
    setSelectedCourse('All');
  };

  // Compute metrics dynamically based on filters
  const filteredData = useMemo(() => {
    if (!allData) return null;

    let filtered = allData.courses;
    
    if (selectedCollege !== 'All') {
      filtered = filtered.filter(c => c.college === selectedCollege);
    }
    
    // Narrow down course list based on college selection
    const availableCourses = new Set(filtered.map(c => c.fullName));

    if (selectedCourse !== 'All') {
      filtered = filtered.filter(c => c.fullName === selectedCourse);
    }

    let tBaseScoreSum = 0, tCurrScoreSum = 0, tBaseErrors = 0, tCurrErrors = 0, tBaseSuggestions = 0, tCurrSuggestions = 0;
    
    filtered.forEach(c => {
      tBaseScoreSum += c.baseScore;
      tCurrScoreSum += c.currScore;
      tBaseErrors += c.baseErrors;
      tCurrErrors += c.currErrors;
      tBaseSuggestions += c.baseSuggestions;
      tCurrSuggestions += c.currSuggestions;
    });

    const count = filtered.length;
    
    const sortedByErrors = [...filtered].sort((a, b) => b.currErrors - a.currErrors).slice(0, 10);
    const sortedByImprovement = [...filtered].filter(c => c.scoreDelta !== 0 || c.errorsDelta !== 0).sort((a, b) => b.scoreDelta - a.scoreDelta).slice(0, 15);

    return {
      filteredCourses: filtered,
      availableCourseNames: Array.from(availableCourses).sort(),
      metrics: {
        avgBaseScore: count ? tBaseScoreSum / count : 0,
        avgCurrScore: count ? tCurrScoreSum / count : 0,
        totalBaseErrors: tBaseErrors,
        totalCurrErrors: tCurrErrors,
        totalBaseSuggestions: tBaseSuggestions,
        totalCurrSuggestions: tCurrSuggestions,
        matchedCount: count
      },
      topErrors: sortedByErrors,
      improvers: sortedByImprovement.length > 0 ? sortedByImprovement : [...filtered].slice(0, 15) // Fallback if no deltas
    };
  }, [allData, selectedCollege, selectedCourse]);

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: 40 }} className="animate-fade-in">
        <h1 className="text-gradient" style={{ fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <TrendingUp size={48} color="var(--primary)" />
          Accessibility Progress
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: 8 }}>
          Compare UDOIT Accessibility across all Colleges.
        </p>
      </header>

      {!allData && (
        <div className="glass-panel animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSpreadsheet /> Connect Workbooks
          </h2>
          <div className="grid grid-cols-1">
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)' }}>Baseline Report (Public Sheets URL)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                value={baselineUrl}
                onChange={e => setBaselineUrl(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)' }}>Current Report (Public Sheets URL)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                value={currentUrl}
                onChange={e => setCurrentUrl(e.target.value)}
              />
            </div>
            <button 
              className="btn-primary" 
              onClick={handleLoad} 
              disabled={loading}
              style={{ marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              {loading ? <div className="loader" /> : <><Share2 size={20} /> Load All Colleges</>}
            </button>
            {error && (
              <div style={{ marginTop: 16, padding: 16, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 8, border: '1px solid var(--danger)' }}>
                {error}
              </div>
            )}
            <div style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <strong>Note:</strong> Sheets must be "Anyone with link can view". The app will download and combine data from all tabs simultaneously.
            </div>
          </div>
        </div>
      )}

      {loading && allData && (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <div className="loader" />
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Refreshing data...</p>
        </div>
      )}

      {filteredData && !loading && (
        <div className="animate-fade-in">
          
          {/* Analysis Controls */}
          <div className="glass-panel" style={{ marginBottom: 40, padding: '20px 24px' }}>
             <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>FILTER BY COLLEGE (TAB)</label>
                  <select 
                    className="input-field" 
                    value={selectedCollege} 
                    onChange={e => { setSelectedCollege(e.target.value); setSelectedCourse('All'); }}
                  >
                    <option value="All">All Colleges</option>
                    {allData.collegesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>FILTER BY COURSE</label>
                  <select 
                    className="input-field" 
                    value={selectedCourse} 
                    onChange={e => setSelectedCourse(e.target.value)}
                  >
                    <option value="All">All Courses</option>
                    {filteredData.availableCourseNames.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
             </div>
          </div>

          {/* Top Level Metrics */}
          <div className="grid grid-cols-4" style={{ marginBottom: 40 }}>
            <MetricCard 
              title="Average Score" 
              value={filteredData.metrics.avgCurrScore} 
              previousValue={filteredData.metrics.avgBaseScore} 
              icon={CheckCircle}
            />
            <MetricCard 
              title="Total Errors" 
              value={filteredData.metrics.totalCurrErrors} 
              previousValue={filteredData.metrics.totalBaseErrors} 
              inverseGood={true}
              icon={AlertTriangle}
            />
            <MetricCard 
              title="Total Suggestions" 
              value={filteredData.metrics.totalCurrSuggestions} 
              previousValue={filteredData.metrics.totalBaseSuggestions} 
              inverseGood={true}
              icon={FileSpreadsheet}
            />
            <div className="glass-panel metric-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span className="metric-label">Matched Courses Analyzed</span>
              <div className="metric-value" style={{ color: 'var(--primary)' }}>{filteredData.metrics.matchedCount}</div>
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ marginBottom: 40 }}>
            {/* Chart: Most Improved */}
            <div className="glass-panel">
              <h3 style={{ marginBottom: 20 }}>Score Shift Progress (Top 15 sample)</h3>
              <div style={{ width: '100%', height: 350 }}>
                {filteredData.improvers.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={filteredData.improvers} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" tick={{fill: 'var(--text-muted)', fontSize: 11}} angle={-45} textAnchor="end" />
                      <YAxis tick={{fill: 'var(--text-muted)'}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 8 }}
                        labelStyle={{ color: 'var(--text-muted)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: 20 }} />
                      <Bar dataKey="baseScore" name="Baseline Score" fill="var(--secondary)" opacity={0.5} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="currScore" name="Current Score" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No courses match completely to compare.
                  </div>
                )}
              </div>
            </div>

            {/* Courses Needs Info Table */}
            <div className="glass-panel" style={{ overflow: 'auto', maxHeight: 440 }}>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={20} color="var(--warning)" /> Needs Attention (Most Errors)
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>College</th>
                    <th>Curr Errors</th>
                    <th>Change</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.topErrors.map((course, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }} title={course.fullName}>{course.name}</td>
                      <td><span style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>{course.college}</span></td>
                      <td>{course.currErrors}</td>
                      <td className={course.errorsDelta <= 0 ? (course.errorsDelta === 0 ? 'delta-neutral' : 'delta-positive') : 'delta-negative'}>
                        {course.errorsDelta > 0 ? '+' : ''}{course.errorsDelta}
                      </td>
                      <td>{course.currScore.toFixed(0)}%</td>
                    </tr>
                  ))}
                  {filteredData.topErrors.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No issues found!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button className="btn-primary" onClick={() => { setAllData(null); setError(null); }} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>
              Load Different Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
