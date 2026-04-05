import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

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
      <AdminSidebar active="Orders" />

      <div style={{ marginLeft: '230px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Manage <span style={{ color: '#3b82f6' }}>Orders</span>
            </h1>
            <p style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{orders.length} total orders</p>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {statuses.map(s => {
              const st = statusStyle(s)
              const isActive = filter === s
              return (
                <button key={s} onClick={() => setFilter(s)} style={{
                  background: isActive ? (s === 'All' ? '#22c55e' : st.bg) : '#0a0a0a',
                  color: isActive ? (s === 'All' ? '#000' : st.color) : '#555',
                  border: isActive ? `1px solid ${s === 'All' ? '#22c55e' : st.border}` : '1px solid #151515',
                  borderRadius: '20px', padding: '5px 14px',
                  fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{s}</button>
              )
            })}
          </div>

          {/* Orders Table */}
          {loading ? (
            <div style={{ color: '#3b82f6', fontSize: '14px' }}>Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
              <div style={{ color: '#444', fontSize: '13px' }}>No orders found</div>
            </div>
          ) : (
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 130px 90px 160px', padding: '10px 18px', background: '#0d0d0d', borderBottom: '1px solid #111' }}>
                {['Order ID', 'Customer', 'Total', 'Status', 'Date', 'Update Status'].map(h => (
                  <div key={h} style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>{h}</div>
                ))}
              </div>
              {filtered.map(order => {
                const s = statusStyle(order.status)
                return (
                  <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 130px 90px 160px', padding: '14px 18px', borderBottom: '1px solid #0d0d0d', alignItems: 'center' }}>
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
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '5px 8px', color: '#ddd', fontSize: '11px', cursor: 'pointer', outline: 'none' }}
                      >
                        {['pending', 'processing', 'shipped', 'completed', 'cancelled'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminOrders