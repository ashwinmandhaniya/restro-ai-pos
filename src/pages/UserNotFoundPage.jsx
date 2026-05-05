import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChefHat } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import userNotFoundIllustration from '@/assets/user-not-found.svg';

/* ─────────────────────────────────────────────
   User Not Found / No Active Plan Page
   Matches the global AuthPage UI exactly
───────────────────────────────────────────── */
const UserNotFoundPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'Unknown user';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff5f5 0%, #fff 60%, #ffeaea 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>

      {/* ── Top Nav Bar (matches AuthPage exactly) ── */}
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.svg" alt="RestroxAI Logo" style={{ height: 24, objectFit: 'contain' }} />
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

        {/* Left – Illustration (matches AuthPage layout) */}
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
          className="unf-illustration-col"
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
              src={userNotFoundIllustration}
              alt="User not found"
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
              Access Denied
            </h2>
            <p style={{ fontSize: 14, color: '#888', marginTop: 8, lineHeight: 1.6 }}>
              Your account needs approval before{'\n'}you can access the platform.
            </p>
          </motion.div>

          {/* Feature chips */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['No Plan', 'Pending Approval', 'Contact Admin'].map(f => (
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

        {/* Right – Error Card (matches AuthPage card style) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 8px 48px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
            padding: '40px 36px',
            width: '100%',
            maxWidth: 420,
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {/* Card header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontSize: 24, fontWeight: 800, color: '#1a1a1a',
              margin: 0, letterSpacing: '-0.4px',
            }}>
              User Not Found
            </h1>
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              unable to access the platform
            </p>
          </div>

          {/* Email badge */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 20,
          }}>
            {/* Google icon */}
            <div style={{
              width: 28, height: 28,
              borderRadius: '50%',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            <p style={{
              fontSize: 15,
              color: '#333',
              margin: 0,
              lineHeight: 1.6,
            }}>
              <strong style={{ color: '#1a1a1a', fontWeight: 700 }}>{email}</strong>{' '}
              is not associated with the RestroxAi Platform.
            </p>
          </div>

          {/* Explanation (styled like the session/error banners in AuthPage) */}
          <div style={{
            background: '#fff5f5',
            border: '1px solid #fca5a5',
            color: '#D32F2F',
            fontSize: 13,
            padding: '12px 14px',
            borderRadius: 8,
            lineHeight: 1.7,
            fontWeight: 500,
            marginBottom: 24,
          }}>
            This might happened if you are using multiple emails on this device or other emails is used to access RestroxAi platform
          </div>

          {/* Back to Login button (matches AuthPage submit button style) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/auth')}
            style={{
              width: '100%',
              padding: '13px',
              background: 'linear-gradient(135deg, #D32F2F, #ff5252)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(211,47,47,0.35)',
              transition: 'background 0.2s, box-shadow 0.2s',
              marginBottom: 20,
            }}
          >
            <ArrowLeft size={18} />
            Back To Login
          </motion.button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px' }}>
            <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
            <span style={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
          </div>

          {/* Support link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: '#777', margin: 0 }}>
            Need help?{' '}
            <a
              href="https://restroxai.in/contact-us"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#D32F2F', fontWeight: 700, fontSize: 13,
                textDecoration: 'underline', textUnderlineOffset: 2,
              }}
            >
              Contact Support
            </a>
          </p>
        </motion.div>
      </main>

      {/* ── Footer (matches AuthPage exactly) ── */}
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
          ©{new Date().getFullYear()} <strong style={{ color: '#777' }}>RestroxAi</strong> — Smart Restaurant POS
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Privacy', url: 'https://restroxai.in/privacy-policy' },
            { label: 'Terms & Conditions', url: 'https://restroxai.in/terms-conditions' },
            { label: 'Support', url: 'https://restroxai.in/contact-us' }
          ].map(link => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 12, color: '#aaa', textDecoration: 'none',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = '#D32F2F'}
              onMouseLeave={e => e.target.style.color = '#aaa'}
            >{link.label}</a>
          ))}
        </div>
      </footer>

      {/* ── Responsive hide illustration on small screens ── */}
      <style>{`
        @media (max-width: 768px) {
          .unf-illustration-col { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default UserNotFoundPage;
