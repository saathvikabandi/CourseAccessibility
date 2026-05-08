import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

export function AdminDashboard() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [file, setFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('file');
  const [isAdding, setIsAdding] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      setLoading(true);
      const session = await api.getSession();
      if (!session) {
        handleLogout();
        return;
      }
      
      const data = await api.getAdminSheets();
      setSheets(data);
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        handleLogout();
      } else {
        setError(err.message || 'Failed to load sheets');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await api.logout(); } catch (e) {}
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const handleAddSheet = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      let finalUrl = newUrl;
      if (uploadMode === 'file') {
        if (!file) throw new Error("Please select a file to upload.");
        finalUrl = await api.uploadFile(file);
      }
      
      await api.addSheet({ sheet_name: newName, sheet_url: finalUrl, is_active: true });
      setNewName('');
      setNewUrl('');
      setFile(null);
      await fetchSheets();
    } catch (err) {
      setError(err.message || 'Failed to add sheet');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.updateSheet(id, { is_active: !currentStatus });
      await fetchSheets();
    } catch (err) {
      setError(err.message || 'Failed to update sheet');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this data source?')) return;
    try {
      await api.deleteSheet(id);
      await fetchSheets();
    } catch (err) {
      setError(err.message || 'Failed to delete sheet');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <h2>Admin Dashboard</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>
            View Public Page
          </button>
          <button onClick={handleLogout} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger)', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, marginBottom: 24 }}>{error}</div>}

      <div className="glass-panel" style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={20} /> Add Data Source
        </h3>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <button 
            onClick={() => setUploadMode('link')} 
            style={{ padding: '8px 16px', background: uploadMode === 'link' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer' }}
          >
            Google Sheet Link
          </button>
          <button 
            onClick={() => setUploadMode('file')} 
            style={{ padding: '8px 16px', background: uploadMode === 'file' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer' }}
          >
            Upload Excel File
          </button>
        </div>

        <form onSubmit={handleAddSheet} style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)' }}>Period Label / Sheet Name</label>
            <input 
              type="text" 
              className="input-field" 
              required
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Feb 15 Analysis"
            />
          </div>
          
          {uploadMode === 'link' ? (
            <div style={{ flex: 2, minWidth: '300px' }}>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)' }}>Google Sheet Public URL</label>
              <input 
                type="url" 
                className="input-field" 
                required
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
              />
            </div>
          ) : (
            <div style={{ flex: 2, minWidth: '300px' }}>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)' }}>Upload .xlsx File</label>
              <input 
                type="file" 
                accept=".xlsx, .xls"
                className="input-field" 
                required
                onChange={e => setFile(e.target.files[0])}
                style={{ padding: '10px' }}
              />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isAdding} style={{ height: '48px', minWidth: '120px' }}>
            {isAdding ? <div className="loader" style={{ width: 20, height: 20, margin: '0 auto' }}></div> : 'Add Data'}
          </button>
        </form>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3>Configured Workbooks</h3>
          <button onClick={fetchSheets} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div className="loader"></div>
          </div>
        ) : sheets.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
            No Google Sheets have been added yet. Add one above to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 8px', fontWeight: 500 }}>Name</th>
                  <th style={{ padding: '16px 8px', fontWeight: 500 }}>URL</th>
                  <th style={{ padding: '16px 8px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '16px 8px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sheets.map(sheet => (
                  <tr key={sheet.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 500 }}>{sheet.sheet_name}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <a href={sheet.sheet_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        {sheet.sheet_url.substring(0, 40)}...
                      </a>
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        background: sheet.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: sheet.is_active ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {sheet.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleToggleActive(sheet.id, sheet.is_active)}
                          style={{ padding: '8px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title={sheet.is_active ? "Disable Sheet" : "Enable Sheet"}
                        >
                          {sheet.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(sheet.id)}
                          style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Delete Sheet"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
