import { NextRequest, NextResponse } from 'next/server'
import { FirebaseBlogService } from '@/lib/services/firebase-blog-service'
import { AITranslationService } from '@/lib/services/ai-translation-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Blog post ID is required'
      }, { status: 400 })
    }

    const result = await FirebaseBlogService.getBlogPostById(id)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Blog post not found'
      }, { status: 404 })
    }

    let blogPost = result.data!

    // Apply translation based on content language vs requested locale
    try {
      const originalLanguage = blogPost.language || 'en'
      
      // Only translate if the requested locale is different from the original language
      if (locale !== originalLanguage) {
        console.log(`🔄 Translating individual blog post "${blogPost.title}" from ${originalLanguage} to ${locale}`)
        
        const translatedContent = await AITranslationService.getOrCreateTranslation(
          `${blogPost.id}_${originalLanguage}`,
          { 
            title: blogPost.title, 
            description: blogPost.description, 
            author: blogPost.author 
          },
          locale,
          'blog',
          originalLanguage // Pass source language
        )
        
        blogPost = {
          ...blogPost,
          title: translatedContent.title,
          description: translatedContent.description,
          author: translatedContent.author || blogPost.author
        }
      } else {
        console.log(`✅ Individual blog post "${blogPost.title}" already in ${locale}, no translation needed`)
      }
    } catch (translationError) {
      console.error(`Translation failed for individual blog post ${blogPost.id}:`, translationError)
      // Continue with original blog post if translation fails
    }

    // Increment view count
    await FirebaseBlogService.incrementViewCount(id)

    return NextResponse.json({
      success: true,
      data: blogPost,
      locale: locale
    })

  } catch (error) {
    console.error('Error in blog GET by ID route:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Blog post ID is required'
      }, { status: 400 })
    }

    // Update the blog post
    const result = await FirebaseBlogService.updateBlogPost(id, body)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to update blog post'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post updated successfully'
    })

  } catch (error) {
    console.error('Error in blog PUT route:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Blog post ID is required'
      }, { status: 400 })
    }

    const result = await FirebaseBlogService.deleteBlogPost(id)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to delete blog post'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    })

  } catch (error) {
    console.error('Error in blog DELETE route:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}