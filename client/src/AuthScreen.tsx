import { useState, type FormEvent } from 'react'
import { apiRequest } from './lib/api'
import './AuthScreen.css'

type User = {
  id: string
  name: string
  email: string
  beanBalance?: number
}

type AuthScreenProps = {
  onAuthenticated: (user: User) => void
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (mode === 'register' && password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    setBusy(true)

    try {
      const result = await apiRequest<User>(
        mode === 'login' ? '/auth/login' : '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(
            mode === 'login'
              ? { email, password }
              : { name: name.trim(), email, password, confirmPassword },
          ),
        },
      )

      if (!result.data) {
        throw new Error('The server did not return your account details.')
      }

      onAuthenticated(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-cup" aria-hidden="true">☕</div>
        <p className="auth-eyebrow">A LITTLE SPACE JUST FOR YOU</p>
        <h1>daily brew<span>♡</span></h1>
        <p className="auth-subtitle">
          Your cozy corner for little habits, mindful spending and everyday moments.
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'selected' : ''}
            onClick={() => { setMode('login'); setError('') }}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'selected' : ''}
            onClick={() => { setMode('register'); setError('') }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <label>
              Your name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="What should we call you?"
                autoComplete="name"
                required
                maxLength={100}
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
          </label>

          {mode === 'register' && (
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Type your password again"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy
              ? 'One little moment...'
              : mode === 'login'
                ? 'Come on in ♡'
                : 'Create my cozy space ♡'}
          </button>
        </form>

        <p className="auth-footer">Small steps still count. You belong here.</p>
      </section>
    </main>
  )
}
