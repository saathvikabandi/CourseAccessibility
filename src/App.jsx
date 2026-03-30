import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, TrendingUp } from 'lucide-react';

import { CollegeCompareView } from './components/CollegeCompareView';
import { CollegeDrilldownView } from './components/CollegeDrilldownView';
import { CourseDetailView } from './components/CourseDetailView';
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

export default function App() {
  const [baselineUrl, setBaselineUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [allData, setAllData] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');

  // Trigger course reset if college changes
  useEffect(() => {
    setSelectedCourse('All');
  }, [selectedCollege]);

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
      if (num > 0 && num <= 1) return num * 100;
      return isNaN(num) ? 0 : num;
    };
    const parseNum = val => {
      if (!val) return 0;
      const num = parseInt(val, 10);
      return isNaN(num) ? 0 : num;
    };

    const baseMap = new Map();
    baseWb.SheetNames.forEach(sheetName => {
      if (sheetName.toLowerCase().includes('instruction') || sheetName.toLowerCase().includes('refresher')) return;
      const sheetData = XLSX.utils.sheet_to_json(baseWb.Sheets[sheetName]);
      sheetData.filter(isRowValid).forEach(r => {
        const key = `${sheetName}::${r['Course Name']}`;
        baseMap.set(key, {
          college: sheetName,
          score: parseScore(r['Score']),
          errors: parseNum(r['Errors']),
          suggestions: parseNum(r['Suggestions']),
          fixed: parseNum(r['Content Fixed']),
          reviewed: parseNum(r['Files Reviewed']),
          scanned: parseNum(r['Files Scanned']),
          contentScanned: parseNum(r['Content Scanned'])
        });
      });
    });

    const matchedCourses = [];
    const collegesSet = new Set();
    const coursesSet = new Set();

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
            currSuggestions: suggestions,
            baseFixed: baseEntry.fixed,
            currFixed: parseNum(r['Content Fixed']),
            baseReviewed: baseEntry.reviewed,
            currReviewed: parseNum(r['Files Reviewed']),
            baseScanned: baseEntry.scanned,
            currScanned: parseNum(r['Files Scanned']),
            baseContentScanned: baseEntry.contentScanned,
            currContentScanned: parseNum(r['Content Scanned']),
            currDensity: parseNum(r['Files Scanned']) > 0 ? (errors / parseNum(r['Files Scanned'])) : 0,
            baseDensity: baseEntry.scanned > 0 ? (baseEntry.errors / baseEntry.scanned) : 0
          });
        }
      });
    });

    if (matchedCourses.length === 0) {
      throw new Error("No overlapping courses found across colleges. Check tabs and course names.");
    }

    setAllData({
      courses: matchedCourses,
      collegesList: Array.from(collegesSet).sort()
    });
    setSelectedCollege('All');
    setSelectedCourse('All');
  };

  const derivedData = useMemo(() => {
    if (!allData) return null;

    const collegeMap = {};
    allData.courses.forEach(c => {
      if (!collegeMap[c.college]) {
        collegeMap[c.college] = {
           college: c.college,
           courses: [],
           baseScoreSum: 0, currScoreSum: 0,
           baseErrors: 0, currErrors: 0,
           baseSuggestions: 0, currSuggestions: 0,
           baseFixed: 0, currFixed: 0,
           baseReviewed: 0, currReviewed: 0,
           baseContentScanned: 0, currContentScanned: 0
        };
      }
      const col = collegeMap[c.college];
      col.courses.push(c);
      col.baseScoreSum += c.baseScore;
      col.currScoreSum += c.currScore;
      col.baseErrors += c.baseErrors;
      col.currErrors += c.currErrors;
      col.baseSuggestions += c.baseSuggestions;
      col.currSuggestions += c.currSuggestions;
      col.baseFixed += c.baseFixed;
      col.currFixed += c.currFixed;
      col.baseReviewed += c.baseReviewed;
      col.currReviewed += c.currReviewed;
      col.baseContentScanned += c.baseContentScanned;
      col.currContentScanned += c.currContentScanned;
    });

    const collegeSummaries = Object.values(collegeMap).map(col => {
      const count = col.courses.length;
      const avgBaseScore = count ? col.baseScoreSum / count : 0;
      const avgCurrScore = count ? col.currScoreSum / count : 0;
      return {
         college: col.college,
         courseCount: count,
         avgBaseScore,
         avgCurrScore,
         avgScoreDelta: avgCurrScore - avgBaseScore,
         baseErrors: col.baseErrors,
         currErrors: col.currErrors,
         baseSuggestions: col.baseSuggestions,
         currSuggestions: col.currSuggestions,
         efficiency: col.currReviewed > 0 ? (col.currFixed / col.currReviewed) * 100 : 0,
         completion: col.currContentScanned > 0 ? (col.currFixed / col.currContentScanned) * 100 : 0,
         baseEfficiency: col.baseReviewed > 0 ? (col.baseFixed / col.baseReviewed) * 100 : 0,
         baseCompletion: col.baseContentScanned > 0 ? (col.baseFixed / col.baseContentScanned) * 100 : 0
      };
    });

    let tBaseScoreSum = 0, tCurrScoreSum = 0, tBaseErrors = 0, tCurrErrors = 0;
    let tBaseFixed = 0, tCurrFixed = 0, tBaseReviewed = 0, tCurrReviewed = 0, tBaseContentScanned = 0, tCurrContentScanned = 0;

    allData.courses.forEach(c => {
       tBaseScoreSum += c.baseScore;
       tCurrScoreSum += c.currScore;
       tBaseErrors += c.baseErrors;
       tCurrErrors += c.currErrors;
       tBaseFixed += c.baseFixed;
       tCurrFixed += c.currFixed;
       tBaseReviewed += c.baseReviewed;
       tCurrReviewed += c.currReviewed;
       tBaseContentScanned += c.baseContentScanned;
       tCurrContentScanned += c.currContentScanned;
    });

    const matchedCount = allData.courses.length;
    const globalMetrics = {
      totalColleges: collegeSummaries.length,
      matchedCount,
      avgBaseScore: matchedCount ? tBaseScoreSum / matchedCount : 0,
      avgCurrScore: matchedCount ? tCurrScoreSum / matchedCount : 0,
      totalBaseErrors: tBaseErrors,
      totalCurrErrors: tCurrErrors,
      baseEfficiency: tBaseReviewed > 0 ? (tBaseFixed / tBaseReviewed) * 100 : 0,
      currEfficiency: tCurrReviewed > 0 ? (tCurrFixed / tCurrReviewed) * 100 : 0,
      baseCompletion: tBaseContentScanned > 0 ? (tBaseFixed / tBaseContentScanned) * 100 : 0,
      currCompletion: tCurrContentScanned > 0 ? (tCurrFixed / tCurrContentScanned) * 100 : 0,
    };

    const filteredCourses = selectedCollege !== 'All' 
      ? allData.courses.filter(c => c.college === selectedCollege) 
      : allData.courses;

    const activeCollegeSummary = selectedCollege !== 'All' 
      ? collegeSummaries.find(c => c.college === selectedCollege)
      : null;

    const availableCourseNames = Array.from(new Set(filteredCourses.map(c => c.fullName))).sort();

    const activeCourse = selectedCourse !== 'All' 
      ? filteredCourses.find(c => c.fullName === selectedCourse) 
      : null;

    return {
      collegeSummaries,
      globalMetrics,
      filteredCourses,
      activeCollegeSummary,
      availableCourseNames,
      activeCourse
    };
  }, [allData, selectedCollege, selectedCourse]);

  // View Router
  const renderActiveState = () => {
    if (!derivedData) return null;
    
    if (selectedCourse !== 'All') {
      return <CourseDetailView activeCourse={derivedData.activeCourse} />;
    }
    
    if (selectedCollege !== 'All') {
      return <CollegeDrilldownView collegeSummary={derivedData.activeCollegeSummary} filteredCourses={derivedData.filteredCourses} />;
    }
    
    return <CollegeCompareView metrics={derivedData.globalMetrics} collegeSummaries={derivedData.collegeSummaries} />;
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: 40 }} className="animate-fade-in">
        <h1 className="text-gradient" style={{ fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <TrendingUp size={48} color="var(--primary)" />
          Accessibility Progress
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: 8 }}>
          Intelligent Drill-Down Analytics Engine
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
          </div>
          {error && <div style={{ color: 'var(--danger)', marginTop: 20, padding: 16, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}>{error}</div>}
          <button 
            className="btn-primary" 
            style={{ width: '100%', marginTop: 24 }}
            onClick={handleLoad}
            disabled={loading}
          >
            {loading ? <div className="loader"></div> : 'Analyze Progress'}
          </button>
        </div>
      )}

      {allData && derivedData && (
        <div className="animate-fade-in">
           {/* Global Filter Bar */}
           <div className="glass-panel" style={{ marginBottom: 40, borderLeft: '4px solid var(--primary)' }}>
             <div className="grid grid-cols-2" style={{ alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)' }}>Analyze by College</label>
                  <select 
                    className="input-field" 
                    value={selectedCollege} 
                    onChange={e => setSelectedCollege(e.target.value)}
                  >
                    <option value="All">All Colleges (Global View)</option>
                    {allData.collegesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)' }}>Deep Dive Course</label>
                  <select 
                    className="input-field" 
                    value={selectedCourse} 
                    onChange={e => setSelectedCourse(e.target.value)}
                    disabled={selectedCollege === 'All' && derivedData.availableCourseNames.length > 300} // UX protection
                  >
                    <option value="All">All Courses</option>
                    {derivedData.availableCourseNames.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
             </div>
             
             {/* Context Badge */}
             <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', background: 'rgba(99, 102, 241, 0.2)', padding: '6px 12px', borderRadius: 20 }}>
                  State: {selectedCourse !== 'All' ? 'Course Detail' : (selectedCollege !== 'All' ? 'College Drilldown' : 'Global Comparison')}
                </span>
                {(selectedCollege !== 'All' || selectedCourse !== 'All') && (
                  <button onClick={() => { setSelectedCollege('All'); setSelectedCourse('All'); }} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem' }}>
                    Reset Filters
                  </button>
                )}
             </div>
           </div>

           {/* Active View Router */}
           {renderActiveState()}

           <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button className="btn-primary" onClick={() => { setAllData(null); setError(null); }} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>
              Disconnect Workbooks
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
