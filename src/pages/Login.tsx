import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      await login(email, password)
    } catch (error) {
      setError('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient wave background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #5b7a8a 0%, #7a8b9a 20%, #8b7d8a 40%, #9a7a8a 60%, #7a6b7a 80%, #5b6a7a 100%)'
          }}
        />

        {/* Wave overlay - top left */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 120% 80% at 0% 20%, rgba(91, 140, 160, 0.8) 0%, transparent 50%),
              radial-gradient(ellipse 100% 60% at 10% 60%, rgba(120, 160, 180, 0.6) 0%, transparent 40%),
              radial-gradient(ellipse 80% 50% at 100% 80%, rgba(140, 100, 140, 0.7) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 90% 20%, rgba(100, 120, 140, 0.5) 0%, transparent 40%)
            `
          }}
        />

        {/* Curved wave effect */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
          style={{ opacity: 0.3 }}
        >
          <path
            d="M0,100 Q300,200 600,150 T1200,200 L1200,0 L0,0 Z"
            fill="rgba(91, 140, 160, 0.4)"
          />
          <path
            d="M0,700 Q400,600 800,700 T1200,650 L1200,800 L0,800 Z"
            fill="rgba(140, 100, 140, 0.4)"
          />
        </svg>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-[#0a0a0f] p-8 sm:p-10 shadow-2xl border-0">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome Back</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-white/90">Email Address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="bg-[#2a2a35] border-0 text-white placeholder:text-white/40 h-12 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-white/90">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="bg-[#2a2a35] border-0 text-white placeholder:text-white/40 h-12 disabled:opacity-50"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#1ABFA1] hover:bg-[#18a88e] text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                Signing in...
              </div>
            ) : (
              'Sign in'
            )}
          </Button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Forgot password
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
