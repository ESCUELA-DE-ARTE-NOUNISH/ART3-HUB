import { NextRequest, NextResponse } from 'next/server'
import { FirebaseBlogService } from '@/lib/services/firebase-blog-service'
import { AITranslationService } from '@/lib/services/ai-translation-service'
import { type BlogPost } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const category = searchParams.get('category') || undefined
    const difficulty_level = searchParams.get('difficulty_level') || undefined
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | undefined
    const admin = searchParams.get('admin') === 'true'
    const locale = searchParams.get('locale') || 'en'

    // Get blog posts from Firebase
    const result = await FirebaseBlogService.getBlogPosts({
      featured: featured || undefined,
      limit,
      category,
      difficulty_level,
      status,
      admin
    })

    if (!result.success || !result.data) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to fetch blog posts'
      }, { status: 500 })
    }

    let blogPosts = result.data

    // Apply translations based on content language vs requested locale
    if (blogPosts.length > 0) {
      try {
        const translatedBlogPosts = await Promise.all(
          blogPosts.map(async (blogPost) => {
            try {
              // Get the original language of the blog post (default to 'en' if not specified)
              const originalLanguage = blogPost.language || 'en'
              
              // Only translate if the requested locale is different from the original language
              if (locale !== originalLanguage) {
                console.log(`🔄 Translating blog post "${blogPost.title}" from ${originalLanguage} to ${locale}`)
                
                const translatedContent = await AITranslationService.getOrCreateTranslation(
                  `${blogPost.id}_${originalLanguage}`, // Include source language in cache key
                  { 
                    title: blogPost.title, 
                    description: blogPost.description, 
                    author: blogPost.author 
                  },
                  locale,
                  'blog',
                  originalLanguage // Pass source language
                )
                
                return {
                  ...blogPost,
                  title: translatedContent.title,
                  description: translatedContent.description,
                  author: translatedContent.author || blogPost.author
                }
              } else {
                // No translation needed - original language matches requested locale
                console.log(`✅ Blog post "${blogPost.title}" already in ${locale}, no translation needed`)
                return blogPost
              }
            } catch (translationError) {
              console.error(`Translation failed for blog post ${blogPost.id}:`, translationError)
              // Return original blog post if translation fails
              return blogPost
            }
          })
        )
        
        blogPosts = translatedBlogPosts
      } catch (translationError) {
        console.error('Blog posts translation error:', translationError)
        // Continue with original blog posts if translation fails
      }
    }

    return NextResponse.json({
      success: true,
      data: blogPosts,
      locale: locale,
      count: blogPosts.length
    })

  } catch (error) {
    console.error('Error in blog GET route:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Basic validation
    if (!body.title || !body.description || !body.url || !body.category) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, description, url, category'
      }, { status: 400 })
    }

    // Create the blog post
    const result = await FirebaseBlogService.createBlogPost({
      title: body.title,
      description: body.description,
      url: body.url,
      author: body.author || '',
      category: body.category,
      difficulty_level: body.difficulty_level || 'any',
      tags: body.tags || [],
      language: body.language || 'en',
      estimated_time: body.estimated_time || '',
      status: body.status || 'draft',
      featured: body.featured || false,
      order_priority: body.order_priority || 0,
      created_by: body.created_by || 'admin'
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to create blog post'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      message: 'Blog post created successfully'
    })

  } catch (error) {
    console.error('Error in blog POST route:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}