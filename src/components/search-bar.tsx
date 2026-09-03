'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search, User, X } from 'lucide-react'

interface SearchResult {
  id: string
  name: string
  studentCode: string
  group: {
    id: string
    autoName: string
    year: {
      autoName: string
    }
  }
}

export function SearchBar() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)

  useState(() => {
    setMounted(true)
  })

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  if (!mounted) {
    return <div className="flex-1 max-w-md"></div>
  }

  return (
    <div className="flex items-center gap-2 flex-1 max-w-md relative">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
        <Input
          placeholder="ابحث عن الطلاب بالاسم أو الكود..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowResults(searchResults.length > 0)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:ring-white/20"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              setSearchResults([])
              setShowResults(false)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
          {searchResults.map((student) => (
            <a
              key={student.id}
              href={`/groups/${student.group.id}`}
              className="flex items-center gap-3 p-3 hover:bg-white/5 border-b border-white/10 last:border-b-0 block"
              onClick={() => {
                setSearchQuery('')
                setSearchResults([])
                setShowResults(false)
              }}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <User className="h-4 w-4 text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{student.name}</div>
                <div className="text-sm text-white/60">
                  كود: {student.studentCode} • {student.group.autoName}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {showResults && searchResults.length === 0 && searchQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 rounded-lg shadow-xl p-3 text-white/40 text-sm z-50">
          مفيش طلاب
        </div>
      )}
    </div>
  )
}
