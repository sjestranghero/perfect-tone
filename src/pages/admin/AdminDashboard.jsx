import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ products: 0, orders: 0, messages: 0, customers: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminName, setAdminName] = useState('Admin')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      // Get admin name
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
        if (profile?.full_name) setAdminName(profile.full_name)
      }

      const [products, orders, messages, customers] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
      ])

      setStats({
        products: products.count || 0,
        orders: orders.count || 0,
        messages: messages.count || 0,
        customers: customers.count || 0,
      })

      // Recent orders with profile join
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentOrders(ordersData || [])

      // Build real activity feed from actual data
      const activityItems = []

      // Latest orders
      const { data: recentOrdersRaw } = await supabase
        .from('orders')
        .select('id, created_at, status, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(3)

      recentOrdersRaw?.forEach(o => {
        if (o.status === 'pending') {
          activityItems.push({ dot: '#22c55e', text: `New order from ${o.profiles?.full_name || 'a customer'}`, time: o.created_at })
        } else {
          activityItems.push({ dot: '#3b82f6', text: `Order #${o.id.slice(0, 6)} marked as ${o.status}`, time: o.created_at })
        }
      })

      // Latest messages
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('id, created_at, sender:profiles!messages_sender_id_fkey(full_name, role)')
        .order('created_at', { ascending: false })
        .limit(3)

      recentMessages?.forEach(m => {
        if (m.sender?.role !== 'admin') {
          activityItems.push({ dot: '#a855f7', text: `Message from ${m.sender?.full_name || 'a customer'}`, time: m.created_at })
        }
      })

      // Latest customers
      const { data: recentCustomers } = await supabase
        .from('profiles')
        .select('full_name, created_at')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })
        .limit(2)

      recentCustomers?.forEach(c => {
        activityItems.push({ dot: '#f97316', text: `${c.full_name || 'New customer'} registered`, time: c.created_at })
      })

      // Sort all activity by time, newest first
      activityItems.sort((a, b) => new Date(b.time) - new Date(a.time))
      setActivity(activityItems.slice(0, 6))

      setLoading(false)
    }
    fetchData()
  }, [])

  const statusStyle = (status) => {
    const map = {
      pending:    { bg: '#2d1a0022', color: '#f97316', border: '#f9731633' },
      processing: { bg: '#0a1a3a22', color: '#3b82f6', border: '#3b82f633' },
      shipped:    { bg: '#1a0a2e22', color: '#a855f7', border: '#a855f733' },
      completed:  { bg: '#0d2d0d22', color: '#22c55e', border: '#22c55e33' },
      cancelled:  { bg: '#2d0a0a22', color: '#ef4444', border: '#ef444433' },
    }
    return map[status] || { bg: '#11111122', color: '#888', border: '#88888833' }
  }

  const kpiCards = [
    { icon: '🎸', label: 'Total Products', value: stats.products, color: '#22c55e', bg: '#0d2d0d', border: '#22c55e', path: '/admin/products' },
    { icon: '📦', label: 'Total Orders',   value: stats.orders,   color: '#3b82f6', bg: '#0a1a3a', border: '#3b82f6', path: '/admin/orders' },
    { icon: '💬', label: 'Messages',       value: stats.messages, color: '#a855f7', bg: '#1a0a2e', border: '#a855f7', path: '/admin/messages' },
    { icon: '👤', label: 'Customers',      value: stats.customers, color: '#f97316', bg: '#2d1a00', border: '#f97316', path: null },
  ]

  return (
    <div style={{ display: 'flex', backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="mob-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 40, display: 'none' }} />
      )}

      <div className="mob-sidebar" style={{ position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-230px', height: '100vh', zIndex: 50, transition: 'left 0.28s ease', width: '230px' }}>
        <AdminSidebar active="Dashboard" onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="desk-spacer" style={{ width: '230px', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* ── Topbar ── */}
        <div style={{ padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#08080a', borderBottom: '1px solid #141418', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ham-btn" style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'none', lineHeight: 1 }}>☰</button>
            <div>
              <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '600' }}>Perfect Tone</div>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.02em', lineHeight: 1.1 }}>
                Dashboard <span style={{ color: '#22c55e' }}>Overview</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: '#555', marginRight: '4px' }}>Welcome, <span style={{ color: '#ddd', fontWeight: '600' }}>{adminName}</span></div>
            <button onClick={() => navigate('/admin/products')} style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>+ Add Product</button>
          </div>
        </div>

        <div style={{ padding: '20px', flex: 1 }}>
          {loading ? (
            <div style={{ color: '#22c55e', fontSize: '14px', padding: '2rem' }}>Loading...</div>
          ) : (
            <>
              {/* ── KPI Cards ── */}
              <div className="kpi-grid" style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                {kpiCards.map(card => (
                  <div
                    key={card.label}
                    onClick={() => card.path && navigate(card.path)}
                    style={{
                      background: '#0a0a0c',
                      border: `1px solid #1c1c22`,
                      borderRadius: '16px',
                      padding: '20px',
                      cursor: card.path ? 'pointer' : 'default',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => { if (card.path) e.currentTarget.style.borderColor = card.border + '55' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1c1c22' }}
                  >
                    {/* top accent bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${card.border}, transparent)` }} />
                    {/* glow blob */}
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: card.border + '11', filter: 'blur(20px)' }} />

                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '16px' }}>{card.icon}</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: card.color, lineHeight: 1, marginBottom: '6px', fontVariantNumeric: 'tabular-nums' }}>{card.value}</div>
                    <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Orders + Activity ── */}
              <div className="main-grid" style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>

                {/* Recent Orders */}
                <div style={{ background: '#0a0a0c', border: '1px solid #1c1c22', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555' }}>Recent Orders</div>
                    <div onClick={() => navigate('/admin/orders')} style={{ fontSize: '11px', color: '#22c55e', cursor: 'pointer', fontWeight: '600' }}>View all →</div>
                  </div>
                  {recentOrders.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#333', fontSize: '13px' }}>No orders yet</div>
                  ) : recentOrders.map((order, i) => {
                    const s = statusStyle(order.status)
                    return (
                      <div
                        key={order.id}
                        onClick={() => navigate('/admin/orders')}
                        style={{ padding: '14px 18px', borderBottom: i < recentOrders.length - 1 ? '1px solid #0f0f12' : 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#111'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>📦</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                            <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: '700' }}>#{order.id.slice(0, 7)}</span>
                            <span style={{ fontSize: '12px', color: '#888', fontWeight: '500' }}>{order.profiles?.full_name || 'Unknown'}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{order.status}</span>
                            <span style={{ fontSize: '10px', color: '#333' }}>{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#ddd', whiteSpace: 'nowrap' }}>₱{order.total?.toLocaleString()}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Real Activity Feed */}
                <div style={{ background: '#0a0a0c', border: '1px solid #1c1c22', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555' }}>Recent Activity</div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                  </div>
                  {activity.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#333', fontSize: '13px' }}>No activity yet</div>
                  ) : activity.map((item, i) => (
                    <div key={i} style={{ padding: '13px 18px', borderBottom: i < activity.length - 1 ? '1px solid #0f0f12' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.dot, flexShrink: 0, boxShadow: `0 0 5px ${item.dot}88` }} />
                      <div style={{ fontSize: '12px', color: '#888', flex: 1 }}>{item.text}</div>
                      <div style={{ fontSize: '10px', color: '#333', whiteSpace: 'nowrap' }}>{timeAgo(item.time)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Quick Actions ── */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: '12px' }}>Quick Actions</div>
                <div className="qa-grid" style={{ display: 'grid', gap: '12px' }}>
                  {[
                    { icon: '🎸', title: 'Manage Products', sub: 'Add, edit or remove items',  accent: '#22c55e', bg: '#0d2d0d', path: '/admin/products' },
                    { icon: '📦', title: 'Manage Orders',   sub: 'Update order statuses',      accent: '#3b82f6', bg: '#0a1a3a', path: '/admin/orders' },
                    { icon: '💬', title: 'View Messages',   sub: 'Reply to customers',         accent: '#a855f7', bg: '#1a0a2e', path: '/admin/messages' },
                  ].map(card => (
                    <div
                      key={card.title}
                      onClick={() => navigate(card.path)}
                      style={{ background: '#0a0a0c', border: '1px solid #1c1c22', borderRadius: '14px', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'border-color 0.2s, background 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = card.accent + '44'; e.currentTarget.style.background = '#0f0f14' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1c1c22'; e.currentTarget.style.background = '#0a0a0c' }}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{card.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd', marginBottom: '2px' }}>{card.title}</div>
                        <div style={{ fontSize: '11px', color: '#444' }}>{card.sub}</div>
                      </div>
                      <div style={{ color: card.accent, fontSize: '20px', opacity: 0.6 }}>›</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .mob-sidebar  { left: 0 !important; position: fixed !important; }
          .desk-spacer  { display: block !important; }
          .ham-btn      { display: none !important; }
          .mob-overlay  { display: none !important; }
          .kpi-grid     { grid-template-columns: repeat(4, 1fr) !important; }
          .main-grid    { grid-template-columns: 1fr 320px !important; }
          .qa-grid      { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .mob-sidebar  { position: fixed !important; }
          .desk-spacer  { display: none !important; }
          .ham-btn      { display: block !important; }
          .mob-overlay  { display: block !important; }
          .kpi-grid     { grid-template-columns: repeat(2, 1fr) !important; }
          .main-grid    { grid-template-columns: 1fr !important; }
          .qa-grid      { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default AdminDashboard