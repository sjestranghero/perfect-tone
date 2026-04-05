import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import Navbar from '../components/Navbar'

function Location() {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>
      <Navbar active="Location" />

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.3rem, 5vw, 2rem)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Find <span style={{ color: '#22c55e' }}>Our Shop</span>
          </h1>
          <p style={{ color: '#555', fontSize: '0.9rem', marginTop: '0.4rem' }}>Visit us in person and try our gear!</p>
        </div>

        {/* Map always on top */}
        <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden', marginBottom: '1rem' }}>
          <iframe
            title="Perfect Tone Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3853.123!2d120.8306255!3d15.4980117!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396d78fe06!2s3111+Sto.+Rosario+Aliaga+Nueva+Ecija!5e0!3m2!1sen!2sph!4v1"
            width="100%"
            height="260"
            style={{ border: 'none', display: 'block' }}
            allowFullScreen=""
            loading="lazy"
          />
        </div>

        {/* Info Card below map */}
        <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center', paddingBottom: '14px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'center' }}>
            <img src={logo} alt="Perfect Tone" style={{ height: '70px', width: '70px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #22c55e' }} />
          </div>

          {[
            { icon: '📍', label: 'Address', value: '3111 Sto. Rosario, Aliaga, Nueva Ecija, Philippines' },
            { icon: '📞', label: 'Phone', value: '+63 912 345 6789' },
            { icon: '📧', label: 'Email', value: 'hello@perfecttone.ph' },
            { icon: '🕐', label: 'Hours', value: 'Mon–Sat: 9AM – 6PM\nSunday: Closed' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0d2d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', color: '#ddd', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.value}</div>
              </div>
            </div>
          ))}

          <button
            onClick={() => window.open('https://maps.google.com/?q=3111+Sto.+Rosario+Aliaga+Nueva+Ecija+Philippines', '_blank')}
            style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Open in Google Maps
          </button>

          <button
            onClick={() => navigate('/messages')}
            style={{ background: 'transparent', color: '#22c55e', border: '1px solid #22c55e22', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            💬 Message Us
          </button>
        </div>
      </div>
    </div>
  )
}

export default Location