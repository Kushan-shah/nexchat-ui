import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogIn, Sparkles, UserPlus, Zap, Shield, Globe, Cpu, MessageSquare, Activity } from 'lucide-react';

const FEATURES = [
  { icon: <Globe size={18} />, label: 'Global + DM Rooms' },
  { icon: <Shield size={18} />, label: 'JWT + XSS Protection' },
  { icon: <Activity size={18} />, label: 'Redis Rate Limiting' },
  { icon: <Cpu size={18} />, label: 'Idempotent Delivery' },
];

export default function Login() {
  const { login, register } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return setError('All fields required');
    setLoading(true);
    setError('');
    const res = await (isLogin ? login : register)(username, password);
    if (!res.success) { setError(res.error); setLoading(false); }
  };

  const handleRecruiterDemo = async () => {
    setLoading(true);
    setError('');
    const demoUser = `demo_${Math.floor(Math.random() * 10000)}`;
    await register(demoUser, 'demo123');
  };

  return (
    <div className="login-shell">
      {/* Animated gradient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Left Panel — Branding */}
      <div className="login-brand-panel">
        <div className="animate-enter" style={{ maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Zap size={36} color="var(--accent)" />
            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-1px' }}>NexChat</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '40px' }}>
            A production-grade real-time messaging system built with 
            <span style={{ color: 'var(--accent)' }}> Socket.IO</span>, 
            <span style={{ color: 'var(--success)' }}> Redis</span>, and 
            <span style={{ color: 'var(--warning)' }}> PostgreSQL</span>.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="animate-enter" style={{
                animationDelay: `${i * 0.1}s`,
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', borderRadius: '10px',
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                fontSize: '0.8rem', color: 'var(--text-muted)'
              }}>
                {f.icon}
                {f.label}
              </div>
            ))}
          </div>

          {/* Tech badges */}
          <div style={{ marginTop: '32px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Node.js', 'Express', 'Socket.IO', 'Prisma', 'Redis', 'JWT', 'Zod', 'Docker'].map((t, i) => (
              <span key={i} style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem',
                background: 'rgba(107, 76, 255, 0.08)', color: 'var(--accent)', fontWeight: 500
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="login-form-panel">
        <div className="animate-enter" style={{ width: '100%', maxWidth: '340px' }}>
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <MessageSquare size={40} color="var(--accent)" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              {isLogin ? 'Enter your credentials to continue' : 'Start chatting in seconds'}
            </p>
          </div>

          {error && (
            <div className="animate-enter" style={{
              background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
              padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
              fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</label>
              <input type="text" className="input-field" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
              <input type="password" className="input-field" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}>
              {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{isLogin ? 'Sign up' : 'Login'}</span>
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '24px', paddingTop: '24px' }}>
            <button onClick={handleRecruiterDemo} className="primary-btn" disabled={loading} style={{
              width: '100%', background: 'linear-gradient(135deg, var(--accent), #a855f7)',
              padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 20px rgba(107, 76, 255, 0.25)'
            }}>
              <Sparkles size={18} />
              Instant Demo — No Sign Up
            </button>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '10px' }}>
              Creates a temporary account for testing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
