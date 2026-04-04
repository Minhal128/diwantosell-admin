import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { apiCall } from "@/lib/api"
import { cn } from "@/lib/utils"

// Icons
export const BitcoinIcon = () => (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path d="M21.5 13.125C21.9 12.125 21.6 10.925 20.4 10.325C19.5 9.825 18.2 9.725 17.5 9.825V7H15.5V9.725H14V7H12V9.925C11.6 9.825 11.2 9.825 11.2 9.825H9.5V12.125H10.8C11.1 12.125 11.4 12.225 11.4 12.625V20.725C11.4 21.025 11.1 21.125 10.8 21.125H9.5V23.425H11.3C11.6 23.425 11.9 23.325 12.1 23.325V26H14V23.225H15.5V26H17.5V23.125C18.6 23.125 20 22.925 20.8 22.125C21.7 21.225 21.9 19.925 21.3 18.925C20.8 18.225 20.2 17.725 19.3 17.525C20.4 17.225 21.2 16.425 21.5 15.325V13.125ZM17.3 19.925C17.3 20.825 16 20.825 14.8 20.825V18.025C16 18.025 17.3 18.025 17.3 18.825V19.925ZM16.8 14.725C16.8 15.625 15.6 15.625 14.8 15.625V13.025C15.6 13.025 16.8 13.025 16.8 13.825V14.725Z" fill="white" />
    </svg>
)

export const EthIcon = () => (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <path d="M16 4L15.6 5.3V21.1L16 21.5L23.4 17.1L16 4Z" fill="white" fillOpacity="0.602" />
        <path d="M16 4L8.6 17.1L16 21.5V12.7V4Z" fill="white" />
        <path d="M16 22.6L15.8 22.8V27.6L16 28.2L23.4 17.8L16 22.6Z" fill="white" fillOpacity="0.602" />
        <path d="M16 28.2V22.6L8.6 17.8L16 28.2Z" fill="white" />
        <path d="M16 21.5L23.4 17.1L16 12.7V21.5Z" fill="#C0CBF6" />
        <path d="M8.6 17.1L16 21.5V12.7L8.6 17.1Z" fill="#C0CBF6" />
    </svg>
)

export const SolIcon = () => (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#000000" />
        <path d="M7.5 9.2L7.85 8.7H21.25L21.6 9.2L24.3 11.9L23.95 12.4H10.55L10.2 11.9L7.5 9.2ZM7.5 20.4L7.85 19.9H21.25L21.6 20.4L24.3 23.1L23.95 23.6H10.55L10.2 23.1L7.5 20.4ZM10.55 14.3H23.95L24.3 14.8L21.6 17.5L21.25 18H7.84998L7.49998 17.5L10.2 14.8L10.55 14.3Z" fill="url(#paint0_linear_sol)" />
        <defs>
            <linearGradient id="paint0_linear_sol" x1="22.25" y1="21.6" x2="9.55" y2="10.7" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00FFA3" />
                <stop offset="1" stopColor="#DC1FFF" />
            </linearGradient>
        </defs>
    </svg>
)

interface TransactionFormProps {
    type: 'deposit' | 'withdraw'
    user: any
    onBack: () => void
    onSuccess: () => void
    onRefresh?: () => void
}

function TransactionForm({ type, user, onBack, onSuccess, onRefresh }: TransactionFormProps) {
    const [asset, setAsset] = useState('USDT')
    const [amount, setAmount] = useState('')
    const [isVisible, setIsVisible] = useState(true)
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!amount || isNaN(Number(amount))) {
            alert('Please enter a valid amount')
            return
        }

        setLoading(true)
        try {
            // Backend expects type: 'add' or 'remove'
            const adjustType = type === 'deposit' ? 'add' : 'remove'
            await apiCall(`/admin/users/${user._id}/adjust-balance`, 'POST', {
                amount: Number(amount),
                asset,
                type: adjustType,
                isVisible,
                adminNote: `${type === 'deposit' ? 'Manual Deposit' : 'Manual Withdrawal'} by Admin`
            })
            alert(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`)
            onSuccess()
            if (onRefresh) onRefresh()
        } catch (error: any) {
            console.error('Error adjusting balance:', error)
            alert(error.message || 'Failed to adjust balance')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#0E0D15] text-white">
            <div className="flex items-center gap-2 p-6 pb-2 border-b-0 shrink-0">
                <Button variant="ghost" size="icon" className="h-6 w-6 -ml-2 text-[#6D767E] hover:text-white" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-lg font-bold text-white capitalize">{type}</DialogTitle>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
                <div className="space-y-2">
                    <Label className="text-[#6D767E] font-normal text-xs">Coin</Label>
                    <Select value={asset} onValueChange={setAsset}>
                        <SelectTrigger className="w-full bg-[#0E0D15] border-[#2A2933] text-white h-11 focus:ring-0 focus:ring-offset-0">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-[#26A17B] flex items-center justify-center text-[10px] font-bold">
                                    {asset.charAt(0)}
                                </div>
                                <SelectValue placeholder="Select coin" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A25] border-[#2A2933] text-white">
                            <SelectItem value="USDT">USDT</SelectItem>
                            <SelectItem value="BTC">BTC</SelectItem>
                            <SelectItem value="ETH">ETH</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-[#6D767E] font-normal text-xs">Amount</Label>
                    <Input
                        type="number"
                        placeholder="Enter coin amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-[#0E0D15] border-[#2A2933] text-white h-11 placeholder:text-[#3F3E46] focus-visible:ring-0 focus-visible:border-primary"
                    />
                </div>

                <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                        id="isVisible"
                        checked={isVisible}
                        onCheckedChange={(checked) => setIsVisible(!!checked)}
                        className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                    />
                    <Label htmlFor="isVisible" className="text-sm text-white cursor-pointer select-none">
                        Show in user transaction history
                    </Label>
                </div>

                <div className="space-y-2">
                    <Label className="text-[#6D767E] font-normal text-xs">Admin Verification Password</Label>
                    <Input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-[#0E0D15] border-[#2A2933] text-white h-11 placeholder:text-[#3F3E46] focus-visible:ring-0 focus-visible:border-primary"
                    />
                </div>

                <div className="pt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-[#06AE7A] hover:bg-[#06AE7A]/90 text-white font-bold h-11 text-base capitalize"
                    >
                        {loading ? 'Processing...' : type}
                    </Button>
                </div>
            </div>
        </div>
    )
}

interface WalletTransferFormProps {
    user: any
    onBack: () => void
    onSuccess: () => void
}

function WalletTransferForm({ user, onBack, onSuccess }: WalletTransferFormProps) {
    const [direction, setDirection] = useState<'spot-to-futures' | 'futures-to-spot'>('spot-to-futures')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)

    const spotBal = typeof user?.balance === 'number' ? user.balance : 0
    const futuresBal = typeof user?.futuresBalance === 'number' ? user.futuresBalance : 0
    const maxAmount = direction === 'spot-to-futures' ? spotBal : futuresBal

    const handleSubmit = async () => {
        const num = parseFloat(amount)
        if (!num || isNaN(num) || num <= 0) { alert('Enter a valid amount'); return }
        if (num > maxAmount) { alert(`Insufficient ${direction === 'spot-to-futures' ? 'spot' : 'futures'} balance`); return }
        setLoading(true)
        try {
            const from = direction === 'spot-to-futures' ? 'spot' : 'futures'
            const to   = direction === 'spot-to-futures' ? 'futures' : 'spot'
            await apiCall(`/admin/users/${user._id}/wallet-transfer`, 'POST', {
                from, to, amount: num,
                adminNote: `Admin wallet transfer: ${from} → ${to}`
            })
            alert('Transfer successful!')
            onSuccess()
        } catch (error: any) {
            alert(error.message || 'Transfer failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#0E0D15] text-white">
            <div className="flex items-center gap-2 p-6 pb-2 border-b-0 shrink-0">
                <Button variant="ghost" size="icon" className="h-6 w-6 -ml-2 text-[#6D767E] hover:text-white" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-lg font-bold text-white">Wallet Transfer</DialogTitle>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
                {/* Current Balances */}
                <div className="bg-[#14121B] rounded-xl border border-[#2A2933] p-4 flex justify-between">
                    <div className="text-center">
                        <div className="text-xs text-[#6D767E] mb-1">Spot Balance</div>
                        <div className="text-white font-bold">${spotBal.toLocaleString()}</div>
                    </div>
                    <div className="w-px bg-[#2A2933]" />
                    <div className="text-center">
                        <div className="text-xs text-[#6D767E] mb-1">Futures Balance</div>
                        <div className="text-white font-bold">${futuresBal.toLocaleString()}</div>
                    </div>
                </div>

                {/* Direction Toggle */}
                <div className="space-y-2">
                    <Label className="text-[#6D767E] font-normal text-xs">Transfer Direction</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setDirection('spot-to-futures')}
                            className={cn(
                                'h-11 rounded-lg border text-sm font-medium transition-colors',
                                direction === 'spot-to-futures'
                                    ? 'bg-[#06AE7A] border-[#06AE7A] text-black'
                                    : 'bg-[#14121B] border-[#2A2933] text-[#6D767E] hover:text-white'
                            )}
                        >
                            Spot → Futures
                        </button>
                        <button
                            onClick={() => setDirection('futures-to-spot')}
                            className={cn(
                                'h-11 rounded-lg border text-sm font-medium transition-colors',
                                direction === 'futures-to-spot'
                                    ? 'bg-[#06AE7A] border-[#06AE7A] text-black'
                                    : 'bg-[#14121B] border-[#2A2933] text-[#6D767E] hover:text-white'
                            )}
                        >
                            Futures → Spot
                        </button>
                    </div>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-[#6D767E] font-normal text-xs">Amount (USDT)</Label>
                        <button
                            className="text-xs text-[#06AE7A] hover:underline"
                            onClick={() => setAmount(maxAmount.toFixed(2))}
                        >
                            Max: ${maxAmount.toLocaleString()}
                        </button>
                    </div>
                    <Input
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-[#0E0D15] border-[#2A2933] text-white h-11 placeholder:text-[#3F3E46] focus-visible:ring-0 focus-visible:border-primary"
                    />
                </div>

                <div className="pt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-[#06AE7A] hover:bg-[#06AE7A]/90 text-white font-bold h-11 text-base"
                    >
                        {loading ? 'Transferring...' : `Transfer to ${direction === 'spot-to-futures' ? 'Futures' : 'Spot'}`}
                    </Button>
                </div>
            </div>
        </div>
    )
}

interface UserDetailsPanelProps {
    user: any
    isOpen: boolean
    onClose: () => void
    onRefresh?: () => void
}

export function UserDetailsPanel({ user, isOpen, onClose, onRefresh }: UserDetailsPanelProps) {
    if (!user && !isOpen) return null;

    const [view, setView] = useState<'details' | 'deposit' | 'withdraw' | 'transfer'>('details');
    const [userTransactions, setUserTransactions] = useState<any[]>([]);
    const [txLoading, setTxLoading] = useState(false);

    const fetchUserTransactions = async () => {
        if (!user?._id) return;
        setTxLoading(true);
        try {
            const data = await apiCall('/admin/transactions');
            const allTx = Array.isArray(data) ? data : (data.transactions || []);
            // Filter transactions for this specific user
            const filtered = allTx.filter((tx: any) => {
                const txUserId = typeof tx.user === 'object' ? tx.user?._id : tx.user;
                return txUserId === user._id;
            });
            setUserTransactions(filtered.slice(0, 10)); // Show latest 10
        } catch (error) {
            console.error('Failed to fetch user transactions:', error);
            setUserTransactions([]);
        } finally {
            setTxLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && user?._id) {
            fetchUserTransactions();
        }
    }, [isOpen, user?._id]);

    const handleClose = () => {
        setView('details');
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-[450px] max-h-[80vh] flex flex-col bg-[#0E0D15] border border-[#2A2933] text-white p-0 gap-0 overflow-hidden my-auto">
                {view === 'details' ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-2 border-b-0 shrink-0">
                            <DialogTitle className="text-lg font-bold text-white">User Details</DialogTitle>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <div className="px-6 py-2">

                                {/* User Profile */}
                                <div className="flex items-start gap-3 mb-6">
                                    <Avatar className="h-12 w-12 bg-gray-200">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="text-black font-bold text-lg">
                                            {user?.name ? user.name.charAt(0).toUpperCase() : "J"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="font-bold text-lg leading-none">{user?.name || "James Dominic"}</h3>
                                        <span className="text-sm text-[#6D767E]">{user?.email || "jamesdom@gmail.com"}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            {user?.country && (() => {
                                                const countryCodeMap: Record<string, string> = {
                                                    'Afghanistan': 'af', 'Albania': 'al', 'Algeria': 'dz', 'Argentina': 'ar',
                                                    'Australia': 'au', 'Austria': 'at', 'Bangladesh': 'bd', 'Belgium': 'be',
                                                    'Brazil': 'br', 'Canada': 'ca', 'Chile': 'cl', 'China': 'cn',
                                                    'Colombia': 'co', 'Czech Republic': 'cz', 'Denmark': 'dk', 'Egypt': 'eg',
                                                    'Ethiopia': 'et', 'Finland': 'fi', 'France': 'fr', 'Germany': 'de',
                                                    'Ghana': 'gh', 'Greece': 'gr', 'Hungary': 'hu', 'India': 'in',
                                                    'Indonesia': 'id', 'Iran': 'ir', 'Iraq': 'iq', 'Ireland': 'ie',
                                                    'Israel': 'il', 'Italy': 'it', 'Japan': 'jp', 'Jordan': 'jo',
                                                    'Kenya': 'ke', 'Kuwait': 'kw', 'Lebanon': 'lb', 'Libya': 'ly',
                                                    'Malaysia': 'my', 'Mexico': 'mx', 'Morocco': 'ma', 'Netherlands': 'nl',
                                                    'New Zealand': 'nz', 'Nigeria': 'ng', 'Norway': 'no', 'Oman': 'om',
                                                    'Pakistan': 'pk', 'Philippines': 'ph', 'Poland': 'pl', 'Portugal': 'pt',
                                                    'Qatar': 'qa', 'Romania': 'ro', 'Russia': 'ru', 'Saudi Arabia': 'sa',
                                                    'Singapore': 'sg', 'South Africa': 'za', 'South Korea': 'kr', 'Spain': 'es',
                                                    'Sri Lanka': 'lk', 'Sudan': 'sd', 'Sweden': 'se', 'Switzerland': 'ch',
                                                    'Syria': 'sy', 'Tanzania': 'tz', 'Thailand': 'th', 'Tunisia': 'tn',
                                                    'Turkey': 'tr', 'Uganda': 'ug', 'Ukraine': 'ua', 'United Arab Emirates': 'ae',
                                                    'United Kingdom': 'gb', 'United States': 'us', 'Venezuela': 've',
                                                    'Vietnam': 'vn', 'Yemen': 'ye', 'Zambia': 'zm', 'Zimbabwe': 'zw'
                                                }
                                                const code = countryCodeMap[user.country] || 'un'
                                                return <img src={`https://flagcdn.com/w20/${code}.png`} alt={user.country} className="h-3 w-auto" />
                                            })()}
                                            <span className="text-xs text-[#6D767E]">{user?.country || "Unknown"}</span>
                                            <span className="text-xs text-[#6D767E] ml-1">ID: #{user?._id?.substring(0, 8) || "46R70HT9"}</span>
                                            {user?.kycStatus === 'verified' && (
                                                <span className="text-xs text-white font-medium ml-1 flex items-center gap-1">
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Wallet Card */}
                                <div className="bg-[#14121B] rounded-xl border border-[#2A2933] p-5 mb-6">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-sm text-[#6D767E] font-medium">Wallet Balance</span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                className="h-8 text-xs bg-[#1A1A25] border border-[#2A2933] text-white hover:bg-[#2A2933] hover:text-white rounded-md px-4 font-medium transition-colors"
                                                onClick={() => setView('withdraw')}
                                            >
                                                Withdraw
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="h-8 text-xs bg-[#1A1A25] border border-[#2A2933] text-white hover:bg-[#2A2933] hover:text-white rounded-md px-4 font-medium transition-colors"
                                                onClick={() => setView('deposit')}
                                            >
                                                Deposit
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-3">
                                        {typeof user?.balance === 'number' ? `$${user.balance.toLocaleString()}` : user?.balance || "$0"}
                                    </div>
                                    {/* Spot / Futures split + Transfer button */}
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex gap-4">
                                            <div>
                                                <div className="text-[10px] text-[#6D767E] uppercase tracking-wider">Spot</div>
                                                <div className="text-white text-sm font-bold">${typeof user?.balance === 'number' ? user.balance.toLocaleString() : '0'}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-[#6D767E] uppercase tracking-wider">Futures</div>
                                                <div className="text-white text-sm font-bold">${typeof user?.futuresBalance === 'number' ? user.futuresBalance.toLocaleString() : '0'}</div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="h-8 text-xs bg-[#06AE7A]/10 border border-[#06AE7A]/40 text-[#06AE7A] hover:bg-[#06AE7A]/20 hover:text-[#06AE7A] rounded-md px-3 font-medium transition-colors"
                                            onClick={() => setView('transfer')}
                                        >
                                            ⇄ Transfer
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-[#6D767E] font-medium mb-3">
                                        <span>Assets</span>
                                        <span>Value</span>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <BitcoinIcon />
                                                <span className="font-bold text-sm text-white">BTC</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white text-sm font-bold">0.0000 BTC</div>
                                                <div className="text-[#6D767E] text-xs font-medium">≈$0.00</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <EthIcon />
                                                <span className="font-bold text-sm text-white">ETH</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white text-sm font-bold">0.00 ETH</div>
                                                <div className="text-[#6D767E] text-xs font-medium">≈$0.00</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <SolIcon />
                                                <span className="font-bold text-sm text-white">SOL</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white text-sm font-bold">0 SOL</div>
                                                <div className="text-[#6D767E] text-xs font-medium">≈$0.00</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activities */}
                                <div className="mb-20">
                                    <h4 className="text-white font-bold mb-3">Recent Activities</h4>
                                    <div className="rounded-xl border border-[#2A2933] bg-[#14121B] overflow-hidden">
                                        <div className="w-full text-left text-sm">
                                            <div className="flex border-b border-[#2A2933] bg-[#1A1A25] h-10 items-center px-4 gap-4">
                                                <div className="w-24 font-bold text-white text-xs">Transaction ID</div>
                                                <div className="flex-1 font-bold text-white text-xs">Type</div>
                                                <div className="w-20 font-bold text-white text-xs">Amount</div>
                                                <div className="w-20 font-bold text-white text-xs">Status</div>
                                            </div>
                                            {txLoading ? (
                                                <div className="p-4 text-center text-[#6D767E] text-xs">
                                                    Loading transactions...
                                                </div>
                                            ) : userTransactions.length === 0 ? (
                                                <div className="p-4 text-center text-[#6D767E] text-xs">
                                                    No recent activity to show
                                                </div>
                                            ) : (
                                                userTransactions.map((tx: any) => (
                                                    <div key={tx._id} className="flex items-center px-4 py-3 gap-4 border-b border-[#1a1a25] last:border-b-0 hover:bg-[#1A1A25] transition-colors">
                                                        <div className="w-24 text-[#6D767E] text-xs font-medium">#{tx._id.slice(-8).toUpperCase()}</div>
                                                        <div className="flex-1 text-white text-xs font-medium capitalize">{tx.type}</div>
                                                        <div className="w-20 text-white text-xs font-bold">${tx.amount?.toLocaleString()}</div>
                                                        <div className="w-20">
                                                            <Badge className={cn(
                                                                "rounded-md px-2 py-0.5 font-bold text-[9px] uppercase tracking-wider",
                                                                tx.status === 'completed'
                                                                    ? 'bg-[#06AE7A] text-black hover:bg-[#06AE7A]/90'
                                                                    : tx.status === 'pending'
                                                                        ? 'bg-[#F59E0B] text-black hover:bg-[#F59E0B]/90'
                                                                        : 'bg-destructive text-white'
                                                            )}>
                                                                {tx.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-[#0E0D15] border-t border-[#1a1a25] flex gap-4">
                            <Button className="flex-1 bg-[#06AE7A] hover:bg-[#06AE7A]/90 text-black font-bold h-11 text-md">
                                Suspend user
                            </Button>
                            <Button className="flex-1 bg-[#1A1A25] hover:bg-[#2A2933] border border-[#2A2933] text-white font-medium h-11 text-md">
                                Reset password
                            </Button>
                        </div>
                    </>
                ) : view === 'transfer' ? (
                    <WalletTransferForm
                        user={user}
                        onBack={() => setView('details')}
                        onSuccess={() => {
                            setView('details');
                            fetchUserTransactions();
                            if (onRefresh) onRefresh();
                        }}
                    />
                ) : (
                    <TransactionForm
                        type={view as 'deposit' | 'withdraw'}
                        user={user}
                        onBack={() => setView('details')}
                        onRefresh={onRefresh}
                        onSuccess={() => {
                            setView('details');
                            fetchUserTransactions();
                            if (onRefresh) onRefresh();
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
