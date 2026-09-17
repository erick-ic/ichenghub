'use server'

import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, createAdminSessionToken } from '@/lib/admin-session'

interface LoginState {
  success: boolean;
  error?: string;
}

const getEnvValue = (value: string | undefined): string => {
  if (!value) return ''
  return value.replace(/^["']|["']$/g, '')
}

export async function login(state: LoginState, formData: FormData): Promise<LoginState> {
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const username = formData.get('username') as string
  const password = formData.get('password') as string

  const AUTH_USER = getEnvValue(process.env.ADMIN_USERNAME)
  const AUTH_PASS = getEnvValue(process.env.ADMIN_PASSWORD)

  if (username === AUTH_USER && password === AUTH_PASS) {
    const sessionToken = await createAdminSessionToken()
    cookies().set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    })
    return { success: true }
  }

  return { success: false, error: '凭据错误' }
}
