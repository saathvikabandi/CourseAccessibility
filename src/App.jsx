import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { TrendingUp, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';

import { CollegeCompareView } from './components/CollegeCompareView';
import { CollegeDrilldownView } from './components/CollegeDrilldownView';
import { CourseDetailView } from './components/CourseDetailView';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { api } from './services/api';
import './index.css';

// Fetch XLSX file from URL
const fetchSheetXLSX = async (url) => {
  let fetchUrl = url;
  if (url.includes('docs.google.com/spreadsheets/d/')) {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (idMatch) {
      fetchUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=xlsx`;
    }
  }

  const response = await fetch(fetchUrl);
  if (!response.ok) throw new Error(`Failed to fetch workbook from ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  return XLSX.read(arrayBuffer, { type: 'array' });
};

function PublicAnalysisApp() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allData, setAllData] = useState(null);

  // Derive selections from URL
  const pathParts = location.pathname.split('/').filter(Boolean);
  const selectedCollege = pathParts[0] === 'college' ? decodeURIComponent(pathParts[1]) : 'All';
  const selectedCourse = pathParts[2] === 'course' ? decodeURIComponent(pathParts[3]) : 'All';

  useEffect(() => {
    const loadBackendSheets = async () => {
      setLoading(true);
      setError(null);
      try {
        const activeSheets = await api.getActiveSheets();
        if (!activeSheets || activeSheets.length === 0) {
          setError("No data sources have been added yet.");
          setLoading(false);
          return;
        }

        const parsedReports = activeSheets.map(r => ({ label: r.sheet_name, url: r.sheet_url }));

        const workbooksData = await Promise.all(
          parsedReports.map(async r => {
            const wb = await fetchSheetXLSX(r.url);
            return { label: r.label, wb };
          })
        );
        processWorkbooks(workbooksData);
      } catch (err) {
        setError("Failed to load or parse data: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadBackendSheets();
  }, []);

  const processWorkbooks = (workbooksData) => {
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

    const timeSeriesData = [];
    const collegesSet = new Set();

    // Linearly process every uploaded workbook and append to the raw time series db
    workbooksData.forEach((report, index) => {
      const wb = report.wb;
      wb.SheetNames.forEach(sheetName => {
        if (sheetName.toLowerCase().includes('instruction') || sheetName.toLowerCase().includes('refresher')) return;
        const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
        
        sheetData.filter(isRowValid).forEach(r => {
          const name = r['Course Name'];
          collegesSet.add(sheetName);
          
          timeSeriesData.push({
            periodLabel: report.label,
            periodIndex: index,
            college: sheetName,
            name: name.substring(0, 45) + (name.length > 45 ? '...' : ''),
            fullName: name,
            score: parseScore(r['Score']),
            errors: parseNum(r['Errors']),
            suggestions: parseNum(r['Suggestions']),
            fixed: parseNum(r['Content Fixed']),
            reviewed: parseNum(r['Files Reviewed']),
            scanned: parseNum(r['Files Scanned']),
            contentScanned: parseNum(r['Content Scanned']),
            density: parseNum(r['Files Scanned']) > 0 ? (parseNum(r['Errors']) / parseNum(r['Files Scanned'])) : 0,
            completion: parseNum(r['Content Scanned']) > 0 ? (parseNum(r['Content Fixed']) / parseNum(r['Content Scanned'])) * 100 : 0,
            efficiency: parseNum(r['Files Reviewed']) > 0 ? (parseNum(r['Content Fixed']) / parseNum(r['Files Reviewed'])) * 100 : 0
          });
        });
      });
    });

    if (timeSeriesData.length === 0) {
      throw new Error("No course data found across the provided workbooks.");
    }

    setAllData({
      timeSeriesData,
      collegesList: Array.from(collegesSet).sort()
    });
    navigate('/');
  };

  const derivedData = useMemo(() => {
    if (!allData || !allData.timeSeriesData) return null;

    // 1. Group by Course
    const courseMap = new Map();
    const normalize = (str) => String(str).trim().toLowerCase();

    allData.timeSeriesData.forEach(row => {
       // Group by college and course name to prevent collisions, 
       // and normalize strings to fix trailing whitespace/case issues across sheets.
       const key = `${normalize(row.college)}::${normalize(row.fullName)}`;
       if (!courseMap.has(key)) courseMap.set(key, []);
       courseMap.get(key).push(row);
    });

    const latestCourses = [];
    courseMap.forEach((history, fullName) => {
       history.sort((a, b) => a.periodIndex - b.periodIndex);
       const latest = history[history.length - 1];
       const previous = history.length > 1 ? history[history.length - 2] : null;

       latestCourses.push({
         ...latest,
         history,
         baseScore: previous ? previous.score : latest.score,
         currScore: latest.score,
         scoreDelta: previous ? (latest.score - previous.score) : 0,
         baseErrors: previous ? previous.errors : latest.errors,
         currErrors: latest.errors,
         errorsDelta: previous ? (latest.errors - previous.errors) : 0,
         baseSuggestions: previous ? previous.suggestions : latest.suggestions,
         currSuggestions: latest.suggestions,
         currDensity: latest.density,
         currContentScanned: latest.contentScanned,
         currFixed: latest.fixed,
         currReviewed: latest.reviewed
       });
    });

    // 2. Aggregate Colleges
    const collegeSummariesMap = {};
    latestCourses.forEach(c => {
       if (!collegeSummariesMap[c.college]) {
          collegeSummariesMap[c.college] = {
             college: c.college,
             courseCount: 0,
             baseScoreSum: 0,
             currScoreSum: 0,
             currErrors: 0,
             baseErrors: 0,
             currSuggestions: 0,
             baseSuggestions: 0,
             efficiency: 0, 
             fixedSum: 0, 
             reviewedSum: 0
          };
       }
       const col = collegeSummariesMap[c.college];
       col.courseCount++;
       col.baseScoreSum += c.baseScore;
       col.currScoreSum += c.currScore;
       col.baseErrors += c.baseErrors;
       col.currErrors += c.currErrors;
       col.baseSuggestions += c.baseSuggestions;
       col.currSuggestions += c.currSuggestions;
       col.fixedSum += c.currFixed;
       col.reviewedSum += c.currReviewed;
    });

    const collegeSummaries = Object.values(collegeSummariesMap).map(col => ({
       college: col.college,
       courseCount: col.courseCount,
       avgBaseScore: col.courseCount ? col.baseScoreSum / col.courseCount : 0,
       avgCurrScore: col.courseCount ? col.currScoreSum / col.courseCount : 0,
       avgScoreDelta: (col.courseCount ? col.currScoreSum / col.courseCount : 0) - (col.courseCount ? col.baseScoreSum / col.courseCount : 0),
       baseErrors: col.baseErrors,
       currErrors: col.currErrors,
       baseSuggestions: col.baseSuggestions,
       currSuggestions: col.currSuggestions,
       efficiency: col.reviewedSum > 0 ? (col.fixedSum / col.reviewedSum) * 100 : 0
    }));

    // 3. Global Aggregates
    let tBaseScoreSum = 0, tCurrScoreSum = 0, tBaseErrors = 0, tCurrErrors = 0;
    let tFixed = 0, tReviewed = 0;
    latestCourses.forEach(c => {
       tBaseScoreSum += c.baseScore;
       tCurrScoreSum += c.currScore;
       tBaseErrors += c.baseErrors;
       tCurrErrors += c.currErrors;
       tFixed += c.currFixed;
       tReviewed += c.currReviewed;
    });

    const matchedCount = latestCourses.length;
    const globalMetrics = {
      totalColleges: collegeSummaries.length,
      matchedCount,
      avgBaseScore: matchedCount ? tBaseScoreSum / matchedCount : 0,
      avgCurrScore: matchedCount ? tCurrScoreSum / matchedCount : 0,
      totalBaseErrors: tBaseErrors,
      totalCurrErrors: tCurrErrors,
      currEfficiency: tReviewed > 0 ? (tFixed / tReviewed) * 100 : 0
    };

    // 4. Time Series College Trend data
    const collegeTimeMap = {}; 
    allData.timeSeriesData.forEach(row => {
       const key = `${row.periodLabel}::${row.college}`;
       if (!collegeTimeMap[key]) {
         collegeTimeMap[key] = { label: row.periodLabel, index: row.periodIndex, college: row.college, sum: 0, count: 0 };
       }
       collegeTimeMap[key].sum += row.score;
       collegeTimeMap[key].count++;
    });

    const globalTrendMap = {};
    Object.values(collegeTimeMap).forEach(ct => {
       if (!globalTrendMap[ct.label]) {
         globalTrendMap[ct.label] = { label: ct.label, index: ct.index };
       }
       globalTrendMap[ct.label][ct.college] = ct.sum / ct.count;
    });
    const globalTrendData = Object.values(globalTrendMap).sort((a,b) => a.index - b.index);

    const filteredCourses = selectedCollege !== 'All' 
      ? latestCourses.filter(c => c.college === selectedCollege) 
      : latestCourses;

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
      activeCourse,
      globalTrendData
    };
  }, [allData, selectedCollege, selectedCourse]);

  // Navigation Helpers
  const handleCollegeChange = (college) => {
    if (college === 'All') navigate('/');
    else navigate(`/college/${encodeURIComponent(college)}`);
  };

  const handleCourseChange = (course) => {
    if (course === 'All') navigate(`/college/${encodeURIComponent(selectedCollege)}`);
    else navigate(`/college/${encodeURIComponent(selectedCollege)}/course/${encodeURIComponent(course)}`);
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: 40, position: 'relative' }} className="animate-fade-in">
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <button onClick={() => navigate('/admin')} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: '0.9rem' }}>
            <ShieldCheck size={16} /> Admin Login
          </button>
        </div>
        <h1 className="text-gradient" style={{ fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <TrendingUp size={48} color="var(--primary)" />
          Accessibility Progress
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: 8 }}>
          Intelligent Drill-Down Analytics Engine
        </p>
      </header>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="loader" style={{ width: 40, height: 40, borderWidth: 4 }}></div>
        </div>
      )}

      {error && !loading && (
        <div className="glass-panel animate-fade-in" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 16, color: 'var(--text-muted)' }}>Status</h2>
          <p style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{error}</p>
        </div>
      )}

      {allData && derivedData && !loading && (
        <div className="animate-fade-in">
           {/* Global Filter Bar */}
           <div className="glass-panel" style={{ marginBottom: 40, borderLeft: '4px solid var(--primary)' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 12, color: 'var(--text-muted)' }}>Analyze by College</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => handleCollegeChange('All')}
                      style={{ 
                        padding: '8px 20px', borderRadius: 24, cursor: 'pointer', 
                        border: selectedCollege === 'All' ? 'none' : '1px solid var(--border-color)', 
                        background: selectedCollege === 'All' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                        color: 'white', fontWeight: selectedCollege === 'All' ? 600 : 400,
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      All Colleges (Global)
                    </button>
                    {allData.collegesList.map(c => (
                      <button 
                        key={c}
                        onClick={() => handleCollegeChange(c)}
                        style={{ 
                          padding: '8px 20px', borderRadius: 24, cursor: 'pointer', 
                          border: selectedCollege === c ? 'none' : '1px solid var(--border-color)', 
                          background: selectedCollege === c ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                          color: 'white', fontWeight: selectedCollege === c ? 600 : 400,
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ maxWidth: 400 }}>
                  <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)' }}>Deep Dive Course</label>
                  <select 
                    className="input-field" 
                    value={selectedCourse} 
                    onChange={e => handleCourseChange(e.target.value)}
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
                  <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem' }}>
                    Reset Filters
                  </button>
                )}
             </div>
           </div>

           {/* Active View Router */}
           <Routes>
             <Route path="/" element={<CollegeCompareView metrics={derivedData.globalMetrics} collegeSummaries={derivedData.collegeSummaries} globalTrendData={derivedData.globalTrendData} />} />
             <Route path="/college/:collegeName" element={<CollegeDrilldownView collegeSummary={derivedData.activeCollegeSummary} filteredCourses={derivedData.filteredCourses} />} />
             <Route path="/college/:collegeName/course/:courseName" element={<CourseDetailView activeCourse={derivedData.activeCourse} />} />
           </Routes>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="/*" element={<PublicAnalysisApp />} />
    </Routes>
  );
}
