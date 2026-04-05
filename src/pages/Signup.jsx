import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import logo from '../assets/logo.png'

function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Insert into profiles table so name/email is available everywhere
    if (data?.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        phone: phone,
        role: 'customer',
      })
      if (profileError) {
        // If insert fails (e.g. profile already exists), try upsert
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          email: email,
          phone: phone,
          role: 'customer',
        })
      }
    }

    setLoading(false)
    navigate('/login')
  }

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #22c55e', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <img src={logo} alt="Perfect Tone" style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #22c55e' }} />
        </div>

        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '800', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
          Create Account
        </h2>
        <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', marginBottom: '2rem' }}>
          Join Perfect Tone today
        </p>

        {error && (
          <div style={{ backgroundColor: '#2d0a0a', border: '1px solid #ef4444', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {[
          { label: 'Full Name', value: fullName, setter: setFullName, type: 'text', placeholder: 'Juan dela Cruz' },
          { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'you@email.com' },
          { label: 'Phone', value: phone, setter: setPhone, type: 'text', placeholder: '+63 912 345 6789' },
          { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: '••••••••' },
        ].map(field => (
          <div key={field.label} style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>{field.label}</label>
            <input
              type={field.type}
              value={field.value}
              onChange={e => field.setter(e.target.value)}
              placeholder={field.placeholder}
              style={{ width: '100%', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        ))}

        <button
          onClick={handleSignup}
          disabled={loading}
          style={{ width: '100%', backgroundColor: '#22c55e', color: '#000', padding: '0.85rem', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: '600' }}>Login</Link>
        </p>

      </div>
    </div>
  )
}

export default Signup