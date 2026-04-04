import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle reset password logic here
    navigate('/login')
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

        {/* Text watermarks - subtle */}
        <div className="absolute inset-0 overflow-hidden text-white/5 font-bold text-6xl select-none pointer-events-none">
          <span className="absolute top-[10%] left-[5%]">Bitcoin</span>
          <span className="absolute top-[15%] right-[10%]">Unpaired</span>
          <span className="absolute top-[35%] left-[3%]">Ethereum</span>
          <span className="absolute top-[40%] left-[15%]">ETH</span>
          <span className="absolute top-[55%] left-[5%]">USDT</span>
          <span className="absolute top-[55%] right-[5%]">Sofa</span>
          <span className="absolute top-[70%] left-[8%]">Bitcoin</span>
          <span className="absolute top-[70%] right-[15%]">Open</span>
          <span className="absolute top-[45%] left-[25%]">ONYSC</span>
        </div>
      </div>

      {/* Reset Password Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-[#0a0a0f] p-8 sm:p-10 shadow-2xl border-0">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Reset Password</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm text-white/90">New password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter your password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="bg-[#2a2a35] border-0 text-white placeholder:text-white/40 h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm text-white/90">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-[#2a2a35] border-0 text-white placeholder:text-white/40 h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              className="h-12 bg-[#2a2a35] hover:bg-[#3a3a45] text-white border-0"
              onClick={() => navigate('/login')}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="h-12 bg-[#1ABFA1] hover:bg-[#18a88e] text-black font-semibold"
            >
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
