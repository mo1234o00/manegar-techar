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
import { useRouter } from 'next/navigation'

interface EditAcademicYearModalProps {
  year: {
    id: string
    startDate: string
    endDate: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const academicYearSchema = z.object({
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
})

type AcademicYearFormValues = z.infer<typeof academicYearSchema>

export function EditAcademicYearModal({ year, open, onOpenChange }: EditAcademicYearModalProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      startDate: year.startDate.split('T')[0],
      endDate: year.endDate.split('T')[0],
    },
  })

  const onSubmit = async (values: AcademicYearFormValues) => {
    setLoading(true)

    try {
      const response = await fetch(`/api/academic-years/${year.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        onOpenChange(false)
        form.reset()
        router.refresh()
      }
    } catch (error) {
      console.error('فشل تحديث السنة الأكاديمية:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>تعديل السنة الأكاديمية</DialogTitle>
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
              {loading ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
