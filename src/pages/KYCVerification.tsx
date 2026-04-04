import { useState, useEffect } from 'react'
import { apiCall } from '@/lib/api'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Filter, Download, MoreHorizontal, CheckCircle, MinusCircle } from 'lucide-react'

interface KYCSubmission {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  documentType: string
  selfie?: string
  createdAt: string
  status: 'pending' | 'verified' | 'rejected'
}

export function KYCVerificationPage() {
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchKyc()
  }, [])

  const fetchKyc = async () => {
    try {
      const data = await apiCall('/admin/kyc')
      
      // Handle both direct array response and error response object
      if (Array.isArray(data)) {
        setKycSubmissions(data)
      } else if (data.submissions && Array.isArray(data.submissions)) {
        setKycSubmissions(data.submissions)
      } else {
        console.warn('Unexpected response format:', data)
        setKycSubmissions([])
      }
    } catch (error) {
      console.error('Failed to fetch KYC:', error)
      setKycSubmissions([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSubmissions = kycSubmissions.filter(submission => {
    if (activeTab !== 'all') {
      if (activeTab === 'pending' && submission.status !== 'pending') return false
      if (activeTab === 'approved' && submission.status !== 'verified') return false
      if (activeTab === 'rejected' && submission.status !== 'rejected') return false
    }
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase()
      return submission.user?.name?.toLowerCase().includes(s) ||
             submission.user?.email?.toLowerCase().includes(s) ||
             submission._id.toLowerCase().includes(s)
    }
    return true
  })

  const handleRowClick = (submission: KYCSubmission) => {
    setSelectedSubmission(submission)
  }

  return (
    <DashboardLayout title="KYC & Verification">
      {/* KYC Table Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15]">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Verifications</h2>
            <span className="text-[#6D767E] text-sm font-medium">({filteredSubmissions.length.toLocaleString()}{searchQuery.trim() ? ` of ${kycSubmissions.length}` : ''})</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6D767E]" />
              <Input
                type="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64 bg-[#1a1a25] border-[#2A2933] text-sm h-10 rounded-lg focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <Button variant="ghost" className="bg-[#1a1a25] hover:bg-[#2A2933] text-white border border-[#2A2933] rounded-lg h-10 px-4 gap-2">
              <Filter className="h-4 w-4 text-[#6D767E]" />
              <span className="text-sm font-medium">Filter</span>
            </Button>
            <Button variant="ghost" className="bg-[#1a1a25] hover:bg-[#2A2933] text-white border border-[#2A2933] rounded-lg h-10 px-4 gap-2">
              <Download className="h-4 w-4 text-[#6D767E]" />
              <span className="text-sm font-medium">Export</span>
            </Button>
            <Button variant="ghost" size="icon" className="bg-[#1a1a25] hover:bg-[#2A2933] border border-[#2A2933] rounded-lg h-10 w-10">
              <MoreHorizontal className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 px-6 border-b border-[#1a1a25]">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'all'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'pending'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'approved'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'rejected'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Rejected
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-b-xl">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading KYC submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white mb-2">No KYC submissions found</p>
              <p className="text-muted-foreground text-sm">
                {activeTab === 'all' 
                  ? 'KYC submissions will appear here once users submit their documents'
                  : `No ${activeTab} submissions at this time`
                }
              </p>
              <Button 
                onClick={fetchKyc} 
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                Refresh
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-12 h-12 py-0">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.length === filteredSubmissions.length}
                      onCheckedChange={(checked) => {
                        setSelectedItems(checked ? filteredSubmissions.map(s => s._id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Submission ID</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Name</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Document type</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Selfie</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Date submitted</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Verification status</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow
                    key={submission._id}
                    className="border-[#1a1a25] hover:bg-[#131219] transition-colors cursor-pointer"
                    onClick={() => handleRowClick(submission)}
                  >
                    <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                        checked={selectedItems.includes(submission._id)}
                        onCheckedChange={(checked) => {
                          setSelectedItems(
                            checked
                              ? [...selectedItems, submission._id]
                              : selectedItems.filter((id) => id !== submission._id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{submission._id.slice(-6).toUpperCase()}</TableCell>
                    <TableCell className="font-bold text-white text-sm">{submission.user?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-[#6D767E] font-medium text-sm">{submission.documentType}</TableCell>
                    <TableCell>
                      {submission.selfie ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#06AE7A] shadow-lg shadow-[#06AE7A]/20">
                          <CheckCircle className="h-3.5 w-3.5 text-black stroke-[3px]" />
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F59E0B] shadow-lg shadow-[#F59E0B]/20">
                          <MinusCircle className="h-3.5 w-3.5 text-black stroke-[3px]" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-[#6D767E] font-medium text-sm">{new Date(submission.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-md px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                          submission.status === 'verified'
                            ? 'bg-[#06AE7A] text-black hover:bg-[#06AE7A]/90'
                            : submission.status === 'pending'
                              ? 'bg-[#F59E0B] text-black hover:bg-[#F59E0B]/90'
                              : 'bg-destructive text-white'
                        )}
                      >
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#1a1a25] hover:bg-[#2A2933] rounded-lg border border-[#2A2933]">
                        <MoreHorizontal className="h-4 w-4 text-[#6D767E]" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Review Details Modal - Premium Design */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => { setSelectedSubmission(null); setFeedback(''); }}>
        <DialogContent className="bg-[#0a0a0f] border-[#2a2a35] w-[95vw] sm:max-w-md p-0 overflow-hidden rounded-xl shadow-2xl shadow-black/50 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-4 border-b border-[#1a1a25]">
            <DialogTitle className="text-lg font-semibold">
              Review details
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Document Preview - Real data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">Document Front</p>
                <div className="aspect-[4/3] bg-[#1a1a25] rounded-xl border border-[#2a2a35] flex items-center justify-center overflow-hidden">
                  {(selectedSubmission as any)?.documentFront ? (
                    <img src={(selectedSubmission as any).documentFront} alt="Document Front" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-3xl opacity-30">📄</div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">Selfie</p>
                <div className="aspect-[4/3] bg-[#1a1a25] rounded-xl border border-[#2a2a35] flex items-center justify-center overflow-hidden">
                  {selectedSubmission?.selfie ? (
                    <img src={selectedSubmission.selfie} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-3xl opacity-30">🤳</div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Details - Real data */}
            <div className="space-y-4 bg-[#1a1a25] rounded-xl p-4">
              <div className="flex justify-between items-center py-2 border-b border-[#2a2a35]">
                <span className="text-sm text-muted-foreground">Document type</span>
                <span className="text-sm font-medium">{selectedSubmission?.documentType || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2a2a35]">
                <span className="text-sm text-muted-foreground">User</span>
                <span className="text-sm font-medium">{selectedSubmission?.user?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2a2a35]">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{selectedSubmission?.user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2a2a35]">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={cn(
                  "rounded-md px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                  selectedSubmission?.status === 'verified'
                    ? 'bg-[#06AE7A] text-black'
                    : selectedSubmission?.status === 'pending'
                      ? 'bg-[#F59E0B] text-black'
                      : 'bg-destructive text-white'
                )}>
                  {selectedSubmission?.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Submission ID</span>
                <span className="text-sm font-medium">#{selectedSubmission?._id.slice(-8).toUpperCase()}</span>
              </div>
            </div>

            {/* Action Buttons - only show for pending */}
            {selectedSubmission?.status === 'pending' && (
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  className="h-12 bg-[#1ABFA1] hover:bg-[#18a88e] text-black font-semibold text-base"
                  onClick={async () => {
                    try {
                      await apiCall(`/admin/kyc/${selectedSubmission._id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ status: 'verified', adminComment: feedback || 'Approved' }),
                      });
                      setSelectedSubmission(null);
                      setFeedback('');
                      fetchKyc();
                    } catch (e) {
                      console.error('Failed to approve KYC:', e);
                    }
                  }}
                >
                  Approve
                </Button>
                <Button 
                  variant="secondary" 
                  className="h-12 bg-[#2a2a35] hover:bg-[#3a3a45] text-white font-semibold text-base"
                  onClick={async () => {
                    try {
                      await apiCall(`/admin/kyc/${selectedSubmission._id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ status: 'rejected', adminComment: feedback || 'Rejected' }),
                      });
                      setSelectedSubmission(null);
                      setFeedback('');
                      fetchKyc();
                    } catch (e) {
                      console.error('Failed to reject KYC:', e);
                    }
                  }}
                >
                  Reject
                </Button>
              </div>
            )}

            {/* Feedback Section - Premium */}
            {selectedSubmission?.status === 'pending' && (
              <div className="bg-[#1a1a25] rounded-xl p-4">
                <p className="text-sm font-medium mb-3">Admin comment</p>
                <Textarea
                  placeholder="Write a comment (optional)..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="bg-[#0a0a0f] border-[#2a2a35] min-h-[80px] resize-none focus:border-[#1ABFA1] transition-colors"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
