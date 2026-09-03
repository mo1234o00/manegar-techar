'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormMessage, FormProvider } from '@/components/ui/form'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

const academicYearSchema = z.object({
  startDate: z.string().min(1, 'مطلوب تاريخ البداية'),
  endDate: z.string().min(1, 'مطلوب تاريخ النهاية'),
})

type AcademicYearFormValues = z.infer<typeof academicYearSchema>

export function CreateAcademicYearModal({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
    },
  })

  const onSubmit = async (values: AcademicYearFormValues) => {
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        setOpen(false)
        form.reset()
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error) {
      console.error('فشل إنشاء السنة الأكاديمية:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-white text-black hover:bg-white/90"
      >
        <Plus className="h-4 w-4 mr-2" />
        إضافة سنة
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>إنشاء سنة أكاديمية</DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="startDate">تاريخ البداية</Label>
                    <FormControl>
                      <Input
                        id="startDate"
                        type="date"
                        className="bg-white/5 border-white/10 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="endDate">تاريخ النهاية</Label>
                    <FormControl>
                      <Input
                        id="endDate"
                        type="date"
                        className="bg-white/5 border-white/10 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-sm text-white/40">
                النظام هيعمل اسم السنة تلقائياً (مثال: "2024-2025")
              </p>
              <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-white/90">
                {loading ? 'جاري الإنشاء...' : 'إنشاء السنة الأكاديمية'}
              </Button>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  )
}
