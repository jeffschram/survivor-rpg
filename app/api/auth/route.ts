import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const sitePassword = process.env.SITE_PASSWORD

    if (!sitePassword) {
      return NextResponse.json(
        { success: false, error: 'Site not configured' },
        { status: 500 }
      )
    }

    if (password === sitePassword) {
      return NextResponse.json({ success: true, authToken: 'authenticated' })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
