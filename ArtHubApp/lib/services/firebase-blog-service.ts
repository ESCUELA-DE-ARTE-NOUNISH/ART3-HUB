import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore'
import { db, COLLECTIONS, generateId, getCurrentTimestamp, type BlogPost } from '@/lib/firebase'

export class FirebaseBlogService {
  
  /**
   * Create a new blog post
   */
  static async createBlogPost(blogData: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean, id?: string, error?: string }> {
    try {
      const now = getCurrentTimestamp()
      
      const blogPost: Omit<BlogPost, 'id'> = {
        ...blogData,
        view_count: 0,
        likes_count: 0,
        order_priority: blogData.order_priority || 0,
        created_at: now,
        updated_at: now
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.BLOG_POSTS), blogPost)
      
      return {
        success: true,
        id: docRef.id
      }
    } catch (error) {
      console.error('Error creating guide:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Update an existing blog post
   */
  static async updateBlogPost(id: string, blogData: Partial<Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean, error?: string }> {
    try {
      const blogRef = doc(db, COLLECTIONS.BLOG_POSTS, id)
      
      const updateData = {
        ...blogData,
        updated_at: getCurrentTimestamp()
      }

      await updateDoc(blogRef, updateData)
      
      return { success: true }
    } catch (error) {
      console.error('Error updating blog post:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Delete a blog post
   */
  static async deleteBlogPost(id: string): Promise<{ success: boolean, error?: string }> {
    try {
      const blogRef = doc(db, COLLECTIONS.BLOG_POSTS, id)
      await deleteDoc(blogRef)
      
      return { success: true }
    } catch (error) {
      console.error('Error deleting blog post:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get a blog post by ID
   */
  static async getBlogPostById(id: string): Promise<{ success: boolean, data?: BlogPost, error?: string }> {
    try {
      const blogRef = doc(db, COLLECTIONS.BLOG_POSTS, id)
      const docSnap = await getDoc(blogRef)

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Blog post not found'
        }
      }

      const blogPost: BlogPost = {
        id: docSnap.id,
        ...docSnap.data()
      } as BlogPost

      return {
        success: true,
        data: blogPost
      }
    } catch (error) {
      console.error('Error fetching blog post:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get all blog posts with optional filters
   */
  static async getBlogPosts(options: {
    status?: 'draft' | 'published' | 'archived'
    featured?: boolean
    category?: string
    difficulty_level?: string
    limit?: number
    admin?: boolean
  } = {}): Promise<{ success: boolean, data?: BlogPost[], error?: string }> {
    try {
      let q = query(collection(db, COLLECTIONS.BLOG_POSTS))
      
      // Add filters
      if (options.status) {
        q = query(q, where('status', '==', options.status))
      } else if (!options.admin) {
        // For non-admin requests, only show published blog posts
        q = query(q, where('status', '==', 'published'))
      }
      
      if (options.featured !== undefined) {
        q = query(q, where('featured', '==', options.featured))
      }
      
      if (options.category) {
        q = query(q, where('category', '==', options.category))
      }
      
      if (options.difficulty_level) {
        q = query(q, where('difficulty_level', '==', options.difficulty_level))
      }
      
      // Add ordering
      q = query(q, orderBy('order_priority', 'desc'), orderBy('created_at', 'desc'))
      
      if (options.limit) {
        q = query(q, limit(options.limit))
      }

      const querySnapshot = await getDocs(q)
      const blogPosts: BlogPost[] = []

      querySnapshot.forEach((doc) => {
        blogPosts.push({
          id: doc.id,
          ...doc.data()
        } as BlogPost)
      })

      return {
        success: true,
        data: blogPosts
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get featured blog posts
   */
  static async getFeaturedBlogPosts(limitCount = 3): Promise<{ success: boolean, data?: BlogPost[], error?: string }> {
    return this.getBlogPosts({ 
      featured: true, 
      status: 'published', 
      limit: limitCount 
    })
  }

  /**
   * Get blog posts by category
   */
  static async getBlogPostsByCategory(category: string, limitCount?: number): Promise<{ success: boolean, data?: BlogPost[], error?: string }> {
    return this.getBlogPosts({ 
      category, 
      status: 'published', 
      limit: limitCount 
    })
  }

  /**
   * Increment view count for a blog post
   */
  static async incrementViewCount(id: string): Promise<{ success: boolean, error?: string }> {
    try {
      const blogRef = doc(db, COLLECTIONS.BLOG_POSTS, id)
      const docSnap = await getDoc(blogRef)
      
      if (!docSnap.exists()) {
        return { success: false, error: 'Blog post not found' }
      }
      
      const currentViews = docSnap.data().view_count || 0
      
      await updateDoc(blogRef, {
        view_count: currentViews + 1,
        updated_at: getCurrentTimestamp()
      })
      
      return { success: true }
    } catch (error) {
      console.error('Error incrementing view count:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get blog post statistics for admin
   */
  static async getBlogStats(): Promise<{ 
    success: boolean, 
    data?: {
      totalBlogPosts: number
      totalPublished: number
      totalDraft: number
      totalArchived: number
      totalFeatured: number
      totalByCategory: Record<string, number>
      totalViews: number
    }, 
    error?: string 
  }> {
    try {
      const blogSnapshot = await getDocs(collection(db, COLLECTIONS.BLOG_POSTS))
      
      let totalBlogPosts = 0
      let totalPublished = 0
      let totalDraft = 0
      let totalArchived = 0
      let totalFeatured = 0
      let totalViews = 0
      const totalByCategory: Record<string, number> = {}

      blogSnapshot.forEach((doc) => {
        const blogPost = doc.data() as BlogPost
        totalBlogPosts++
        
        // Count by status
        if (blogPost.status === 'published') totalPublished++
        else if (blogPost.status === 'draft') totalDraft++
        else if (blogPost.status === 'archived') totalArchived++
        
        // Count featured
        if (blogPost.featured) totalFeatured++
        
        // Count by category
        if (blogPost.category) {
          totalByCategory[blogPost.category] = (totalByCategory[blogPost.category] || 0) + 1
        }
        
        // Sum views
        totalViews += blogPost.view_count || 0
      })

      return {
        success: true,
        data: {
          totalBlogPosts,
          totalPublished,
          totalDraft,
          totalArchived,
          totalFeatured,
          totalByCategory,
          totalViews
        }
      }
    } catch (error) {
      console.error('Error getting blog stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}