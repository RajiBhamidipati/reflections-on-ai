import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/?error=Invalid confirmation link', request.url))
  }

  // Create a server-side supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email',
    })

    if (error) {
      console.error('Error verifying email:', error)
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent('Email confirmation failed. Please try again.')}`, request.url))
    }

    // Redirect to confirmed page
    return NextResponse.redirect(new URL('/auth/confirmed', request.url))
  } catch (err) {
    console.error('Unexpected error during email confirmation:', err)
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent('Email confirmation failed. Please try again.')}`, request.url))
  }
}