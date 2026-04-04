import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { DashboardPage } from '@/pages/Dashboard'
import { LoginPage } from '@/pages/Login'
import { ResetPasswordPage } from '@/pages/ResetPassword'
import { UserManagementPage } from '@/pages/UserManagement'
import { KYCVerificationPage } from '@/pages/KYCVerification'
import { WalletFundsPage } from '@/pages/WalletFunds'
import { TradingManagementPage } from '@/pages/TradingManagement'
import { MarketPricePage } from '@/pages/MarketPrice'
import { OrdersHistoryPage } from '@/pages/OrdersHistory'
import { CampaignPromoPage } from '@/pages/CampaignPromo'
import { AcademyPage } from '@/pages/Academy'
import { SystemSettingsPage } from '@/pages/SystemSettings'
import { RolesPermissionsPage } from '@/pages/RolesPermissions'
import { NotificationsPage } from '@/pages/Notifications'
import { StakingManagementPage } from '@/pages/StakingManagement'
import { LiquidationManagementPage } from '@/pages/LiquidationManagement'

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// App Routes component (needs to be inside AuthProvider)
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/forgot-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
      <Route path="/kyc" element={<ProtectedRoute><KYCVerificationPage /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><WalletFundsPage /></ProtectedRoute>} />
      <Route path="/trading" element={<ProtectedRoute><TradingManagementPage /></ProtectedRoute>} />
      <Route path="/liquidation" element={<ProtectedRoute><LiquidationManagementPage /></ProtectedRoute>} />
      <Route path="/staking" element={<ProtectedRoute><StakingManagementPage /></ProtectedRoute>} />
      <Route path="/market" element={<ProtectedRoute><MarketPricePage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersHistoryPage /></ProtectedRoute>} />
      <Route path="/campaigns" element={<ProtectedRoute><CampaignPromoPage /></ProtectedRoute>} />
      <Route path="/academy" element={<ProtectedRoute><AcademyPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/roles" element={<ProtectedRoute><RolesPermissionsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SystemSettingsPage /></ProtectedRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <TooltipProvider>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </TooltipProvider>
  )
}

export default App
