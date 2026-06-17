import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:5000/api/auth/register', { email, password })
      alert('Registered successfully. Now login!')
      navigate('/login')
    } catch (err) {
      alert('Register failed: ' + err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="auth-form">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email}
               onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password}
               onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Register</button>
      </form>
    </div>
  )
}
