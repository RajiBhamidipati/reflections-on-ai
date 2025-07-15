import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/confirmed'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Create a server-side supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (error) {
    // Redirect to error page or login with error message
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error_description || error)}`, request.url))
  }

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, request.url))
      }
    } catch (err) {
      console.error('Unexpected error during auth callback:', err)
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent('Authentication failed')}`, request.url))
    }
  }

  // Redirect to the dashboard or specified next page
  return NextResponse.redirect(new URL(next, request.url))
}