import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import logo from '../assets/logo.png'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #22c55e', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
  <img src={logo} alt="Perfect Tone" style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #22c55e' }} />
</div>

        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '800', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
          Welcome Back
        </h2>
        <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', marginBottom: '2rem' }}>
          Login to your Perfect Tone account
        </p>

        {error && (
          <div style={{ backgroundColor: '#2d0a0a', border: '1px solid #ef4444', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            style={{ width: '100%', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', backgroundColor: '#22c55e', color: '#000', padding: '0.85rem', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', marginTop: '1.5rem' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: '600' }}>Sign Up</Link>
        </p>

      </div>
    </div>
  )
}

export default Login