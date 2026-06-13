'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Trophy, Users, BarChart3, Shirt, Target, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Fixtures', icon: Calendar },
  { href: '/predict', label: 'Predict', icon: Target },
  { href: '/standings', label: 'Standings', icon: BarChart3 },
  { href: '/teams', label: 'Teams', icon: Shirt },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/leagues', label: 'Leagues', icon: Users },
  { href: '/news', label: 'News', icon: Newspaper },
]

export default function Header() {
  const supabase = createClient()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => setUsername(profile?.username ?? null))
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => setUsername(profile?.username ?? null))
      } else {
        setUsername(null)
      }
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? 'U')[0].toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0c0f14]/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group"
        >
          <span className="text-xl leading-none">⚽</span>
          <span className="font-black text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
            Matchday
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150',
                  active
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
                )}
              >
                <Icon
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    active ? 'text-emerald-400' : 'text-white/30'
                  )}
                />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Auth */}
        <div className="shrink-0">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none ring-2 ring-transparent focus-visible:ring-emerald-500/50 transition-all">
                  <Avatar className="h-8 w-8 ring-1 ring-white/10">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-[#141820] border-white/[0.08] text-white shadow-xl shadow-black/40"
              >
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-white/90 truncate">
                    {user.user_metadata?.full_name ?? user.email}
                  </p>
                  {username && (
                    <p className="text-[11px] text-white/35 truncate mt-0.5">@{username}</p>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                {username && (
                  <DropdownMenuItem asChild className="text-white/70 hover:text-white focus:text-white hover:bg-white/[0.06] focus:bg-white/[0.06] cursor-pointer text-xs">
                    <Link href={`/user/${username}`}>My Profile</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="text-white/70 hover:text-white focus:text-white hover:bg-white/[0.06] focus:bg-white/[0.06] cursor-pointer text-xs">
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-red-500/[0.08] focus:bg-red-500/[0.08] cursor-pointer text-xs"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-colors tracking-wide"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center gap-0.5 overflow-x-auto px-3 pb-2 scrollbar-none">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shrink-0',
                active
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/[0.05]'
              )}
            >
              <Icon className="h-3 w-3 shrink-0" />
              {label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
