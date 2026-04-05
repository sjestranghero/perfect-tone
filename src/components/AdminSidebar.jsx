import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'

function AdminSidebar({ active }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const menuItems = [
    { label: 'Dashboard', path: '/admin', badge: null, color: '#22c55e' },
    { label: 'Products', path: '/admin/products', badge: null, color: '#555' },
    { label: 'Orders', path: '/admin/orders', badge: null, color: '#555' },
    { label: 'Messages', path: '/admin/messages', badge: null, color: '#555' },
  ]

  return (
    <div style={{
      width: '230px', background: '#080808', borderRight: '1px solid #181818',
      display: 'flex', flexDirection: 'column', position: 'fixed',
      height: '100vh', zIndex: 100, fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* Brand */}
      <div style={{ padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', borderBottom: '1px solid #181818' }}>
        <img src={logo} alt="Perfect Tone" style={{ width: '78px', height: '78px', borderRadius: '50%', border: '2px solid #22c55e', objectFit: 'cover' }} />
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Perfect Tone</div>
        <div style={{ fontSize: '10px', color: '#22c55e', letterSpacing: '0.15em', textTransform: 'uppercase', background: '#0d2d0d', padding: '3px 10px', borderRadius: '20px', border: '1px solid #22c55e33' }}>Admin Panel</div>
      </div>

      {/* Menu */}
      <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '9px', color: '#333', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 8px 4px' }}>Main</div>
        {menuItems.slice(0, 2).map(item => (
          <div key={item.label} onClick={() => navigate(item.path)} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
            color: active === item.label ? '#22c55e' : '#555',
            background: active === item.label ? '#0d2d0d' : 'transparent',
            border: active === item.label ? '1px solid #22c55e22' : '1px solid transparent',
            fontSize: '13px', fontWeight: '500',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active === item.label ? '#22c55e' : '#333', flexShrink: 0 }} />
            {item.label}
          </div>
        ))}

        <div style={{ fontSize: '9px', color: '#333', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '12px 8px 4px' }}>Management</div>
        {menuItems.slice(2).map(item => (
          <div key={item.label} onClick={() => navigate(item.path)} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
            color: active === item.label ? '#22c55e' : '#555',
            background: active === item.label ? '#0d2d0d' : 'transparent',
            border: active === item.label ? '1px solid #22c55e22' : '1px solid transparent',
            fontSize: '13px', fontWeight: '500',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active === item.label ? '#22c55e' : '#333', flexShrink: 0 }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* User + Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid #181818' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#111', borderRadius: '10px', border: '1px solid #1a1a1a', marginBottom: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0d2d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#22c55e', fontWeight: '700', flexShrink: 0 }}>A</div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#ddd' }}>Admin</div>
            <div style={{ fontSize: '10px', color: '#444' }}>admin@perfecttone.ph</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          width: '100%', background: 'transparent', color: '#ef444488',
          border: '1px solid #ef444433', borderRadius: '8px', padding: '8px',
          fontSize: '11px', fontWeight: '600', cursor: 'pointer',
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>Sign Out</button>
      </div>

    </div>
  )
}

export default AdminSidebar