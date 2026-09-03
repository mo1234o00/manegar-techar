'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormMessage, FormProvider } from '@/components/ui/form'
import { useRouter } from 'next/navigation'

interface EditGroupModalProps {
  group: {
    id: string
    days: string
    time: string
    monthlyPrice: number
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

const DAY_NAMES_MAP: Record<string, string> = {
  'السبت': 'Saturday',
  'الأحد': 'Sunday',
  'الاثنين': 'Monday',
  'الثلاثاء': 'Tuesday',
  'الأربعاء': 'Wednesday',
  'الخميس': 'Thursday',
  'الجمعة': 'Friday'
}

const DAY_NAMES_EN_TO_AR: Record<string, string> = {
  'Saturday': 'السبت',
  'Sunday': 'الأحد',
  'Monday': 'الاثنين',
  'Tuesday': 'الثلاثاء',
  'Wednesday': 'الأربعاء',
  'Thursday': 'الخميس',
  'Friday': 'الجمعة'
}

const groupSchema = z.object({
  days: z.array(z.string()).min(1, 'لازم تختار يوم على الأقل'),
  time: z.string().min(1, 'مطلوب الوقت'),
  monthlyPrice: z.string().min(1, 'مطلوب السعر الشهري'),
})

type GroupFormValues = z.infer<typeof groupSchema>

export function EditGroupModal({ group, open, onOpenChange }: EditGroupModalProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Convert English days to Arabic for the form
  const arabicDays = group.days.split(',').map(day => {
    const trimmedDay = day.trim()
    return DAY_NAMES_EN_TO_AR[trimmedDay] || trimmedDay
  })

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      days: arabicDays,
      time: group.time,
      monthlyPrice: group.monthlyPrice.toString(),
    },
  })

  const handleDayToggle = (day: string) => {
    const currentDays = form.getValues('days')
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day]
    form.setValue('days', newDays)
  }

  const onSubmit = async (values: GroupFormValues) => {
    setLoading(true)

    try {
      // Convert Arabic days to English
      const englishDays = values.days.map(day => DAY_NAMES_MAP[day])
      
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: englishDays,
          time: values.time,
          monthlyPrice: parseFloat(values.monthlyPrice),
        }),
      })

      if (response.ok) {
        onOpenChange(false)
        form.reset()
        router.refresh()
      }
    } catch (error) {
      console.error('فشل تحديث المجموعة:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>تعديل المجموعة</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="days"
              render={() => (
                <FormItem>
                  <Label>اختر الأيام</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DAYS.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={form.watch('days').includes(day)}
                          onCheckedChange={() => handleDayToggle(day)}
                          className="border-white/20"
                        />
                        <Label htmlFor={day} className="cursor-pointer">{day}</Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="time">الوقت</Label>
                  <FormControl>
                    <Input
                      id="time"
                      type="time"
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
              name="monthlyPrice"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="monthlyPrice">السعر الشهري</Label>
                  <FormControl>
                    <Input
                      id="monthlyPrice"
                      type="number"
                      className="bg-white/5 border-white/10 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-sm text-white/40">
              النظام هيعمل اسم المجموعة تلقائياً (مثال: "السبت، الثلاثاء - 4:00 مساءً")
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
