import logo from '../assets/logo.png'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

function Home() {
  const navigate = useNavigate()
  const [featured, setFeatured] = useState([])
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await supabase.from('products').select('*').limit(3).order('created_at', { ascending: false })
      setFeatured(data || [])
    }
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchFeatured()
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>
      <Navbar active="Home" user={user} onLogout={handleLogout} />

      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '3rem 1.5rem 2rem', gap: '1.2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#0d2d0d', color: '#22c55e', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.3rem 0.9rem', borderRadius: '20px', border: '1px solid #22c55e' }}>
          Your #1 Guitar Shop
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: '800', lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
          Your Sound.<br /><span style={{ color: '#22c55e' }}>Perfected.</span>
        </h1>
        <p style={{ color: '#888', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto' }}>
          Premium guitars, pedals & gear. Order online, track your purchase, and chat with us directly.
        </p>
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/catalog')} style={{ backgroundColor: '#22c55e', color: '#000', padding: '0.75rem 1.8rem', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shop Now</button>
          <button onClick={() => navigate('/catalog')} style={{ backgroundColor: 'transparent', color: '#22c55e', padding: '0.75rem 1.8rem', borderRadius: '8px', border: '1.5px solid #22c55e', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>View Catalog</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', padding: '0 1.5rem 2rem', flexWrap: 'wrap' }}>
        {[{ num: '200+', label: 'Products' }, { num: '500+', label: 'Happy Customers' }, { num: '5★', label: 'Rated Shop' }].map(stat => (
          <div key={stat.label} style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '1rem 1.5rem', textAlign: 'center', flex: '1', minWidth: '100px', maxWidth: '180px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#22c55e' }}>{stat.num}</div>
            <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: '#111', margin: '0 1.5rem' }} />

      {/* Categories */}
      <div style={{ textAlign: 'center', padding: '2rem 1.5rem 1rem' }}>
        <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.6rem)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Shop by <span style={{ color: '#22c55e' }}>Category</span>
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem', padding: '0 1.5rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
        {[
          { icon: '🎸', name: 'Guitars', count: '48 items', bg: '#0d2d0d' },
          { icon: '🎛️', name: 'Pedals', count: '32 items', bg: '#1a0a2e' },
          { icon: '🔊', name: 'Amplifiers', count: '20 items', bg: '#2d1a00' },
          { icon: '🎵', name: 'Accessories', count: '95 items', bg: '#1a0a0a' },
        ].map(cat => (
          <div key={cat.name} onClick={() => navigate('/catalog')} style={{ backgroundColor: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: '14px', padding: '1.2rem 1rem', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem', fontSize: '20px' }}>{cat.icon}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{cat.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#555' }}>{cat.count}</div>
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: '#111', margin: '0 1.5rem' }} />

      {/* Featured Products */}
      <div style={{ textAlign: 'center', padding: '2rem 1.5rem 1rem' }}>
        <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.6rem)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Featured <span style={{ color: '#22c55e' }}>Products</span>
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', padding: '0 1.5rem 2.5rem' }}>
        {featured.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#444', padding: '2rem', fontSize: '13px' }}>No products yet. Add some in the admin panel!</div>
        ) : featured.map(product => (
          <div key={product.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ height: '170px', backgroundColor: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {product.image_url ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '48px' }}>🎸</span>}
            </div>
            <div style={{ padding: '0.8rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '0.2rem' }}>{product.category}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.4rem', color: '#ddd' }}>{product.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: '#22c55e' }}>₱{product.price?.toLocaleString()}</span>
                <button onClick={() => navigate('/catalog')} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '6px', padding: '0.35rem 0.8rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Add to Cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#0d0d0d', borderTop: '1px solid #22c55e', padding: '2rem 1.5rem 1.2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <img src={logo} alt="Perfect Tone" style={{ height: '60px', objectFit: 'contain', marginBottom: '0.8rem' }} />
            <p style={{ color: '#666', fontSize: '0.82rem', lineHeight: 1.7 }}>Perfect Tone is your go-to shop for premium guitars, pedals, amplifiers, and accessories in the Philippines.</p>
          </div>
          <div>
            <h4 style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem' }}>About Us</h4>
            {['Our Story', 'Why Choose Us', 'Our Team', 'Careers'].map(item => (
              <div key={item}><a href="#" style={{ color: '#888', fontSize: '0.82rem', textDecoration: 'none', display: 'block', marginBottom: '0.4rem' }}>{item}</a></div>
            ))}
          </div>
          <div>
            <h4 style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem' }}>Shop</h4>
            {['Guitars', 'Pedals', 'Amplifiers', 'Accessories'].map(item => (
              <div key={item}><a href="#" style={{ color: '#888', fontSize: '0.82rem', textDecoration: 'none', display: 'block', marginBottom: '0.4rem' }}>{item}</a></div>
            ))}
          </div>
          <div>
            <h4 style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem' }}>Contact Us</h4>
            {[
              { icon: '📍', text: '3111 Sto. Rosario, Aliaga, Nueva Ecija, PH' },
              { icon: '📞', text: '+63 912 345 6789' },
              { icon: '📧', text: 'hello@perfecttone.ph' },
              { icon: '🕐', text: 'Mon–Sat, 9AM–6PM' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.82rem' }}>{item.icon}</span>
                <span style={{ color: '#888', fontSize: '0.82rem' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#444' }}>© 2025 Perfect Tone. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {['Privacy Policy', 'Terms of Service', 'FAQ'].map(item => (
              <a key={item} href="#" style={{ color: '#444', fontSize: '0.72rem', textDecoration: 'none' }}>{item}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home