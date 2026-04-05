import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

function Navbar({ active, user, cartCount, onLogout }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { label: 'Home', path: '/' },
    { label: 'Catalog', path: '/catalog' },
    { label: 'Orders', path: '/orders' },
    { label: 'Messages', path: '/messages' },
    { label: 'Location', path: '/location' },
  ]

  return (
    <>
      <nav style={{
        backgroundColor: '#080808',
        borderBottom: '1px solid #181818',
        padding: '0 1.2rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <img
          src={logo}
          alt="Perfect Tone"
          style={{ height: '44px', objectFit: 'contain', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />

        {/* Desktop nav — hidden on mobile via CSS */}
        <div className="desktop-nav">
          {links.map(link => (
            <a
              key={link.label}
              onClick={(e) => { e.preventDefault(); navigate(link.path) }}
              href="#"
              style={{
                color: link.label === active ? '#22c55e' : '#666',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.88rem',
              }}
            >
              {link.label}
            </a>
          ))}
          {cartCount !== undefined && (
            <div onClick={() => navigate('/cart')} style={{ background: '#111', border: '1px solid #1a1a1a', color: '#ddd', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              🛒 <span style={{ color: '#22c55e', fontWeight: '700' }}>{cartCount}</span>
            </div>
          )}
          {user ? (
            <>
              <div onClick={() => navigate('/orders')} style={{ background: '#111', border: '1px solid #1a1a1a', color: '#ddd', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>My Orders</div>
              {onLogout && (
                <button onClick={onLogout} style={{ background: 'transparent', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ef444433', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Logout</button>
              )}
            </>
          ) : (
            <button onClick={() => navigate('/login')} style={{ backgroundColor: '#22c55e', color: '#000', padding: '7px 16px', borderRadius: '6px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase' }}>Login</button>
          )}
        </div>

        {/* Mobile right side — cart + hamburger */}
        <div className="mobile-nav">
          {cartCount !== undefined && (
            <div onClick={() => navigate('/cart')} style={{ background: '#111', border: '1px solid #1a1a1a', color: '#ddd', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              🛒 <span style={{ color: '#22c55e' }}>{cartCount}</span>
            </div>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '7px 11px', cursor: 'pointer', color: '#fff', fontSize: '18px', lineHeight: 1 }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          background: '#0a0a0a',
          borderBottom: '1px solid #181818',
          zIndex: 99,
          padding: '8px 0',
        }}>
          {links.map(link => (
            <div
              key={link.label}
              onClick={() => { navigate(link.path); setMenuOpen(false) }}
              style={{
                padding: '13px 20px',
                color: link.label === active ? '#22c55e' : '#aaa',
                fontSize: '14px',
                fontWeight: link.label === active ? '700' : '500',
                cursor: 'pointer',
                borderBottom: '1px solid #111',
              }}
            >
              {link.label}
            </div>
          ))}
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {user ? (
              <>
                <div
                  onClick={() => { navigate('/orders'); setMenuOpen(false) }}
                  style={{ background: '#111', color: '#ddd', padding: '11px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' }}
                >
                  My Orders
                </div>
                {onLogout && (
                  <button
                    onClick={() => { onLogout(); setMenuOpen(false) }}
                    style={{ background: 'transparent', color: '#ef4444', padding: '11px 14px', borderRadius: '8px', border: '1px solid #ef444433', fontWeight: '700', fontSize: '13px', cursor: 'pointer', width: '100%' }}
                  >
                    Logout
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => { navigate('/login'); setMenuOpen(false) }}
                style={{ width: '100%', backgroundColor: '#22c55e', color: '#000', padding: '11px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        .desktop-nav {
          display: none;
          align-items: center;
          gap: 1.4rem;
        }
        .mobile-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mobile-menu {
          display: block;
        }
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav { display: none !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </>
  )
}

export default Navbar