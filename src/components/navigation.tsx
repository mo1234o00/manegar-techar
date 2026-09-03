import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import { SearchBar } from './search-bar'

export function Navigation() {
  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold text-white">
            نظام إدارة المعلمين
          </Link>

          <SearchBar />

          <div className="flex items-center gap-1">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <Home className="h-4 w-4 mr-2" />
                لوحة التحكم
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
