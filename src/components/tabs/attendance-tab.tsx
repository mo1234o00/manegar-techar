'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, MessageCircle } from 'lucide-react'
import { Toast } from '@/components/toast'

interface Student {
  id: string
  name: string
  studentCode: string
  whatsappNumber?: string
}

interface AttendanceTabProps {
  groupId: string
  days: string
  students: Student[]
  createdAt?: string
}

const STATUS_OPTIONS = ['حاضر', 'غائب', 'معتذر', 'متأخر']

const DAY_NAMES_AR = {
  'Sunday': 'الأحد',
  'Monday': 'الاثنين',
  'Tuesday': 'الثلاثاء',
  'Wednesday': 'الأربعاء',
  'Thursday': 'الخميس',
  'Friday': 'الجمعة',
  'Saturday': 'السبت'
}

const DAY_NAMES_EN = {
  'الأحد': 'Sunday',
  'الاثنين': 'Monday',
  'الثلاثاء': 'Tuesday',
  'الأربعاء': 'Wednesday',
  'الخميس': 'Thursday',
  'الجمعة': 'Friday',
  'السبت': 'Saturday'
}

export function AttendanceTab({ groupId, days, students, createdAt }: AttendanceTabProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Convert Arabic days to English if needed
  const groupDays = days.split(',').map(day => {
    const trimmedDay = day.trim()
    // If day is Arabic, convert to English
    if (DAY_NAMES_EN[trimmedDay as keyof typeof DAY_NAMES_EN]) {
      return DAY_NAMES_EN[trimmedDay as keyof typeof DAY_NAMES_EN]
    }
    return trimmedDay
  })
  const groupCreatedDate = createdAt ? new Date(createdAt) : new Date()

  const handleDateChange = async (date: string | null) => {
    if (!date) return
    setSelectedDate(date)
    
    // Load existing attendance for this date
    try {
      const response = await fetch(`/api/attendance?groupId=${groupId}&date=${date}`)
      if (response.ok) {
        const data = await response.json()
        const attendanceMap: Record<string, string> = {}
        data.forEach((record: any) => {
          // Convert English status to Arabic for display
          const statusMap: Record<string, string> = {
            'Present': 'حاضر',
            'Absent': 'غائب',
            'Excused': 'معتذر',
            'Late': 'متأخر'
          }
          attendanceMap[record.studentId] = statusMap[record.status] || record.status
        })
        setAttendance(attendanceMap)
      }
    } catch (error) {
      console.error('فشل تحميل الحضور:', error)
    }
  }

  const handleStatusChange = (studentId: string, status: string | null) => {
    if (!status) return
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const handleSave = async () => {
    if (!selectedDate) return

    setLoading(true)
    try {
      // Convert Arabic status back to English for API
      const statusMap: Record<string, string> = {
        'حاضر': 'Present',
        'غائب': 'Absent',
        'معتذر': 'Excused',
        'متأخر': 'Late'
      }

      const promises = Object.entries(attendance).map(([studentId, status]) =>
        fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            groupId,
            date: selectedDate,
            status: statusMap[status] || status,
          }),
        })
      )

      await Promise.all(promises)
      setToastMessage('تم حفظ الحضور بنجاح!')
      setToastOpen(true)
    } catch (error) {
      console.error('فشل حفظ الحضور:', error)
      setToastMessage('فشل حفظ الحضور')
      setToastOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const isDateValid = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    return groupDays.includes(dayName)
  }

  const isDateAfterCreation = (date: Date) => {
    return date >= groupCreatedDate
  }

  // Generate dates from group creation date onwards
  const generateValidDates = () => {
    const dates: Date[] = []
    const today = new Date()
    let currentDate = new Date(groupCreatedDate)
    
    // Start from the first valid day after group creation
    while (currentDate <= today) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' })
      
      if (isDateValid(currentDate)) {
        dates.push(new Date(currentDate))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dates
  }

  const validDates = generateValidDates()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedDate} onValueChange={handleDateChange}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <Calendar className="h-4 w-4 mr-2 text-white/40" />
              <SelectValue placeholder="اختر التاريخ" />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/10 text-white">
              {validDates.length === 0 ? (
                <div className="p-3 text-white/40 text-sm">
                  مفيش تواريخ متاحة للحضور
                </div>
              ) : (
                validDates.map((date) => {
                  const dateStr = date.toISOString().split('T')[0]
                  const dayNameEn = date.toLocaleDateString('en-US', { weekday: 'long' })
                  const dayNameAr = DAY_NAMES_AR[dayNameEn as keyof typeof DAY_NAMES_AR]
                  
                  return (
                    <SelectItem 
                      key={dateStr} 
                      value={dateStr}
                      className="text-white"
                    >
                      {dateStr} ({dayNameAr})
                    </SelectItem>
                  )
                })
              )}
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!selectedDate || loading}
          className="bg-white text-black hover:bg-white/90"
        >
          {loading ? 'جاري الحفظ...' : 'حفظ الحضور'}
        </Button>
      </div>

      {!selectedDate ? (
        <div className="text-center py-8 border border-white/10 rounded-lg">
          <p className="text-white/40">اختر تاريخ لتسجيل الحضور</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-8 border border-white/10 rounded-lg">
          <p className="text-white/40">مفيش طلاب في المجموعة دي</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-white/60">الكود</TableHead>
              <TableHead className="text-white/60">الاسم</TableHead>
              <TableHead className="text-white/60">الحالة</TableHead>
              <TableHead className="text-white/60">إرسال</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} className="border-white/10">
                <TableCell className="font-mono">{student.studentCode}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>
                  <Select
                    value={attendance[student.id] || ''}
                    onValueChange={(status) => handleStatusChange(student.id, status)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {student.whatsappNumber && attendance[student.id] ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const message = `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب ${student.name}، حضور يوم ${selectedDate}: ${attendance[student.id]}`
                        const whatsappUrl = `https://api.whatsapp.com/send?phone=${student.whatsappNumber}&text=${encodeURIComponent(message)}`
                        window.location.href = whatsappUrl
                      }}
                      className="text-green-400 hover:bg-green-400/10"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
      />
    </div>
  )
}
