import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, ChevronRight, Check, Upload } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { apiCall } from '@/lib/api'

// Currency data with flags
const currencies = [
    { code: 'USD', flag: '🇺🇸', name: 'USD' },
    { code: 'GBP', flag: '🇬🇧', name: 'GBP' },
    { code: 'CHF', flag: '🇨🇭', name: 'CHF' },
    { code: 'EUR', flag: '🇪🇺', name: 'EUR' },
    { code: 'YEN', flag: '🇯🇵', name: 'YEN' },
]

interface SystemSettingsData {
    // General Settings
    defaultCurrency: string
    defaultLanguage: string
    dateFormat: string
    
    // System Configurations
    networkSettings: string
    dataRefreshInterval: string
    depositFee: number
    withdrawalFee: number
    dailyLimit: number
    weeklyLimit: number
    minWithdrawal: number
    maxWithdrawal: number
    liquidityAlert: string
    userWalletCreation: boolean
    
    // Notification Settings
    transactionAlert: boolean
    priceAlert: boolean
    securityAlert: boolean
    systemUpdate: boolean
    
    // Compliance & Security
    require2FA: boolean
    transactionMonitoring: string
    dailyTransactionLimit: number
    
    // Customization
    supportedCurrencies: Array<{ code: string; enabled: boolean }>
    supportedLanguages: Array<{ code: string; name: string; enabled: boolean }>
    homepageWidgets: Array<{ name: string; enabled: boolean }>
    lightModeLogo?: string
    darkModeLogo?: string
}

export function SystemSettingsPage() {
    const [activeTab, setActiveTab] = useState('general')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [settings, setSettings] = useState<SystemSettingsData>({
        defaultCurrency: 'USD',
        defaultLanguage: 'English',
        dateFormat: '12h',
        networkSettings: 'RPC provider',
        dataRefreshInterval: '30 mins',
        depositFee: 10,
        withdrawalFee: 10,
        dailyLimit: 10000,
        weeklyLimit: 50000,
        minWithdrawal: 10,
        maxWithdrawal: 100000,
        liquidityAlert: 'Hot wallet > 1 BTC',
        userWalletCreation: true,
        transactionAlert: true,
        priceAlert: true,
        securityAlert: true,
        systemUpdate: true,
        require2FA: true,
        transactionMonitoring: 'Flags amount above $5000',
        dailyTransactionLimit: 10000,
        supportedCurrencies: [
            { code: 'USD', enabled: true },
            { code: 'EUR', enabled: true },
            { code: 'CAD', enabled: true },
            { code: 'GBP', enabled: true }
        ],
        supportedLanguages: [
            { code: 'en', name: 'English', enabled: true },
            { code: 'fr', name: 'French', enabled: false },
            { code: 'de', name: 'German', enabled: false },
            { code: 'pl', name: 'Polish', enabled: false },
            { code: 'es', name: 'Spanish', enabled: false },
            { code: 'sv', name: 'Swedish', enabled: false }
        ],
        homepageWidgets: [
            { name: 'Portfolio', enabled: true },
            { name: 'Crypto prices', enabled: true },
            { name: 'Referrals', enabled: true },
            { name: 'Recent activities', enabled: true }
        ]
    })

    // UI state
    const [showTransactionFee, setShowTransactionFee] = useState(false)
    const [showTransactionLimit, setShowTransactionLimit] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const response = await apiCall('/admin/settings')
            if (response) {
                setSettings(prevSettings => ({
                    ...prevSettings,
                    ...response,
                    // Ensure arrays exist with defaults if not in response
                    supportedCurrencies: response.supportedCurrencies || prevSettings.supportedCurrencies,
                    supportedLanguages: response.supportedLanguages || prevSettings.supportedLanguages,
                    homepageWidgets: response.homepageWidgets || prevSettings.homepageWidgets
                }))
            }
            setError(null)
        } catch (err) {
            console.error('Error fetching settings:', err)
            setError('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }


    const updateGeneralSettings = async () => {
        try {
            await apiCall('/admin/settings/general', 'PUT', {
                defaultCurrency: settings.defaultCurrency,
                defaultLanguage: settings.defaultLanguage,
                dateFormat: settings.dateFormat
            })
            alert('General settings updated successfully')
        } catch (err) {
            console.error('Error updating general settings:', err)
            alert('Failed to update general settings')
        }
    }

    const updateTransactionFees = async () => {
        try {
            await apiCall('/admin/settings/fees', 'PUT', {
                depositFee: settings.depositFee,
                withdrawalFee: settings.withdrawalFee
            })
            alert('Transaction fees updated successfully')
        } catch (err) {
            console.error('Error updating transaction fees:', err)
            alert('Failed to update transaction fees')
        }
    }

    const updateTransactionLimits = async () => {
        try {
            await apiCall('/admin/settings/limits', 'PUT', {
                dailyLimit: settings.dailyLimit,
                weeklyLimit: settings.weeklyLimit,
                minWithdrawal: settings.minWithdrawal,
                maxWithdrawal: settings.maxWithdrawal,
                liquidityAlert: settings.liquidityAlert
            })
            alert('Transaction limits updated successfully')
        } catch (err) {
            console.error('Error updating transaction limits:', err)
            alert('Failed to update transaction limits')
        }
    }

    const updateNotificationSettings = async () => {
        try {
            await apiCall('/admin/settings/notifications', 'PUT', {
                transactionAlert: settings.transactionAlert,
                priceAlert: settings.priceAlert,
                securityAlert: settings.securityAlert,
                systemUpdate: settings.systemUpdate
            })
            alert('Notification settings updated successfully')
        } catch (err) {
            console.error('Error updating notification settings:', err)
            alert('Failed to update notification settings')
        }
    }

    const updateComplianceSettings = async () => {
        try {
            await apiCall('/admin/settings/compliance', 'PUT', {
                require2FA: settings.require2FA,
                transactionMonitoring: settings.transactionMonitoring,
                dailyTransactionLimit: settings.dailyTransactionLimit
            })
            alert('Compliance settings updated successfully')
        } catch (err) {
            console.error('Error updating compliance settings:', err)
            alert('Failed to update compliance settings')
        }
    }

    const updateCustomizationSettings = async () => {
        try {
            await apiCall('/admin/settings/customization', 'PUT', {
                supportedCurrencies: settings.supportedCurrencies,
                supportedLanguages: settings.supportedLanguages,
                homepageWidgets: settings.homepageWidgets
            })
            alert('Customization settings updated successfully')
        } catch (err) {
            console.error('Error updating customization settings:', err)
            alert('Failed to update customization settings')
        }
    }

    if (loading) {
        return (
            <DashboardLayout title="System Settings">
                <div className="flex items-center justify-center h-64">
                    <div className="text-[#6D767E] text-lg font-medium">Loading settings...</div>
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout title="System Settings">
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-red-400 text-lg font-medium">Error loading settings</div>
                        <div className="text-[#6D767E] text-sm">{error}</div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title="System Settings">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Tab Navigation */}
                <div className="overflow-x-auto scrollbar-hide mb-6">
                    <TabsList className="w-full justify-start bg-transparent border-b border-[#2a2a35] rounded-none h-auto p-0 flex min-w-max">
                        {[
                            { value: 'general', label: 'General Settings' },
                            { value: 'configurations', label: 'System Configurations' },
                            { value: 'notifications', label: 'Notifications Settings' },
                            { value: 'compliance', label: 'Compliance & Security' },
                            { value: 'customization', label: 'Customization' }
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="relative rounded-none bg-transparent px-4 py-3 pb-4 text-muted-foreground transition-all duration-200 hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none group"
                            >
                                {tab.label}
                                <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 bg-[#1ABFA1] transition-transform duration-200 group-data-[state=active]:scale-x-100 rounded-full" />
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>


                {/* General Settings Tab */}
                <TabsContent value="general" className="mt-0">
                    <div className="rounded-xl border border-border bg-card">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 p-4 border-b border-border">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">System Configuration</span>
                        </div>

                        <div className="flex">
                            {/* Left Side - Settings List */}
                            <div className="flex-1 border-r border-border">
                                {/* Default Currency Display */}
                                <div
                                    className="flex items-center justify-between p-4 border-b border-border cursor-pointer hover:bg-secondary/50"
                                    onClick={() => { }}
                                >
                                    <div>
                                        <div className="text-sm font-medium">Default Currency Display</div>
                                        <div className="text-xs text-muted-foreground">Set the primary fiat currency</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {settings.defaultCurrency}
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>

                                {/* Default Language */}
                                <div
                                    className="flex items-center justify-between p-4 border-b border-border cursor-pointer hover:bg-secondary/50"
                                    onClick={() => { }}
                                >
                                    <div>
                                        <div className="text-sm font-medium">Default language</div>
                                        <div className="text-xs text-muted-foreground">Select the default language for system</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {settings.defaultLanguage}
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>

                                {/* Date and Time Format */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50"
                                    onClick={() => { }}
                                >
                                    <div>
                                        <div className="text-sm font-medium">Date and time format</div>
                                        <div className="text-xs text-muted-foreground">Choose your preferred date and time format</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {settings.dateFormat}
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Currency Selection Panel */}
                            <div className="w-80 p-4">
                                <div className="text-sm font-medium mb-4">Default Currency</div>
                                <div className="space-y-2">
                                    {currencies.map((currency) => (
                                        <div
                                            key={currency.code}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${settings.defaultCurrency === currency.code
                                                ? 'bg-secondary/50'
                                                : 'hover:bg-secondary/30'
                                                }`}
                                            onClick={() => setSettings(prev => ({ ...prev, defaultCurrency: currency.code }))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{currency.flag}</span>
                                                <span className="text-sm">{currency.name}</span>
                                            </div>
                                            {settings.defaultCurrency === currency.code ? (
                                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="h-3 w-3 text-primary-foreground" />
                                                </div>
                                            ) : (
                                                <div className="h-5 w-5 rounded-full border border-muted-foreground/30" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={updateGeneralSettings}>
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* System Configurations Tab */}
                <TabsContent value="configurations" className="mt-0">
                    <div className="rounded-xl border border-border bg-card">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 p-4 border-b border-border">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">System Configuration</span>
                        </div>

                        <div className="flex">
                            {/* Left Side - Settings List */}
                            <div className="flex-1 border-r border-border">
                                {/* Network Settings */}
                                <div
                                    className="flex items-center justify-between p-4 border-b border-border cursor-pointer hover:bg-secondary/50"
                                    onClick={() => { }}
                                >
                                    <div>
                                        <div className="text-sm font-medium">Network Settings</div>
                                        <div className="text-xs text-muted-foreground">Manage supported blockchain networks</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {settings.networkSettings}
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>

                                {/* Data Refresh Interval */}
                                <div
                                    className="flex items-center justify-between p-4 border-b border-border cursor-pointer hover:bg-secondary/50"
                                    onClick={() => { }}
                                >
                                    <div>
                                        <div className="text-sm font-medium">Data refresh interval</div>
                                        <div className="text-xs text-muted-foreground">Select the default language for system</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {settings.dataRefreshInterval}
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>

                                {/* Transaction Fee */}
                                <div
                                    className="flex items-center justify-between p-4 border-b border-border cursor-pointer hover:bg-secondary/50"
                                    onClick={() => setShowTransactionFee(!showTransactionFee)}
                                >
                                    <div>
                                        <div className="text-sm font-medium">Transaction fee</div>
                                        <div className="text-xs text-muted-foreground">Choose your preferred date and time format</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>

                                {/* Transaction Limit */}
                                <div
                                    className="flex items-center justify-between p-4 border-b border-border cursor-pointer hover:bg-secondary/50"
                                    onClick={() => setShowTransactionLimit(!showTransactionLimit)}
                                >
                                    <div>
                                        <div className="text-sm font-medium">Transaction limit</div>
                                        <div className="text-xs text-muted-foreground">Choose your preferred date and time format</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>

                                {/* User Wallet Creation */}
                                <div className="flex items-center justify-between p-4">
                                    <div>
                                        <div className="text-sm font-medium">User wallet creation</div>
                                        <div className="text-xs text-muted-foreground">Choose your preferred date and time format</div>
                                    </div>
                                    <Switch
                                        checked={settings.userWalletCreation}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, userWalletCreation: checked }))}
                                    />
                                </div>
                            </div>

                            {/* Right Side - Dynamic Panel based on selection */}
                            <div className="w-80 p-4">
                                {showTransactionFee && !showTransactionLimit && (
                                    <>
                                        <div className="text-sm font-medium mb-4">Transaction fee</div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-2 block">Deposit</label>
                                                <Input
                                                    value={settings.depositFee.toString()}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, depositFee: parseFloat(e.target.value) || 0 }))}
                                                    className="bg-secondary border-border"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-2 block">Withdrawal</label>
                                                <Input
                                                    value={settings.withdrawalFee.toString()}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, withdrawalFee: parseFloat(e.target.value) || 0 }))}
                                                    className="bg-secondary border-border"
                                                />
                                            </div>
                                        </div>
                                        <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={updateTransactionFees}>
                                            Save
                                        </Button>
                                    </>
                                )}

                                {showTransactionLimit && !showTransactionFee && (
                                    <>
                                        <div className="text-sm font-medium mb-4">Transaction limit</div>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-2 block">Daily/user</label>
                                                <Input
                                                    value={settings.dailyLimit.toString()}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, dailyLimit: parseFloat(e.target.value) || 0 }))}
                                                    className="bg-secondary border-border"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-2 block">Weekly/user</label>
                                                <Input
                                                    value={settings.weeklyLimit.toString()}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, weeklyLimit: parseFloat(e.target.value) || 0 }))}
                                                    className="bg-secondary border-border"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-2 block">Minimum withdrawal</label>
                                                <Input
                                                    value={settings.minWithdrawal.toString()}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, minWithdrawal: parseFloat(e.target.value) || 0 }))}
                                                    className="bg-secondary border-border"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-2 block">Maximum withdrawal</label>
                                                <Input
                                                    value={settings.maxWithdrawal.toString()}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, maxWithdrawal: parseFloat(e.target.value) || 0 }))}
                                                    className="bg-secondary border-border"
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="text-xs text-muted-foreground mb-2 block">Liquidity alert</label>
                                            <Select value={settings.liquidityAlert} onValueChange={(value) => setSettings(prev => ({ ...prev, liquidityAlert: value }))}>
                                                <SelectTrigger className="bg-secondary border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Hot wallet > 1 BTC">Hot wallet {'>'} 1 BTC</SelectItem>
                                                    <SelectItem value="Hot wallet > 5 BTC">Hot wallet {'>'} 5 BTC</SelectItem>
                                                    <SelectItem value="Hot wallet > 10 BTC">Hot wallet {'>'} 10 BTC</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={updateTransactionLimits}>
                                            Save
                                        </Button>
                                    </>
                                )}

                                {!showTransactionFee && !showTransactionLimit && (
                                    <>
                                        <div className="text-sm font-medium mb-4">Transaction fee</div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-2 block">Deposit</label>
                                                <Input
                                                    value={settings.depositFee.toString()}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, depositFee: parseFloat(e.target.value) || 0 }))}
                                                    className="bg-secondary border-border"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-2 block">Withdrawal</label>
                                                <Input
                                                    value={settings.withdrawalFee.toString()}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, withdrawalFee: parseFloat(e.target.value) || 0 }))}
                                                    className="bg-secondary border-border"
                                                />
                                            </div>
                                        </div>
                                        <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={updateTransactionFees}>
                                            Save
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Notifications Settings Tab */}
                <TabsContent value="notifications" className="mt-0">
                    <div className="rounded-xl border border-border bg-card">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 p-4 border-b border-border">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Notifications Settings</span>
                        </div>

                        <div className="divide-y divide-border">
                            {/* Transaction Alert */}
                            <div className="flex items-center justify-between p-4">
                                <div>
                                    <div className="text-sm font-medium">Transaction Alert</div>
                                    <div className="text-xs text-muted-foreground">Get notified instantly when a user sends, receives, or swaps crypto assets</div>
                                </div>
                                <Switch
                                    checked={settings.transactionAlert}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, transactionAlert: checked }))}
                                />
                            </div>

                            {/* Price Alert */}
                            <div className="flex items-center justify-between p-4">
                                <div>
                                    <div className="text-sm font-medium">Price Alert</div>
                                    <div className="text-xs text-muted-foreground">Receive alerts when token prices rise or fall beyond your set thresholds</div>
                                </div>
                                <Switch
                                    checked={settings.priceAlert}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, priceAlert: checked }))}
                                />
                            </div>

                            {/* Security Alert */}
                            <div className="flex items-center justify-between p-4">
                                <div>
                                    <div className="text-sm font-medium">Security Alert</div>
                                    <div className="text-xs text-muted-foreground">Stay informed about suspicious activity, failed login attempts</div>
                                </div>
                                <Switch
                                    checked={settings.securityAlert}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, securityAlert: checked }))}
                                />
                            </div>

                            {/* System Update */}
                            <div className="flex items-center justify-between p-4">
                                <div>
                                    <div className="text-sm font-medium">System Update</div>
                                    <div className="text-xs text-muted-foreground">Get notified about LEGERIUM version updates, maintenance schedules</div>
                                </div>
                                <Switch
                                    checked={settings.systemUpdate}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, systemUpdate: checked }))}
                                />
                            </div>
                        </div>
                        
                        {/* Save Button for Notifications */}
                        <div className="p-4 border-t border-border">
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={updateNotificationSettings}>
                                Save Notification Settings
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Compliance & Security Tab */}
                <TabsContent value="compliance" className="mt-0">
                    <div className="rounded-xl border border-border bg-card">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 p-4 border-b border-border">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Notifications Settings</span>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* KYC Settings */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3">KYC Settings</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary/70"
                                    >
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1">Required Documents</div>
                                            <div className="text-sm">Passport, ID card, National Passport</div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div
                                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary/70"
                                    >
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1">Verification level</div>
                                            <div className="text-sm">Advanced</div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>

                            {/* AML Thresholds */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3">AML Thresholds</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-2 block">Transaction monitoring</label>
                                        <Select value={settings.transactionMonitoring} onValueChange={(value) => setSettings(prev => ({ ...prev, transactionMonitoring: value }))}>
                                            <SelectTrigger className="bg-secondary border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Flags amount above $5000">Flags amount above $5000</SelectItem>
                                                <SelectItem value="Flags amount above $10000">Flags amount above $10000</SelectItem>
                                                <SelectItem value="Flags amount above $25000">Flags amount above $25000</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-2 block">Daily transaction limit</label>
                                        <Input
                                            value={settings.dailyTransactionLimit.toString()}
                                            onChange={(e) => setSettings(prev => ({ ...prev, dailyTransactionLimit: parseFloat(e.target.value) || 0 }))}
                                            className="bg-secondary border-border"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Two-Factor Authentication */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3">Two- Factor Authentication</h3>
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={settings.require2FA}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, require2FA: checked }))}
                                    />
                                    <span className="text-sm">Require 2FA for withdrawal</span>
                                </div>
                            </div>
                            
                            {/* Save Button for Compliance */}
                            <div className="pt-4">
                                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={updateComplianceSettings}>
                                    Save Compliance Settings
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Customization Tab */}
                <TabsContent value="customization" className="mt-0">
                    <div className="rounded-xl border border-border bg-card">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 p-4 border-b border-border">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Customization</span>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Logo Section */}
                            <div>
                                <h3 className="text-sm font-semibold mb-4">Logo</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="aspect-[3/1] bg-[#1a1a25] rounded-lg border border-[#2a2a35] flex items-center justify-center cursor-pointer hover:bg-[#222230] transition-colors">
                                            <Upload className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">Light mode logo</p>
                                    </div>
                                    <div>
                                        <div className="aspect-[3/1] bg-[#1a1a25] rounded-lg border border-[#2a2a35] flex items-center justify-center cursor-pointer hover:bg-[#222230] transition-colors">
                                            <Upload className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">Dark mode logo</p>
                                    </div>
                                </div>
                            </div>

                            {/* Currency Section */}
                            <div>
                                <h3 className="text-sm font-semibold mb-4 text-[#1ABFA1]">Currency</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    {settings.supportedCurrencies.map((currency) => (
                                        <div key={currency.code} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                                            <Switch 
                                                checked={currency.enabled} 
                                                onCheckedChange={(checked) => {
                                                    const updatedCurrencies = settings.supportedCurrencies.map(c => 
                                                        c.code === currency.code ? { ...c, enabled: checked } : c
                                                    )
                                                    setSettings(prev => ({ ...prev, supportedCurrencies: updatedCurrencies }))
                                                }} 
                                            />
                                            <span className="text-sm font-medium">{currency.code}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground font-medium block">Default currency</label>
                                    <Select value={settings.defaultCurrency} onValueChange={(value) => setSettings(prev => ({ ...prev, defaultCurrency: value }))}>
                                        <SelectTrigger className="bg-secondary border-border h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0f] border-[#2a2a35] rounded-xl shadow-2xl">
                                            {settings.supportedCurrencies.filter(c => c.enabled).map(currency => (
                                                <SelectItem key={currency.code} value={currency.code}>{currency.code}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="h-px bg-border/50 my-6" />

                            {/* Language Section */}
                            <div>
                                <h3 className="text-sm font-semibold mb-4 text-[#1ABFA1]">Language</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                    {settings.supportedLanguages.map((lang) => (
                                        <div key={lang.code} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                                            <Switch 
                                                checked={lang.enabled} 
                                                onCheckedChange={(checked) => {
                                                    const updatedLanguages = settings.supportedLanguages.map(l => 
                                                        l.code === lang.code ? { ...l, enabled: checked } : l
                                                    )
                                                    setSettings(prev => ({ ...prev, supportedLanguages: updatedLanguages }))
                                                }} 
                                            />
                                            <span className="text-sm font-medium">{lang.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground font-medium block">Default language</label>
                                    <Select value={settings.defaultLanguage} onValueChange={(value) => setSettings(prev => ({ ...prev, defaultLanguage: value }))}>
                                        <SelectTrigger className="bg-secondary border-border h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0f] border-[#2a2a35] rounded-xl shadow-2xl">
                                            {settings.supportedLanguages.filter(l => l.enabled).map(lang => (
                                                <SelectItem key={lang.code} value={lang.name}>{lang.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="h-px bg-border/50 my-6" />

                            {/* Homepage widgets Section */}
                            <div>
                                <h3 className="text-sm font-semibold mb-4 text-[#1ABFA1]">Homepage widgets</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {settings.homepageWidgets.map((widget) => (
                                        <div key={widget.name} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                                            <Switch 
                                                checked={widget.enabled} 
                                                onCheckedChange={(checked) => {
                                                    const updatedWidgets = settings.homepageWidgets.map(w => 
                                                        w.name === widget.name ? { ...w, enabled: checked } : w
                                                    )
                                                    setSettings(prev => ({ ...prev, homepageWidgets: updatedWidgets }))
                                                }} 
                                            />
                                            <span className="text-sm font-medium">{widget.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Save Button */}
                            <Button 
                                className="w-full h-12 bg-[#1ABFA1] hover:bg-[#18a88e] text-black font-semibold text-base"
                                onClick={updateCustomizationSettings}
                            >
                                Save settings
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    )
}
