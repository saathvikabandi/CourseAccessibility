import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.login(email, password);
      localStorage.setItem('admin_token', data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
          <h2>Admin Login</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>
            Sign in to manage data sources
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)' }}>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)' }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div style={{ color: 'var(--danger)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, fontSize: '0.9rem' }}>{error}</div>}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <div className="loader" style={{ margin: '0 auto' }}></div> : 'Login'}
          </button>
          
          <button 
            type="button" 
            onClick={() => navigate('/')} 
            className="btn-primary" 
            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
          >
            Return to Public Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
