import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Store, User, ArrowRight, Loader2, ChefHat, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import { validatePassword, authRateLimiter, sanitizeEmail, sanitizeInput, useBotDetector } from '@/lib/security';
import authIllustration from '@/assets/auth-illustration.png';

/* ─────────────────────────────────────────────
   Tiny reusable input field
───────────────────────────────────────────── */
const Field = ({ label, icon: Icon, type = 'text', name, value, onChange, placeholder, required, rightEl }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <Icon
        size={16}
        style={{
          position: 'absolute', left: 12, top: '50%',
          transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none',
        }}
      />
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: '1.5px solid #e0e0e0',
          borderRadius: 8,
          padding: '11px 40px 11px 38px',
          fontSize: 14,
          color: '#222',
          background: '#fff',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={e => {
          e.target.style.borderColor = '#D32F2F';
          e.target.style.boxShadow = '0 0 0 3px rgba(211,47,47,0.12)';
        }}
        onBlur={e => {
          e.target.style.borderColor = '#e0e0e0';
          e.target.style.boxShadow = 'none';
        }}
      />
      {rightEl && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          {rightEl}
        </div>
      )}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: '',
    userName: '',
    email: '',
    password: '',
  });

  // Google OAuth state
  const [googleConfig, setGoogleConfig] = useState({ enabled: false, clientId: null });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [rateLimitMsg, setRateLimitMsg] = useState('');
  const [searchParams] = useSearchParams();
  const sessionReason = searchParams.get('reason');

  // Bot Protection
  const botDetector = useBotDetector();
  const [honeypot, setHoneypot] = useState('');

  const { login, register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  // ── Fetch Google OAuth config + load GSI script ──
  const handleGoogleCredential = useCallback(async (response) => {
    setGoogleLoading(true);
    try {
      const { data } = await api.post('/auth/google', { credential: response.credential });
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        useAuthStore.setState({ user: data.user, token: data.token });
        navigate(data.user?.role === 'superadmin' ? '/admin' : '/pos');
      }
    } catch (err) {
      console.error('Google login error', err);
    } finally {
      setGoogleLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    api.get('/auth/google/config').then(({ data }) => {
      setGoogleConfig({ enabled: data.enabled, clientId: data.clientId });
      if (data.enabled && data.clientId) {
        // Load Google Identity Services script
        const existing = document.getElementById('gsi-script');
        if (existing) {
          // Already loaded — just initialize
          initGSI(data.clientId);
          return;
        }
        const script = document.createElement('script');
        script.id = 'gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => initGSI(data.clientId);
        document.head.appendChild(script);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initGSI = useCallback((clientId) => {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
    });
  }, [handleGoogleCredential]);

  const triggerGoogleLogin = () => {
    if (!window.google) return;
    window.google.accounts.id.prompt();
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Password strength checker
    if (name === 'password' && !isLogin) {
      if (value.length > 0) {
        setPasswordStrength(validatePassword(value));
      } else {
        setPasswordStrength(null);
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setRateLimitMsg('');
    
    // Honeypot check
    if (honeypot.trim() !== '') {
      // Silently ignore bot attempts
      return;
    }
    
    // Behavioral bot detector check
    if (botDetector.isBot()) {
      setRateLimitMsg('Unusual automated activity detected.');
      return;
    }
    
    // Rate limit check
    const rateCheck = authRateLimiter.check('auth');
    if (!rateCheck.allowed) {
      setRateLimitMsg(rateCheck.message);
      return;
    }
    
    let success = false;
    if (isLogin) {
      success = await login(sanitizeEmail(formData.email), formData.password);
      if (!success) {
        authRateLimiter.record('auth');
      } else {
        authRateLimiter.reset('auth');
      }
    } else {
      // Validate password strength on registration
      const pwCheck = validatePassword(formData.password);
      if (!pwCheck.isValid) {
        setRateLimitMsg('Password does not meet requirements');
        return;
      }
      success = await register(
        sanitizeInput(formData.restaurantName),
        sanitizeInput(formData.userName),
        sanitizeEmail(formData.email),
        formData.password,
      );
    }
    if (success) {
      const user = useAuthStore.getState().user;
      navigate(user?.role === 'superadmin' ? '/admin' : '/pos');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({ restaurantName: '', userName: '', email: '', password: '' });
    setShowPassword(false);
    setPasswordStrength(null);
    setRateLimitMsg('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff5f5 0%, #fff 60%, #ffeaea 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>

      {/* ── Top Nav Bar ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '18px 40px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, #D32F2F, #ff6b6b)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(211,47,47,0.3)',
          }}>
            <ChefHat size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
              Restro<span style={{ color: '#D32F2F' }}>AI</span>
            </div>
            <div style={{ fontSize: 10, color: '#999', fontWeight: 500, letterSpacing: '0.5px', marginTop: -2 }}>
              POS SYSTEM
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        gap: 60,
      }}>

        {/* Left – Illustration */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: '0 0 auto',
            maxWidth: 460,
          }}
          className="auth-illustration-col"
        >
          {/* Soft background blob */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute',
              width: 400, height: 380,
              background: 'radial-gradient(ellipse at 50% 60%, #ffe4e4 0%, #fff5f5 55%, transparent 100%)',
              borderRadius: '50%',
              zIndex: 0,
            }} />
            {/* Ground shadow */}
            <div style={{
              position: 'absolute',
              bottom: -10, left: '50%',
              transform: 'translateX(-50%)',
              width: 260, height: 22,
              background: 'rgba(0,0,0,0.08)',
              borderRadius: '50%',
              filter: 'blur(10px)',
              zIndex: 0,
            }} />
            <img
              src={authIllustration}
              alt="Restaurant manager"
              style={{
                width: 380,
                height: 380,
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.12))',
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ textAlign: 'center', marginTop: 8 }}
          >
            <h2 style={{
              fontSize: 28, fontWeight: 800, color: '#1a1a1a',
              margin: 0, letterSpacing: '-0.5px',
            }}>
              {isLogin ? 'Welcome Back!' : 'Get Started!'}
            </h2>
            <p style={{ fontSize: 14, color: '#888', marginTop: 8, lineHeight: 1.6 }}>
              {isLogin
                ? 'Sign in to manage your restaurant\noperations with ease.'
                : 'Create your account and launch\nyour restaurant POS today.'}
            </p>
          </motion.div>

          {/* Feature chips */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Orders', 'KDS', 'Analytics', 'AI Insights'].map(f => (
              <span key={f} style={{
                background: 'rgba(211,47,47,0.08)',
                color: '#D32F2F',
                border: '1px solid rgba(211,47,47,0.2)',
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
              }}>{f}</span>
            ))}
          </div>
        </motion.div>

        {/* Right – Form Card */}
        <motion.div
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 8px 48px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
            padding: '40px 36px',
            width: '100%',
            maxWidth: 400,
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {/* Card header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontSize: 24, fontWeight: 800, color: '#1a1a1a',
              margin: 0, letterSpacing: '-0.4px',
            }}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </h1>
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              {isLogin
                ? 'to access your restaurant dashboard'
                : 'and set up your restaurant system'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Honeypot Field - Invisible to users, filled by bots */}
            <input 
              type="text" 
              name="website" 
              tabIndex={-1} 
              autoComplete="off" 
              style={{ opacity: 0, position: 'absolute', top: -9999, left: -9999, zIndex: -1 }} 
              value={honeypot} 
              onChange={e => setHoneypot(e.target.value)} 
            />

            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <Field
                    label="Restaurant Name"
                    icon={Store}
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleInputChange}
                    placeholder="Spice Junction"
                    required={!isLogin}
                  />
                  <Field
                    label="Your Name"
                    icon={User}
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Field
              label="Email Address"
              icon={Mail}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@restaurant.com"
              required
            />

            <Field
              label="Password"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
              rightEl={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#aaa', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {/* Password Strength Meter (Registration only) */}
            <AnimatePresence>
              {!isLogin && passwordStrength && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= passwordStrength.score
                          ? passwordStrength.strength === 'strong' ? '#16a34a'
                          : passwordStrength.strength === 'good' ? '#2563eb'
                          : passwordStrength.strength === 'fair' ? '#f59e0b'
                          : '#dc2626'
                          : '#e5e7eb',
                        transition: 'background 0.3s'
                      }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: passwordStrength.strength === 'strong' ? '#16a34a'
                        : passwordStrength.strength === 'good' ? '#2563eb'
                        : passwordStrength.strength === 'fair' ? '#f59e0b'
                        : '#dc2626'
                    }}>
                      {passwordStrength.strength === 'strong' ? '🛡️ Strong' : passwordStrength.strength === 'good' ? '✅ Good' : passwordStrength.strength === 'fair' ? '⚠️ Fair' : '❌ Weak'}
                    </span>
                    {passwordStrength.isValid && (
                      <ShieldCheck size={14} style={{ color: '#16a34a' }} />
                    )}
                  </div>
                  {passwordStrength.messages.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      {passwordStrength.messages.map((msg, i) => (
                        <p key={i} style={{ fontSize: 10, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>• {msg}</p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Session Expired Banner */}
            <AnimatePresence>
              {sessionReason && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fbbf24',
                    color: '#b45309',
                    fontSize: 13,
                    padding: '10px 14px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  {sessionReason}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rate Limit Warning */}
            <AnimatePresence>
              {rateLimitMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    color: '#dc2626',
                    fontSize: 13,
                    padding: '10px 14px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  {rateLimitMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: '#fff5f5',
                    border: '1px solid #fca5a5',
                    color: '#dc2626',
                    fontSize: 13,
                    padding: '10px 14px',
                    borderRadius: 8,
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              style={{
                marginTop: 4,
                width: '100%',
                padding: '13px',
                background: isLoading
                  ? '#e0e0e0'
                  : 'linear-gradient(135deg, #D32F2F, #ff5252)',
                color: isLoading ? '#999' : '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(211,47,47,0.35)',
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
            >
              {isLoading ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
              )}
            </motion.button>

            {/* ── Google Login Button (shown only when enabled by admin) ── */}
            <AnimatePresence>
              {googleConfig.enabled && googleConfig.clientId && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                    <span style={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>or</span>
                    <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                  </div>

                  {/* Google Button */}
                  <motion.button
                    type="button"
                    onClick={triggerGoogleLogin}
                    disabled={googleLoading}
                    whileHover={{ scale: googleLoading ? 1 : 1.02 }}
                    whileTap={{ scale: googleLoading ? 1 : 0.97 }}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 10,
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      cursor: googleLoading ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#3c4043',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#c62828'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; }}
                  >
                    {googleLoading ? (
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#D32F2F' }} />
                    ) : (
                      /* Google SVG Logo */
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    {googleLoading ? 'Signing in…' : 'Sign in with Google'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Divider (shown when Google is NOT enabled) */}
            {!googleConfig.enabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                <span style={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
              </div>
            )}

            {/* Switch mode */}
            <p style={{ textAlign: 'center', fontSize: 13, color: '#777', margin: 0 }}>
              {isLogin ? "New to RestroAI? " : "Already have an account? "}
              <button
                type="button"
                onClick={switchMode}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#D32F2F', fontWeight: 700, fontSize: 13,
                  textDecoration: 'underline', textUnderlineOffset: 2,
                }}
              >
                {isLogin ? 'Create account' : 'Sign in'}
              </button>
            </p>
          </form>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 40px',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ fontSize: 12, color: '#aaa' }}>
          ©{new Date().getFullYear()} <strong style={{ color: '#777' }}>RestroAI</strong> — Smart Restaurant POS
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms & Conditions', 'Support'].map(link => (
            <a key={link} href="#" style={{
              fontSize: 12, color: '#aaa', textDecoration: 'none',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = '#D32F2F'}
              onMouseLeave={e => e.target.style.color = '#aaa'}
            >{link}</a>
          ))}
        </div>
      </footer>

      {/* ── Responsive hide illustration on small screens ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .auth-illustration-col { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
