'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Welcome to Matchday ⚽</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to make predictions and join leagues
          </p>
        </div>
        <Button onClick={handleGoogleLogin} className="w-full" size="lg">
          Continue with Google
        </Button>
      </div>
    </div>
  )
}
