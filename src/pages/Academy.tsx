import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, Download, MoreHorizontal, Bold, Italic, Strikethrough, AlignLeft, Link2 } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts'
import { apiCall } from '@/lib/api'

interface Lesson {
  _id: string
  title: string
  category: string
  type: string
  difficulty: string
  completionRate: number
  lastUpdated: string
  status: 'draft' | 'published'
  author?: {
    name: string
    email: string
  }
}

interface AcademyStats {
  totalLessons: number
  publishedLessons: number
  totalStudents: number
  completionRate: number
}

interface EngagementData {
  totalEngagement: number
  percentageChange: number
  chartData: Array<{
    name: string
    value: number
  }>
  timeRange: string
}

// Removed hardcoded chart data - now using real data from API

export function AcademyPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState('Weekly')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [stats, setStats] = useState<AcademyStats>({
    totalLessons: 0,
    publishedLessons: 0,
    totalStudents: 0,
    completionRate: 0
  })
  const [engagementData, setEngagementData] = useState<EngagementData>({
    totalEngagement: 0,
    percentageChange: 0,
    chartData: [],
    timeRange: 'weekly'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state for creating lessons
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'getting-started',
    difficulty: 'beginner',
    type: 'article',
    estimatedReadTime: 5,
    tags: [] as string[]
  })

  useEffect(() => {
    fetchLessons()
    fetchStats()
    fetchEngagementData()
  }, [])

  useEffect(() => {
    fetchEngagementData()
  }, [timeRange])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      const response = await apiCall('/admin/academy/lessons')
      setLessons(response || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching lessons:', err)
      setError('Failed to load lessons')
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEngagementData = async () => {
    try {
      const response = await apiCall(`/admin/academy/engagement?timeRange=${timeRange.toLowerCase()}`)
      setEngagementData(response || {
        totalEngagement: 0,
        percentageChange: 0,
        chartData: [],
        timeRange: 'weekly'
      })
    } catch (err) {
      console.error('Error fetching engagement data:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiCall('/admin/academy/stats')
      setStats(response || {
        totalLessons: 0,
        publishedLessons: 0,
        totalStudents: 0,
        completionRate: 0
      })
    } catch (err) {
      console.error('Error fetching academy stats:', err)
    }
  }

  const handleCreateLesson = async () => {
    try {
      if (!formData.title || !formData.description || !formData.content) {
        alert('Please fill in all required fields')
        return
      }

      await apiCall('/admin/academy/lessons', 'POST', formData)
      
      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        content: '',
        category: 'getting-started',
        difficulty: 'beginner',
        type: 'article',
        estimatedReadTime: 5,
        tags: []
      })
      setShowCreateModal(false)
      
      // Refresh data
      fetchLessons()
      fetchStats()
      fetchEngagementData()
    } catch (err) {
      console.error('Error creating lesson:', err)
      alert('Failed to create lesson')
    }
  }

  const handlePublishLesson = async (lessonId: string) => {
    try {
      await apiCall(`/admin/academy/lessons/${lessonId}/publish`, 'PUT')
      fetchLessons()
      fetchStats()
      fetchEngagementData()
    } catch (err) {
      console.error('Error publishing lesson:', err)
      alert('Failed to publish lesson')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredLessons = lessons.filter(l => {
    if (!searchQuery.trim()) return true
    const s = searchQuery.toLowerCase()
    return l.title?.toLowerCase().includes(s) || l.category?.toLowerCase().includes(s) || l.difficulty?.toLowerCase().includes(s) || l.status?.toLowerCase().includes(s)
  })

  return (
    <DashboardLayout title="Academy">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Lessons"
          value={stats.totalLessons.toString()}
          change={stats.totalLessons === 0 ? "No lessons created" : `${stats.totalLessons} lessons`}
          subtitle="Educational content"
        />
        <StatsCard
          title="Published Lessons"
          value={stats.publishedLessons.toString()}
          change={stats.publishedLessons === 0 ? "No published content" : `${stats.publishedLessons} published`}
          subtitle="Live educational content"
        />
        <StatsCard
          title="Total Students"
          value={stats.totalStudents.toString()}
          change={stats.totalStudents === 0 ? "No students enrolled" : `${stats.totalStudents} students`}
          subtitle="Users learning"
        />
        <StatsCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          change={stats.completionRate === 0 ? "No completions yet" : `${stats.completionRate}% average`}
          subtitle="Course completion rate"
        />
      </div>

      {/* Engagement Chart Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15] p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-[#6D767E] mb-1">Overall Engagement</h3>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">
                {engagementData.totalEngagement.toLocaleString()}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span className={cn(
                  "inline-block px-1 py-0.5 rounded font-bold",
                  engagementData.percentageChange >= 0 
                    ? "bg-[#06AE7A]/10 text-[#06AE7A]" 
                    : "bg-red-500/10 text-red-400"
                )}>
                  {engagementData.percentageChange >= 0 ? '↑' : '↓'}
                </span>
                <span className={cn(
                  engagementData.percentageChange >= 0 ? "text-[#06AE7A]" : "text-red-400"
                )}>
                  {engagementData.percentageChange >= 0 ? '+' : ''}{engagementData.percentageChange}%
                </span>
                <span className="text-[#6D767E]">vs last {timeRange.toLowerCase()}</span>
              </div>
            </div>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px] bg-[#1a1a25] border-[#2A2933] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bar Chart */}
        <div className="h-[250px] w-full min-w-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={250}>
            <BarChart
              data={engagementData.chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              barGap={12}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6D767E', fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6D767E', fontSize: 12 }}
                tickFormatter={(value) => value === 0 ? '0' : `${Math.floor(value / 1000)}k`}
              />
              <RechartsTooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: '#1a1a25',
                  border: '1px solid #2A2933',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                labelStyle={{ color: '#6D767E', marginBottom: '4px' }}
                itemStyle={{ color: '#06AE7A' }}
                formatter={(value) => [`${Number(value).toLocaleString()}`, 'Engagement']}
              />
              <Bar
                dataKey="value"
                fill="#06AE7A"
                radius={4}
                barSize={12}
                background={{ fill: '#1a1a25', radius: 4 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lessons Table Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15]">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Lessons</h2>
            <span className="text-[#6D767E] text-sm font-medium">({filteredLessons.length}{searchQuery.trim() ? ` of ${lessons.length}` : ''})</span>
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
            <Button
              className="bg-[#06AE7A] hover:bg-[#06AE7A]/90 text-black font-bold rounded-lg h-10 px-4 transition-all shadow-[0_4px_12px_rgba(6,174,122,0.2)]"
              onClick={() => setShowCreateModal(true)}
            >
              Create lessons
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#212027]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-12 h-12 py-0">
                  <Checkbox
                    className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                    checked={selectedItems.length === filteredLessons.length && filteredLessons.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedItems(checked ? filteredLessons.map(l => l._id) : [])
                    }}
                  />
                </TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Lesson Title</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Category</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Type</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Difficulty</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Completion Rate</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Last Updated</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="text-[#6D767E] text-lg font-medium">Loading lessons...</div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-red-400 text-lg font-medium">Error loading lessons</div>
                      <div className="text-[#6D767E] text-sm">{error}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : lessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-[#6D767E] text-lg font-medium">No lessons yet</div>
                      <div className="text-[#6D767E] text-sm">Create your first lesson to start building your academy</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLessons.map((lesson) => (
                <TableRow key={lesson._id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                  <TableCell className="w-12">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.includes(lesson._id)}
                      onCheckedChange={(checked) => {
                        setSelectedItems(
                          checked
                            ? [...selectedItems, lesson._id]
                            : selectedItems.filter((id) => id !== lesson._id)
                        )
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-bold text-white text-sm">{lesson.title}</TableCell>
                  <TableCell className="font-bold text-[#6D767E] text-sm capitalize">{lesson.category.replace('-', ' ')}</TableCell>
                  <TableCell className="font-medium text-[#6D767E] text-sm capitalize">{lesson.type}</TableCell>
                  <TableCell className="font-bold text-[#6D767E] text-sm capitalize">{lesson.difficulty}</TableCell>
                  <TableCell className="font-bold text-white text-sm">{lesson.completionRate}%</TableCell>
                  <TableCell className="font-bold text-[#6D767E] text-xs">{formatDate(lesson.lastUpdated)}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase",
                        lesson.status === 'published'
                          ? 'bg-[#06AE7A] text-black'
                          : 'bg-[#6D767E]/20 text-[#6D767E] border border-[#6D767E]/30'
                      )}
                    >
                      {lesson.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center gap-2">
                      {lesson.status === 'draft' && (
                        <Button
                          size="sm"
                          className="bg-[#06AE7A] hover:bg-[#06AE7A]/90 text-black font-bold text-xs h-7 px-2"
                          onClick={() => handlePublishLesson(lesson._id)}
                        >
                          Publish
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#1a1a25] hover:bg-[#2A2933] border border-[#2A2933]">
                        <MoreHorizontal className="h-4 w-4 text-[#6D767E]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Lesson Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#0a0a0f] border-[#2a2a35] w-[95vw] sm:max-w-4xl p-0 overflow-hidden rounded-xl shadow-2xl shadow-black/50 max-h-[95vh] flex flex-col mx-auto">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-base font-semibold">
              Create Lesson
            </DialogTitle>
            <DialogDescription className="sr-only">
              Fill in the form below to create a new lesson for the academy
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Basic Information</h4>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Lesson Title</Label>
                <Input
                  placeholder="Write lesson title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-[#1a1a25] border-[#2a2a35] focus:border-[#1ABFA1] h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  placeholder="Write lesson description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#1a1a25] border-[#2a2a35] focus:border-[#1ABFA1] min-h-[50px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-[#1a1a25] border-[#2a2a35] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="getting-started">Getting started</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="defi">DeFi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Difficult level</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                  <SelectTrigger className="bg-[#1a1a25] border-[#2a2a35] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Content Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="bg-[#1a1a25] border-[#2a2a35] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="interactive">Interactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Content</Label>

              {/* Simple Editor Toolbar */}
              <div className="flex items-center gap-1 p-2 bg-[#1a1a25] rounded-t-lg border border-[#2a2a35] border-b-0">
                <Select defaultValue="normal">
                  <SelectTrigger className="h-7 w-24 bg-transparent border-0 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal text</SelectItem>
                    <SelectItem value="h1">Heading 1</SelectItem>
                    <SelectItem value="h2">Heading 2</SelectItem>
                  </SelectContent>
                </Select>

                <div className="h-4 w-px bg-[#2a2a35] mx-1" />

                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Italic className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Strikethrough className="h-3.5 w-3.5" />
                </Button>

                <div className="h-4 w-px bg-[#2a2a35] mx-1" />

                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <AlignLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Link2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Editor Content Area */}
              <Textarea
                placeholder="Write your lesson content here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="min-h-[120px] bg-[#1a1a25] rounded-b-lg border border-[#2a2a35] border-t-0 p-3 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <Button 
                className="h-10 bg-[#1ABFA1] hover:bg-[#18a88e] text-black font-semibold text-sm"
                onClick={handleCreateLesson}
              >
                Publish
              </Button>
              <Button 
                variant="secondary" 
                className="h-10 bg-[#2a2a35] hover:bg-[#3a3a45] text-white font-semibold text-sm"
                onClick={handleCreateLesson}
              >
                Save Draft
              </Button>
              <Button 
                variant="secondary" 
                className="h-10 bg-[#2a2a35] hover:bg-[#3a3a45] text-white font-semibold text-sm"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
