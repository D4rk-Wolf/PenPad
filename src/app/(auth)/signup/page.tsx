import { AuthForm } from '@/components/auth/auth-form'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AuthForm mode="signup" />
    </main>
  )
}
