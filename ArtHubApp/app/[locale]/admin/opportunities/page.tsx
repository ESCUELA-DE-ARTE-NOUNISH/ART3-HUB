"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Building
} from "lucide-react"
import { type Opportunity } from "@/lib/firebase"
import { useSafePrivy } from "@/hooks/useSafePrivy"

export default function AdminOpportunitiesPage() {
  const { user } = useSafePrivy()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    organization: "",
    description: "",
    url: "",
    amount: "",
    amount_min: "",
    amount_max: "",
    currency: "USD",
    deadline: "",
    category: "grant",
    location: "",
    eligibility: "",
    tags: "",
    status: "draft",
    featured: false,
    difficulty_level: "any",
    application_requirements: "",
    contact_email: "",
    notes: ""
  })

  // Load opportunities and stats
  useEffect(() => {
    loadOpportunities()
    loadStats()
  }, [])

  // Helper function to convert date string to YYYY-MM-DD format for date input
  const formatDateForInput = (dateString: string): string => {
    try {
      if (!dateString) return ""
      
      // If already in YYYY-MM-DD format, return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString
      }
      
      // Try to parse the date string (handles human-readable dates)
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return ""
      }
      
      // Use local date methods to avoid timezone shifts
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (error) {
      return ""
    }
  }

  // Helper function to convert YYYY-MM-DD format to human readable date  
  const formatDateForDisplay = (dateString: string): string => {
    try {
      if (!dateString) return ""
      
      let date: Date
      
      // If in YYYY-MM-DD format, parse carefully to avoid timezone issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        date = new Date(year, month - 1, day) // month is 0-based in Date constructor
      } else {
        // For other formats, parse normally
        date = new Date(dateString)
      }
      
      if (isNaN(date.getTime())) {
        return dateString
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return dateString
    }
  }

  const loadOpportunities = async () => {
    try {
      const response = await fetch('/api/opportunities?admin=true')
      const result = await response.json()
      
      if (result.success) {
        setOpportunities(result.data)
      }
    } catch (error) {
      console.error('Error loading opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/opportunities/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleCreateOpportunity = async () => {
    try {
      const payload = {
        ...formData,
        deadline: formData.deadline ? formatDateForDisplay(formData.deadline) : formData.deadline,
        amount_min: formData.amount_min ? parseInt(formData.amount_min) : undefined,
        amount_max: formData.amount_max ? parseInt(formData.amount_max) : undefined,
        eligibility: formData.eligibility ? formData.eligibility.split(',').map(e => e.trim()) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        application_requirements: formData.application_requirements 
          ? formData.application_requirements.split('\n').map(r => r.trim()).filter(r => r) 
          : [],
        created_by: user?.wallet?.address || 'admin'
      }

      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        setIsCreateDialogOpen(false)
        resetForm()
        loadOpportunities()
        loadStats()
      } else {
        alert('Error creating opportunity: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating opportunity:', error)
      alert('Error creating opportunity')
    }
  }

  const handleUpdateOpportunity = async () => {
    if (!editingOpportunity) return

    try {
      const payload = {
        ...formData,
        deadline: formData.deadline ? formatDateForDisplay(formData.deadline) : formData.deadline,
        amount_min: formData.amount_min ? parseInt(formData.amount_min) : undefined,
        amount_max: formData.amount_max ? parseInt(formData.amount_max) : undefined,
        eligibility: formData.eligibility ? formData.eligibility.split(',').map(e => e.trim()) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        application_requirements: formData.application_requirements 
          ? formData.application_requirements.split('\n').map(r => r.trim()).filter(r => r) 
          : []
      }

      const response = await fetch(`/api/opportunities/${editingOpportunity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        setEditingOpportunity(null)
        resetForm()
        loadOpportunities()
        loadStats()
      } else {
        alert('Error updating opportunity: ' + result.error)
      }
    } catch (error) {
      console.error('Error updating opportunity:', error)
      alert('Error updating opportunity')
    }
  }

  const handleDeleteOpportunity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return

    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        loadOpportunities()
        loadStats()
      } else {
        alert('Error deleting opportunity: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error)
      alert('Error deleting opportunity')
    }
  }

  const startEdit = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity)
    setFormData({
      title: opportunity.title,
      organization: opportunity.organization,
      description: opportunity.description,
      url: opportunity.url,
      amount: opportunity.amount || "",
      amount_min: opportunity.amount_min?.toString() || "",
      amount_max: opportunity.amount_max?.toString() || "",
      currency: opportunity.currency || "USD",
      deadline: formatDateForInput(opportunity.deadline),
      category: opportunity.category,
      location: opportunity.location || "",
      eligibility: opportunity.eligibility?.join(', ') || "",
      tags: opportunity.tags?.join(', ') || "",
      status: opportunity.status,
      featured: opportunity.featured,
      difficulty_level: opportunity.difficulty_level,
      application_requirements: opportunity.application_requirements?.join('\n') || "",
      contact_email: opportunity.contact_email || "",
      notes: opportunity.notes || ""
    })
  }

  const resetForm = () => {
    setFormData({
      title: "",
      organization: "",
      description: "",
      url: "",
      amount: "",
      amount_min: "",
      amount_max: "",
      currency: "USD",
      deadline: "",
      category: "grant",
      location: "",
      eligibility: "",
      tags: "",
      status: "draft",
      featured: false,
      difficulty_level: "any",
      application_requirements: "",
      contact_email: "",
      notes: ""
    })
  }

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.organization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || opp.status === statusFilter
    const matchesCategory = categoryFilter === "all" || opp.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return (
      <div className="p-4 border-b">
        <h1 className="text-xl md:text-2xl font-bold text-center mt-10">Loading Opportunities...</h1>
      </div>
    )
  }

  return (
    <div className="pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl md:text-2xl font-bold text-center mt-10">Opportunities Management</h1>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Draft</p>
                    <p className="text-xl font-bold">{stats.totalDraft || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Published</p>
                    <p className="text-xl font-bold">{stats.totalPublished || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Expired</p>
                    <p className="text-xl font-bold">{stats.totalExpired || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Categories</p>
                    <p className="text-xl font-bold">{Object.keys(stats.totalByCategory).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Avg Amount</p>
                    <p className="text-xl font-bold">${stats.averageAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="grant">Grant</SelectItem>
              <SelectItem value="residency">Residency</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="competition">Competition</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
              <SelectItem value="scholarship">Scholarship</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Opportunity</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="organization">Organization *</Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="url">URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadline">Deadline *</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount Display</Label>
                    <Input
                      id="amount"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="e.g., $1,800 USD"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount_min">Min Amount</Label>
                    <Input
                      id="amount_min"
                      type="number"
                      value={formData.amount_min}
                      onChange={(e) => setFormData({ ...formData, amount_min: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount_max">Max Amount</Label>
                    <Input
                      id="amount_max"
                      type="number"
                      value={formData.amount_max}
                      onChange={(e) => setFormData({ ...formData, amount_max: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grant">Grant</SelectItem>
                        <SelectItem value="residency">Residency</SelectItem>
                        <SelectItem value="commission">Commission</SelectItem>
                        <SelectItem value="competition">Competition</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="scholarship">Scholarship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="difficulty_level">Difficulty Level</Label>
                    <Select
                      value={formData.difficulty_level}
                      onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Level</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="eligibility">Eligibility (comma-separated)</Label>
                  <Input
                    id="eligibility"
                    value={formData.eligibility}
                    onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                    placeholder="e.g., Visual artists, Photographers, Emerging artists"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., photography, visual arts, international"
                  />
                </div>

                <div>
                  <Label htmlFor="application_requirements">Application Requirements (one per line)</Label>
                  <Textarea
                    id="application_requirements"
                    value={formData.application_requirements}
                    onChange={(e) => setFormData({ ...formData, application_requirements: e.target.value })}
                    placeholder="Portfolio of 10-15 works&#10;Artist statement (500 words max)&#10;Project proposal"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: !!checked })}
                  />
                  <Label htmlFor="featured">Featured opportunity</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsCreateDialogOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleCreateOpportunity}>
                  Create Opportunity
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Opportunities Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpportunities.map((opportunity) => (
                  <TableRow key={opportunity.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{opportunity.title}</p>
                        {opportunity.featured && (
                          <Badge variant="secondary" className="mt-1">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{opportunity.organization}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {opportunity.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{opportunity.deadline}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={opportunity.status === 'published' ? 'default' : 
                                opportunity.status === 'expired' ? 'destructive' : 'secondary'}
                      >
                        {opportunity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(opportunity.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(opportunity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteOpportunity(opportunity.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingOpportunity} onOpenChange={(open) => !open && setEditingOpportunity(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Opportunity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-organization">Organization *</Label>
                <Input
                  id="edit-organization"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-url">URL *</Label>
                <Input
                  id="edit-url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-deadline">Deadline *</Label>
                <Input
                  id="edit-deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grant">Grant</SelectItem>
                    <SelectItem value="residency">Residency</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="competition">Competition</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="scholarship">Scholarship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status || 'draft'}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: !!checked })}
              />
              <Label htmlFor="edit-featured">Featured opportunity</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setEditingOpportunity(null)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleUpdateOpportunity}>
              Update Opportunity
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}