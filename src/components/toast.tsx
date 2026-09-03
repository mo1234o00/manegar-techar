'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CheckCircle } from 'lucide-react'

interface ToastProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
  duration?: number
}

export function Toast({ open, onOpenChange, message, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [open, onOpenChange, duration])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-green-500/30 text-white max-w-sm">
        <div className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-white/90">{message}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
