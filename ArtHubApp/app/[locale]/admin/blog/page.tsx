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
  BookOpen,
  Eye,
  Clock,
  TrendingUp,
  Users,
  BarChart3
} from "lucide-react"
import { type BlogPost } from "@/lib/firebase"
import { useSafePrivy } from "@/hooks/useSafePrivy"

export default function AdminBlogPage() {
  const { user } = useSafePrivy()
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    author: "",
    category: "tutorial",
    difficulty_level: "any",
    tags: "",
    language: "en",
    estimated_time: "",
    status: "draft",
    featured: false,
    order_priority: 0
  })

  // Load blog posts and stats
  useEffect(() => {
    loadBlogPosts()
    loadStats()
  }, [])

  const loadBlogPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/blog?admin=true')
      const result = await response.json()
      
      if (result.success) {
        setBlogPosts(result.data || [])
      }
    } catch (error) {
      console.error('Error loading blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/blog/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      
      const payload = {
        ...formData,
        tags: tagsArray,
        order_priority: Number(formData.order_priority),
        created_by: user?.wallet?.address || 'admin'
      }

      let response
      if (editingBlogPost) {
        // Update existing blog post
        response = await fetch(`/api/blog/${editingBlogPost.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
      } else {
        // Create new blog post
        response = await fetch('/api/blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
      }

      const result = await response.json()
      
      if (result.success) {
        loadBlogPosts()
        loadStats()
        resetForm()
        setIsCreateDialogOpen(false)
        setEditingBlogPost(null)
      } else {
        alert(`Error ${editingBlogPost ? 'updating' : 'creating'} blog post: ${result.error}`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert(`Error ${editingBlogPost ? 'updating' : 'creating'} blog post`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return
    }

    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        loadBlogPosts()
        loadStats()
      } else {
        alert(`Error deleting blog post: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting blog post:', error)
      alert('Error deleting blog post')
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      url: "",
      author: "",
      category: "tutorial",
      difficulty_level: "any",
      tags: "",
      language: "en",
      estimated_time: "",
      status: "draft",
      featured: false,
      order_priority: 0
    })
  }

  const startEdit = (blogPost: BlogPost) => {
    setFormData({
      title: blogPost.title,
      description: blogPost.description,
      url: blogPost.url,
      author: blogPost.author || "",
      category: blogPost.category,
      difficulty_level: blogPost.difficulty_level,
      tags: blogPost.tags?.join(', ') || "",
      language: blogPost.language || "en",
      estimated_time: blogPost.estimated_time || "",
      status: blogPost.status,
      featured: blogPost.featured,
      order_priority: blogPost.order_priority || 0
    })
    setEditingBlogPost(blogPost)
    setIsCreateDialogOpen(true)
  }

  const filteredBlogPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.author && post.author.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || post.status === statusFilter
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      tutorial: 'bg-blue-100 text-blue-800',
      guide: 'bg-purple-100 text-purple-800',
      documentation: 'bg-indigo-100 text-indigo-800',
      tips: 'bg-green-100 text-green-800',
      'how-to': 'bg-orange-100 text-orange-800',
      resources: 'bg-pink-100 text-pink-800',
      news: 'bg-red-100 text-red-800',
      announcement: 'bg-cyan-100 text-cyan-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Please connect your wallet to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Blog Management</h1>
        <p className="text-gray-600">Manage blog posts, guides, and resources</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBlogPosts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalPublished}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalFeatured}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
                <SelectItem value="guide">Guide</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="tips">Tips</SelectItem>
                <SelectItem value="how-to">How-to</SelectItem>
                <SelectItem value="resources">Resources</SelectItem>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-[#FF69B4] hover:bg-[#FF1493]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Blog Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingBlogPost ? 'Edit Blog Post' : 'Create New Blog Post'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) => setFormData({...formData, author: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="url">URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tutorial">Tutorial</SelectItem>
                          <SelectItem value="guide">Guide</SelectItem>
                          <SelectItem value="documentation">Documentation</SelectItem>
                          <SelectItem value="tips">Tips</SelectItem>
                          <SelectItem value="how-to">How-to</SelectItem>
                          <SelectItem value="resources">Resources</SelectItem>
                          <SelectItem value="news">News</SelectItem>
                          <SelectItem value="announcement">Announcement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="difficulty_level">Difficulty</Label>
                      <Select value={formData.difficulty_level} onValueChange={(value) => setFormData({...formData, difficulty_level: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="any">Any Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">Status *</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="estimated_time">Estimated Time</Label>
                      <Input
                        id="estimated_time"
                        value={formData.estimated_time}
                        onChange={(e) => setFormData({...formData, estimated_time: e.target.value})}
                        placeholder="e.g., 5 min read"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="order_priority">Priority</Label>
                      <Input
                        id="order_priority"
                        type="number"
                        value={formData.order_priority}
                        onChange={(e) => setFormData({...formData, order_priority: Number(e.target.value)})}
                        className="mt-1"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="web3, nft, tutorial"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({...formData, featured: !!checked})}
                    />
                    <Label htmlFor="featured">Featured blog post</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false)
                        setEditingBlogPost(null)
                        resetForm()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#FF69B4] hover:bg-[#FF1493]">
                      {editingBlogPost ? 'Update' : 'Create'} Blog Post
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts Table */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading blog posts...</p>
            </div>
          ) : filteredBlogPosts.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first blog post.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#FF69B4] hover:bg-[#FF1493]">
                <Plus className="h-4 w-4 mr-2" />
                Create Blog Post
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBlogPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {post.description}
                          </div>
                          {post.featured && (
                            <Badge className="mt-1 bg-[#FF69B4] text-white text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{post.author || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(post.category)} variant="outline">
                          {post.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(post.status)} variant="outline">
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-gray-400" />
                          {post.view_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(post.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(post.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}