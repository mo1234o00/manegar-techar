'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, MessageCircle, Send } from 'lucide-react'
import { Toast } from '@/components/toast'

interface Student {
  id: string
  name: string
  studentCode: string
  whatsappNumber: string | null
  countryCode: string | null
}

interface AttendanceTabProps {
  groupId: string
  days: string
  students: Student[]
  createdAt?: Date
}

const STATUS_OPTIONS = ['حاضر', 'غائب', 'معتذر', 'متأخر']

const LEVEL_OPTIONS = ['ضعيف', 'مقبول', 'متوسط', 'جيد', 'جيد جداً', 'ممتاز']

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
  const [homework, setHomework] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [examScores, setExamScores] = useState<Record<string, number>>({})
  const [levels, setLevels] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [weeklySummaryOpen, setWeeklySummaryOpen] = useState(false)
  const [weeklySummary, setWeeklySummary] = useState<any[]>([])
  const [summaryLoading, setSummaryLoading] = useState(false)

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

  // Load persisted date on mount
  useEffect(() => {
    const savedDate = localStorage.getItem(`selectedDate_${groupId}`)
    if (savedDate) {
      setSelectedDate(savedDate)
      // Load existing attendance for this date
      const loadAttendance = async () => {
        try {
          const token = localStorage.getItem('authToken')
          const response = await fetch(`/api/attendance?groupId=${groupId}&date=${savedDate}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
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
      loadAttendance()
    }
  }, [groupId])

  const handleDateChange = async (date: string | null) => {
    if (!date) return
    setSelectedDate(date)
    localStorage.setItem(`selectedDate_${groupId}`, date)
    
    // Load existing attendance for this date
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/attendance?groupId=${groupId}&date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        const attendanceMap: Record<string, string> = {}
        const homeworkMap: Record<string, boolean> = {}
        const notesMap: Record<string, string> = {}
        const examScoresMap: Record<string, number> = {}
        const levelsMap: Record<string, string> = {}
        data.forEach((record: any) => {
          // Convert English status to Arabic for display
          const statusMap: Record<string, string> = {
            'Present': 'حاضر',
            'Absent': 'غائب',
            'Excused': 'معتذر',
            'Late': 'متأخر'
          }
          attendanceMap[record.studentId] = statusMap[record.status] || record.status
          homeworkMap[record.studentId] = record.homework || false
          notesMap[record.studentId] = record.notes || ''
          examScoresMap[record.studentId] = record.examScore || 0
          levelsMap[record.studentId] = record.level || 'مقبول'
        })
        setAttendance(attendanceMap)
        setHomework(homeworkMap)
        setNotes(notesMap)
        setExamScores(examScoresMap)
        setLevels(levelsMap)
      }
    } catch (error) {
      console.error('فشل تحميل الحضور:', error)
    }
  }

  const handleStatusChange = async (studentId: string, status: string | null) => {
    if (!status || !selectedDate) return
    
    // Update local state immediately
    setAttendance(prev => ({ ...prev, [studentId]: status }))
    
    // Save to database immediately
    saveAttendance(studentId)
  }

  const handleHomeworkChange = (studentId: string, value: boolean) => {
    setHomework(prev => ({ ...prev, [studentId]: value }))
    saveAttendance(studentId)
  }

  const handleNotesChange = (studentId: string, value: string) => {
    setNotes(prev => ({ ...prev, [studentId]: value }))
    saveAttendance(studentId)
  }

  const handleExamScoreChange = (studentId: string, value: string) => {
    setExamScores(prev => ({ ...prev, [studentId]: parseFloat(value) || 0 }))
    saveAttendance(studentId)
  }

  const handleLevelChange = (studentId: string, value: string) => {
    setLevels(prev => ({ ...prev, [studentId]: value }))
    saveAttendance(studentId)
  }

  const saveAttendance = async (studentId: string) => {
    if (!selectedDate) return
    
    // Convert Arabic status back to English for API
    const statusMap: Record<string, string> = {
      'حاضر': 'Present',
      'غائب': 'Absent',
      'معتذر': 'Excused',
      'متأخر': 'Late'
    }
    
    try {
      const token = localStorage.getItem('authToken')
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          groupId,
          date: selectedDate,
          status: statusMap[attendance[studentId]] || attendance[studentId],
          homework: homework[studentId] || false,
          notes: notes[studentId] || '',
          examScore: examScores[studentId] || 0,
          level: levels[studentId] || 'مقبول',
        }),
      })
    } catch (error) {
      console.error('فشل حفظ الحضور:', error)
    }
  }

  const getWeekRange = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    }
  }

  const handleWeeklySummary = async () => {
    setSummaryLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const { start, end } = getWeekRange()
      
      const response = await fetch(`/api/weekly-summary?groupId=${groupId}&weekStart=${start}&weekEnd=${end}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWeeklySummary(data)
        setWeeklySummaryOpen(true)
      } else {
        setToastMessage('فشل جلب ملخص الأسبوع')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('فشل جلب ملخص الأسبوع:', error)
      setToastMessage('فشل جلب ملخص الأسبوع')
      setToastOpen(true)
    } finally {
      setSummaryLoading(false)
    }
  }

  const sendWeeklyMessage = (summary: any) => {
    let message = `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب ${summary.studentName}\n`
    message += `ملخص الأسبوع:\n`
    message += `- عدد الحضور: ${summary.presentCount}\n`
    message += `- عدد الغياب: ${summary.absentCount}\n`
    if (summary.excusedCount > 0) {
      message += `- عدد العذر: ${summary.excusedCount}\n`
    }
    if (summary.lateCount > 0) {
      message += `- عدد التأخير: ${summary.lateCount}\n`
    }
    if (summary.examCount > 0) {
      message += `- متوسط درجات الامتحانات: ${summary.averageExamScore}/10\n`
    }
    
    const phoneWithCountryCode = `${summary.countryCode || '+966'}${summary.whatsappNumber}`
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountryCode}&text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
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
          onClick={handleWeeklySummary} 
          disabled={summaryLoading}
          className="bg-green-500 text-white hover:bg-green-600"
        >
          {summaryLoading ? 'جاري التحميل...' : 'ملخص الأسبوع'}
        </Button>
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
              <TableHead className="text-white/60">الواجب</TableHead>
              <TableHead className="text-white/60">المستوى</TableHead>
              <TableHead className="text-white/60">درجة الامتحان</TableHead>
              <TableHead className="text-white/60">ملاحظات</TableHead>
              <TableHead className="text-white/60">إرسال</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} className={`border-white/10 ${attendance[student.id] === 'حاضر' ? 'border-green-500/50 bg-green-500/5' : ''}`}>
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
                  <input
                    type="checkbox"
                    checked={homework[student.id] || false}
                    onChange={(e) => handleHomeworkChange(student.id, e.target.checked)}
                    className="w-4 h-4"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={levels[student.id] || 'مقبول'}
                    onValueChange={(value) => value && handleLevelChange(student.id, value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white w-32">
                      <SelectValue placeholder="المستوى" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      {LEVEL_OPTIONS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="0"
                    value={examScores[student.id] || ''}
                    onChange={(e) => handleExamScoreChange(student.id, e.target.value)}
                    className="bg-white/5 border-white/10 text-white w-20 px-2 py-1 rounded"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    placeholder="ملاحظات"
                    value={notes[student.id] || ''}
                    onChange={(e) => handleNotesChange(student.id, e.target.value)}
                    className="bg-white/5 border-white/10 text-white w-32 px-2 py-1 rounded"
                  />
                </TableCell>
                <TableCell>
                  {student.whatsappNumber && attendance[student.id] ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        let message = `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب ${student.name}، حضور يوم ${selectedDate}: ${attendance[student.id]}`
                        
                        if (homework[student.id]) {
                          message += `، الواجب: تم`
                        } else {
                          message += `، الواجب: لم يتم`
                        }
                        
                        if (notes[student.id]) {
                          message += `، ملاحظات: ${notes[student.id]}`
                        }
                        
                        if (examScores[student.id]) {
                          message += `، درجة الامتحان: ${examScores[student.id]}`
                        }
                        
                        message += `، المستوى: ${levels[student.id]}`
                        
                        const phoneWithCountryCode = `${student.countryCode || '+966'}${student.whatsappNumber}`
                        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountryCode}&text=${encodeURIComponent(message)}`
                        window.open(whatsappUrl, '_blank')
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

      <Dialog open={weeklySummaryOpen} onOpenChange={setWeeklySummaryOpen}>
        <DialogContent className="bg-black border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ملخص الأسبوع</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">الكود</TableHead>
                <TableHead className="text-white/60">الاسم</TableHead>
                <TableHead className="text-white/60">حضور</TableHead>
                <TableHead className="text-white/60">غياب</TableHead>
                <TableHead className="text-white/60">عذر</TableHead>
                <TableHead className="text-white/60">تأخير</TableHead>
                <TableHead className="text-white/60">متوسط الامتحانات</TableHead>
                <TableHead className="text-white/60">إرسال</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklySummary.map((summary) => (
                <TableRow key={summary.studentId} className="border-white/10">
                  <TableCell className="font-mono">{summary.studentCode}</TableCell>
                  <TableCell>{summary.studentName}</TableCell>
                  <TableCell className="text-green-400">{summary.presentCount}</TableCell>
                  <TableCell className="text-red-400">{summary.absentCount}</TableCell>
                  <TableCell className="text-yellow-400">{summary.excusedCount}</TableCell>
                  <TableCell className="text-orange-400">{summary.lateCount}</TableCell>
                  <TableCell>
                    {summary.examCount > 0 ? (
                      <span className="text-blue-400">{summary.averageExamScore}/10</span>
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {summary.whatsappNumber ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sendWeeklyMessage(summary)}
                        className="text-green-400 hover:bg-green-400/10"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
      />
    </div>
  )
}
