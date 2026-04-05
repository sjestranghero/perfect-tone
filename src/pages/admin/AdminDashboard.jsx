import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ products: 0, orders: 0, messages: 0, customers: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [products, orders, messages, customers] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        products: products.count || 0,
        orders: orders.count || 0,
        messages: messages.count || 0,
        customers: customers.count || 0,
      })
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentOrders(ordersData || [])
      setLoading(false)
    }
    fetchData()
  }, [])

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

  return (
    <div style={{ display: 'flex', backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>
      <AdminSidebar active="Dashboard" />

      <div style={{ marginLeft: '230px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Dashboard <span style={{ color: '#22c55e' }}>Overview</span>
            </h1>
            <p style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>Welcome back, Admin — Perfect Tone Shop</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: '#666' }}>
              🔔 Notifications
            </div>
            <button onClick={() => navigate('/admin/products')} style={{
              background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px',
              padding: '8px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>+ Add Product</button>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>

          {/* KPI Cards */}
          {loading ? (
            <div style={{ color: '#22c55e', fontSize: '14px' }}>Loading...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                  { icon: '🎸', label: 'Total Products', value: stats.products, color: '#22c55e', bg: '#0d2d0d', accent: '#22c55e', trend: '+3 new' },
                  { icon: '📦', label: 'Total Orders', value: stats.orders, color: '#3b82f6', bg: '#0a1a3a', accent: '#3b82f6', trend: '+2 today' },
                  { icon: '💬', label: 'Messages', value: stats.messages, color: '#a855f7', bg: '#1a0a2e', accent: '#a855f7', trend: 'unread' },
                  { icon: '👤', label: 'Customers', value: stats.customers, color: '#f97316', bg: '#2d1a00', accent: '#f97316', trend: '+1 new' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: stat.accent, borderRadius: '14px 14px 0 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{stat.icon}</div>
                      <div style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', background: stat.bg, color: stat.color }}>{stat.trend}</div>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: stat.color, lineHeight: 1, marginBottom: '4px' }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Orders + Activity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '14px', marginBottom: '24px' }}>

                {/* Recent Orders */}
                <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>Recent Orders</div>
                    <div onClick={() => navigate('/admin/orders')} style={{ fontSize: '11px', color: '#22c55e', cursor: 'pointer' }}>View all →</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 80px', padding: '10px 18px', background: '#0d0d0d' }}>
                    {['Customer', 'Amount', 'Status', 'Date'].map(h => (
                      <div key={h} style={{ fontSize: '10px', color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>{h}</div>
                    ))}
                  </div>
                  {recentOrders.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#333', fontSize: '13px' }}>No orders yet</div>
                  ) : recentOrders.map(order => {
                    const s = statusStyle(order.status)
                    return (
                      <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 80px', padding: '12px 18px', borderBottom: '1px solid #0d0d0d', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>#{order.id.slice(0, 6)}</div>
                          <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>{order.profiles?.full_name || 'Unknown'}</div>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700' }}>₱{order.total?.toLocaleString()}</div>
                        <div>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{order.status}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#333' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Activity Feed */}
                <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #111' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>Recent Activity</div>
                  </div>
                  {[
                    { dot: '#22c55e', text: 'New order placed', time: '2m ago' },
                    { dot: '#a855f7', text: 'New message received', time: '15m ago' },
                    { dot: '#3b82f6', text: 'Order status updated', time: '1h ago' },
                    { dot: '#f97316', text: 'New customer registered', time: '3h ago' },
                    { dot: '#22c55e', text: 'Product stock updated', time: '5h ago' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '12px 18px', borderBottom: '1px solid #0d0d0d', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                      <div style={{ fontSize: '12px', color: '#777', flex: 1 }}>{item.text}</div>
                      <div style={{ fontSize: '10px', color: '#333' }}>{item.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {[
                  { icon: '🎸', title: 'Manage Products', sub: 'Add, edit or remove items', bg: '#0d2d0d', path: '/admin/products' },
                  { icon: '📦', title: 'Manage Orders', sub: 'Update order statuses', bg: '#0a1a3a', path: '/admin/orders' },
                  { icon: '💬', title: 'View Messages', sub: 'Reply to customers', bg: '#1a0a2e', path: '/admin/messages' },
                ].map(card => (
                  <div key={card.title} onClick={() => navigate(card.path)} style={{
                    background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px',
                    padding: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
                  }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{card.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd' }}>{card.title}</div>
                      <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{card.sub}</div>
                    </div>
                    <div style={{ color: '#333', fontSize: '18px' }}>›</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard