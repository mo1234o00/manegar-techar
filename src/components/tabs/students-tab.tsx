'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormMessage, FormProvider } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, User, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EditStudentModal } from '@/components/edit-student-modal'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface Student {
  id: string
  name: string
  parentPhone: string
  studentCode: string
  whatsappNumber: string | null
  countryCode: string | null
}

interface StudentsTabProps {
  groupId: string
  monthlyPrice: number
}

const COUNTRIES = [
  { name: 'السعودية', code: '+966' },
  { name: 'مصر', code: '+20' },
  { name: 'الأردن', code: '+962' },
  { name: 'عمان', code: '+968' },
  { name: 'الكويت', code: '+965' },
  { name: 'ليبيا', code: '+218' },
]

const studentSchema = z.object({
  name: z.string().min(2, 'الاسم لازم يكون حرفين على الأقل'),
  parentPhone: z.string().min(5, 'رقم التليفون مطلوب'),
  whatsappNumber: z.string().optional(),
  countryCode: z.string(),
})

type StudentFormValues = z.infer<typeof studentSchema>

export function StudentsTab({ groupId, monthlyPrice }: StudentsTabProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const router = useRouter()

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      parentPhone: '',
      whatsappNumber: '',
      countryCode: '+966',
    },
  })

  const fetchStudents = async () => {
    setDataLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/students?groupId=${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStudents(data || [])
      } else {
        setStudents([])
      }
    } catch (error) {
      console.error('فشل تحميل الطلاب:', error)
      setStudents([])
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [groupId])

  const onSubmit = async (values: StudentFormValues) => {
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const dataToSend = {
        groupId,
        name: values.name,
        parentPhone: values.parentPhone,
        whatsappNumber: values.whatsappNumber || null,
        countryCode: values.countryCode,
      }
      
      console.log('Sending data:', dataToSend)

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      const text = await response.text()
      console.log('Response text:', text)
      
      let result
      try {
        result = JSON.parse(text)
        console.log('Parsed result:', result)
      } catch (e) {
        console.error('Failed to parse response:', e)
        result = { error: text }
      }

      if (response.ok) {
        setOpen(false)
        form.reset()
        fetchStudents()
      } else {
        console.error('فشل إضافة الطالب:', result)
        const errorMessage = result.error || result.details || text || 'فشل إضافة الطالب'
        alert(errorMessage)
      }
    } catch (error) {
      console.error('فشل إضافة الطالب:', error)
      alert('فشل إضافة الطالب')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (student: Student) => {
    setEditStudent(student)
    setEditOpen(true)
  }

  const handleDelete = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchStudents()
      }
    } catch (error) {
      console.error('فشل حذف الطالب:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">الطلاب</h3>
          <p className="text-sm text-white/60">{students?.length || 0} طالب مسجل</p>
        </div>
        <Button className="bg-white text-black hover:bg-white/90" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة طالب
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>إضافة طالب</DialogTitle>
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
                name="countryCode"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="countryCode">رمز الدولة</Label>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="اختر الدولة" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name} ({country.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        placeholder="مثال: 5012345678"
                        className="bg-white/5 border-white/10 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-sm text-white/40">
                كود الطالب هيتم توليده تلقائياً
              </p>
              <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-white/90">
                {loading ? 'جاري الإضافة...' : 'إضافة الطالب'}
              </Button>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {dataLoading ? (
        <div className="text-center py-8 border border-white/10 rounded-lg">
          <p className="text-white/40">جاري تحميل الطلاب...</p>
        </div>
      ) : (!students || students.length === 0) ? (
        <div className="text-center py-8 border border-white/10 rounded-lg">
          <p className="text-white/40 mb-4">لسه مفيش طلاب مسجلين</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-white/60">الكود</TableHead>
              <TableHead className="text-white/60">الاسم</TableHead>
              <TableHead className="text-white/60">تليفون ولي الأمر</TableHead>
              <TableHead className="text-white/60">واتساب</TableHead>
              <TableHead className="text-white/60">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} className="border-white/10">
                <TableCell className="font-mono">{student.studentCode}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-white/40" />
                    {student.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-white/40" />
                    {student.parentPhone}
                  </div>
                </TableCell>
                <TableCell>
                  {student.whatsappNumber ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-400" />
                      {student.whatsappNumber}
                    </div>
                  ) : (
                    <span className="text-white/40">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(student)}
                      className="text-white hover:bg-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteConfirm(student)
                        setDeleteOpen(true)
                      }}
                      className="text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={fetchStudents}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="حذف الطالب"
          message={`أكيد عايز تحذف الطالب "${deleteConfirm.name}"؟`}
          onConfirm={() => handleDelete(deleteConfirm.id)}
          confirmText="حذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  )
}
