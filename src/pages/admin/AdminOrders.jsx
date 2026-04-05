import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, profiles(full_name, email), order_items(*, products(name, image_url))')
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()
  }, [])

  const updateStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
  }

  const statusStyle = (status) => {
    const map = {
      pending: { bg: '#2d1a0022', color: '#f97316', border: '#f9731633' },
      processing: { bg: '#0a1a3a22', color: '#3b82f6', border: '#3b82f633' },
      shipped: { bg: '#1a0a2e22', color: '#a855f7', border: '#a855f733' },
      completed: { bg: '#0d2d0d22', color: '#22c55e', border: '#22c55e33' },
      cancelled: { bg: '#2d0a0a22', color: '#ef4444', border: '#ef444433' },
    }
    return map[status] || { bg: '#11111122', color: '#888', border: '#88888833' }
  }

  const statuses = ['All', 'pending', 'processing', 'shipped', 'completed', 'cancelled']
  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter)

  return (
    <div style={{ display: 'flex', backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="mobile-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40, display: 'none' }} />
      )}

      <div className="mobile-sidebar-wrapper" style={{ position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-230px', height: '100vh', zIndex: 50, transition: 'left 0.3s ease', width: '230px' }}>
        <AdminSidebar active="Orders" onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="desktop-sidebar-spacer" style={{ width: '230px', flexShrink: 0 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hamburger-btn" style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'none', lineHeight: 1 }}>☰</button>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Manage <span style={{ color: '#3b82f6' }}>Orders</span>
              </h1>
              <p style={{ fontSize: '10px', color: '#444', marginTop: '1px' }}>{orders.length} total orders</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px' }}>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {statuses.map(s => {
              const st = statusStyle(s)
              const isActive = filter === s
              return (
                <button key={s} onClick={() => setFilter(s)} style={{
                  background: isActive ? (s === 'All' ? '#22c55e' : st.bg) : '#0a0a0a',
                  color: isActive ? (s === 'All' ? '#000' : st.color) : '#555',
                  border: isActive ? `1px solid ${s === 'All' ? '#22c55e' : st.border}` : '1px solid #151515',
                  borderRadius: '20px', padding: '5px 12px',
                  fontSize: '10px', fontWeight: '600', cursor: 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{s}</button>
              )
            })}
          </div>

          {/* Orders */}
          {loading ? (
            <div style={{ color: '#3b82f6', fontSize: '14px' }}>Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
              <div style={{ color: '#444', fontSize: '13px' }}>No orders found</div>
            </div>
          ) : (
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden' }}>

              {/* Desktop header */}
              <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 130px 90px 160px', padding: '10px 18px', background: '#0d0d0d', borderBottom: '1px solid #111' }}>
                {['Order ID', 'Customer', 'Total', 'Status', 'Date', 'Update Status'].map(h => (
                  <div key={h} style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>{h}</div>
                ))}
              </div>

              {filtered.map(order => {
                const s = statusStyle(order.status)
                return (
                  <div key={order.id}>
                    {/* Desktop row */}
                    <div className="desktop-row" style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 130px 90px 160px', padding: '14px 18px', borderBottom: '1px solid #0d0d0d', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>#{order.id.slice(0, 8)}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd' }}>{order.profiles?.full_name || 'Unknown'}</div>
                        <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{order.profiles?.email}</div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#22c55e' }}>₱{order.total?.toLocaleString()}</div>
                      <div>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{order.status}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#444' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                      <div>
                        <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '5px 8px', color: '#ddd', fontSize: '11px', cursor: 'pointer', outline: 'none' }}>
                          {['pending', 'processing', 'shipped', 'completed', 'cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Mobile card */}
                    <div className="mobile-card" style={{ display: 'none', padding: '14px 16px', borderBottom: '1px solid #0d0d0d' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: '700', marginBottom: '2px' }}>#{order.id.slice(0, 8)}</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd' }}>{order.profiles?.full_name || 'Unknown'}</div>
                          <div style={{ fontSize: '11px', color: '#444' }}>{order.profiles?.email}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#22c55e', marginBottom: '4px' }}>₱{order.total?.toLocaleString()}</div>
                          <div style={{ fontSize: '10px', color: '#444' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{order.status}</span>
                        <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '6px 10px', color: '#ddd', fontSize: '11px', cursor: 'pointer', outline: 'none', flex: 1 }}>
                          {['pending', 'processing', 'shipped', 'completed', 'cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .mobile-sidebar-wrapper { left: 0 !important; position: fixed !important; }
          .desktop-sidebar-spacer { display: block !important; }
          .hamburger-btn { display: none !important; }
          .mobile-overlay { display: none !important; }
          .table-header { display: grid !important; }
          .desktop-row { display: grid !important; }
          .mobile-card { display: none !important; }
        }
        @media (max-width: 768px) {
          .mobile-sidebar-wrapper { position: fixed !important; }
          .desktop-sidebar-spacer { display: none !important; }
          .hamburger-btn { display: block !important; }
          .mobile-overlay { display: block !important; }
          .table-header { display: none !important; }
          .desktop-row { display: none !important; }
          .mobile-card { display: block !important; }
        }
      `}</style>
    </div>
  )
}

export default AdminOrders