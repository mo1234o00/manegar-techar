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

interface EditStudentModalProps {
  student: {
    id: string
    name: string
    parentPhone: string
    whatsappNumber?: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const studentSchema = z.object({
  name: z.string().min(2, 'الاسم لازم يكون حرفين على الأقل'),
  parentPhone: z.string().min(5, 'رقم التليفون مطلوب'),
  whatsappNumber: z.string().optional(),
})

type StudentFormValues = z.infer<typeof studentSchema>

export function EditStudentModal({ student, open, onOpenChange, onSuccess }: EditStudentModalProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: student.name,
      parentPhone: student.parentPhone,
      whatsappNumber: student.whatsappNumber || '',
    },
  })

  const onSubmit = async (values: StudentFormValues) => {
    setLoading(true)

    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        onOpenChange(false)
        form.reset()
        onSuccess?.()
      }
    } catch (error) {
      console.error('فشل تحديث الطالب:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الطالب</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="name">اسم الطالب</Label>
                  <FormControl>
                    <Input
                      id="name"
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
              name="parentPhone"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="parentPhone">رقم تليفون ولي الأمر</Label>
                  <FormControl>
                    <Input
                      id="parentPhone"
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
              name="whatsappNumber"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="whatsappNumber">رقم واتساب (اختياري)</Label>
                  <FormControl>
                    <Input
                      id="whatsappNumber"
                      placeholder="مثال: 201234567890"
                      className="bg-white/5 border-white/10 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-white/90">
              {loading ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
