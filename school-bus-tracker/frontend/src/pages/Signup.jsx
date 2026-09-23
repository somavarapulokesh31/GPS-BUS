import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signup } from '../services/api'

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const response = await signup({
        full_name: form.full_name.trim(), email: form.email.trim(),
        phone: form.phone.trim() || null, password: form.password,
      })
      const { access_token, role, user_id, full_name } = response.data
      login({ id: user_id, role, full_name, email: form.email.trim() }, access_token)
      navigate('/parent', { replace: true, state: { accountCreated: true } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Bus Tracker</h1>
        <p>Create a parent account to follow your child's bus.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Full name</label><input name="full_name" value={form.full_name} onChange={update} minLength="2" required /></div>
          <div className="form-group"><label>Email address</label><input name="email" type="email" value={form.email} onChange={update} required /></div>
          <div className="form-group"><label>Phone number (optional)</label><input name="phone" type="tel" value={form.phone} onChange={update} /></div>
          <div className="form-group"><label>Password</label><input name="password" type="password" value={form.password} onChange={update} minLength="8" required /></div>
          <div className="form-group"><label>Confirm password</label><input name="confirmPassword" type="password" value={form.confirmPassword} onChange={update} minLength="8" required /></div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
