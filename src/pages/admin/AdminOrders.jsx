import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, image_url))')
        .order('created_at', { ascending: false })

      if (error) { console.error('Error fetching orders:', error); setLoading(false); return }

      const enriched = await Promise.all(
        (data || []).map(async (order) => {
          try {
            const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', order.user_id).single()
            return { ...order, profiles: profile || null }
          } catch { return { ...order, profiles: null } }
        })
      )
      setOrders(enriched)
      setLoading(false)
    }
    fetchOrders()
  }, [])

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) { console.error('Update error:', error); return }
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
  }

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

  // Parse customer info from the notes field
  const parseNotes = (notes) => {
    if (!notes) return {}
    const lines = notes.split('\n')
    const result = {}
    lines.forEach(line => {
      if (line.startsWith('Name: ')) result.name = line.replace('Name: ', '')
      else if (line.startsWith('Email: ')) result.email = line.replace('Email: ', '')
      else if (line.startsWith('Phone: ')) result.phone = line.replace('Phone: ', '')
      else if (line.startsWith('Address: ')) result.address = line.replace('Address: ', '')
      else if (line.startsWith('Notes: ')) result.extra = line.replace('Notes: ', '')
    })
    return result
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
                  borderRadius: '20px', padding: '5px 12px', fontSize: '10px', fontWeight: '600',
                  cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{s}</button>
              )
            })}
          </div>

          {loading ? (
            <div style={{ color: '#3b82f6', fontSize: '14px' }}>Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
              <div style={{ color: '#444', fontSize: '13px' }}>No orders found</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(order => {
                const s = statusStyle(order.status)
                const info = parseNotes(order.notes)
                const isExpanded = expandedOrder === order.id

                return (
                  <div key={order.id} style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden' }}>

                    {/* Order header row */}
                    <div style={{ padding: '14px 16px', borderBottom: isExpanded ? '1px solid #111' : 'none', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

                      {/* Order ID + date */}
                      <div style={{ minWidth: '100px' }}>
                        <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: '700' }}>#{order.id.slice(0, 8)}</div>
                        <div style={{ fontSize: '10px', color: '#444', marginTop: '2px' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                      </div>

                      {/* Customer info */}
                      <div style={{ flex: 1, minWidth: '140px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd' }}>
                          {info.name || order.profiles?.full_name || `User ${order.user_id?.slice(0, 6)}`}
                        </div>
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>
                          {info.email || order.profiles?.email || '—'}
                        </div>
                        {info.phone && <div style={{ fontSize: '11px', color: '#555' }}>{info.phone}</div>}
                      </div>

                      {/* Total */}
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#22c55e', minWidth: '80px' }}>
                        ₱{order.total?.toLocaleString()}
                      </div>

                      {/* Status badge */}
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        {order.status}
                      </span>

                      {/* Update status */}
                      <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                        style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '6px 8px', color: '#ddd', fontSize: '11px', cursor: 'pointer', outline: 'none' }}>
                        {['pending', 'processing', 'shipped', 'completed', 'cancelled'].map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>

                      {/* Expand toggle */}
                      <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '6px 10px', color: '#888', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {isExpanded ? 'Hide ▲' : 'Details ▼'}
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ padding: '14px 16px', display: 'grid', gap: '14px' }} className="order-details-grid">

                        {/* Customer details card */}
                        <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '12px' }}>
                          <div style={{ fontSize: '10px', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginBottom: '10px' }}>👤 Customer Details</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {[
                              { label: 'Full Name', value: info.name || order.profiles?.full_name || '—' },
                              { label: 'Email', value: info.email || order.profiles?.email || '—' },
                              { label: 'Phone', value: info.phone || '—' },
                              { label: 'Address', value: info.address || '—' },
                              ...(info.extra ? [{ label: 'Notes', value: info.extra }] : []),
                            ].map(row => (
                              <div key={row.label} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                                <span style={{ color: '#555', minWidth: '70px', flexShrink: 0 }}>{row.label}:</span>
                                <span style={{ color: '#ccc' }}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order items card */}
                        <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '12px' }}>
                          <div style={{ fontSize: '10px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginBottom: '10px' }}>📦 Order Items</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {order.order_items?.map(item => (
                              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#111', overflow: 'hidden', flexShrink: 0 }}>
                                  {item.products?.image_url
                                    ? <img src={item.products.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎸</div>
                                  }
                                </div>
                                <div style={{ flex: 1, fontSize: '12px', color: '#ccc' }}>{item.products?.name}</div>
                                <div style={{ fontSize: '11px', color: '#555' }}>x{item.quantity}</div>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#22c55e' }}>₱{item.price?.toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
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
          .order-details-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          .mobile-sidebar-wrapper { position: fixed !important; }
          .desktop-sidebar-spacer { display: none !important; }
          .hamburger-btn { display: block !important; }
          .mobile-overlay { display: block !important; }
          .order-details-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default AdminOrders