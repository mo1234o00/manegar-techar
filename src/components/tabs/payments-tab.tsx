'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, Calendar, MessageCircle } from 'lucide-react'
import { Toast } from '@/components/toast'

interface Student {
  id: string
  name: string
  studentCode: string
  whatsappNumber: string | null
}

interface Payment {
  id: string
  studentId: string
  month: string
  amountRequired: number
  amountPaid: number
  discount: number
  status: 'Full' | 'Partial' | 'Unpaid'
}

interface PaymentsTabProps {
  groupId: string
  monthlyPrice: number
  students: Student[]
  createdAt?: Date
}

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

const COUNTRIES = [
  { name: 'السعودية', code: '+966' },
  { name: 'مصر', code: '+20' },
  { name: 'الأردن', code: '+962' },
  { name: 'عمان', code: '+968' },
  { name: 'الكويت', code: '+965' },
  { name: 'ليبيا', code: '+218' },
]

const currentYear = new Date().getFullYear()

export function PaymentsTab({ groupId, monthlyPrice, students, createdAt }: PaymentsTabProps) {
  const [selectedMonth, setSelectedMonth] = useState('')
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('+966') // Default to Saudi Arabia
  
  const groupCreatedDate = createdAt ? new Date(createdAt) : new Date()
  
  // Generate available months starting from group creation month
  const getAvailableMonths = () => {
    const months: string[] = []
    const today = new Date()
    let currentDate = new Date(groupCreatedDate)
    currentDate.setDate(1) // Set to first day of the month
    
    while (currentDate <= today) {
      const monthIndex = currentDate.getMonth()
      const year = currentDate.getFullYear()
      const monthName = MONTHS[monthIndex]
      months.push(`${monthName} ${year}`)
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    return months
  }

  const handleMonthChange = async (month: string | null) => {
    if (!month) return
    setSelectedMonth(month)
    
    // Load existing payments for this month
    try {
      const response = await fetch(`/api/payments?groupId=${groupId}&month=${month}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error('فشل تحميل المدفوعات:', error)
    }
  }

  const handlePaymentChange = (studentId: string, field: 'amountPaid' | 'discount', value: string) => {
    const numValue = parseFloat(value) || 0
    setPayments(prev => {
      const existing = prev.find(p => p.studentId === studentId)
      if (existing) {
        return prev.map(p => 
          p.studentId === studentId 
            ? { ...p, [field]: numValue }
            : p
        )
      } else {
        const netPaid = field === 'amountPaid' ? numValue : 0
        const discount = field === 'discount' ? numValue : 0
        const status = netPaid + discount >= monthlyPrice ? 'Full' : netPaid + discount > 0 ? 'Partial' : 'Unpaid'
        return [...prev, {
          id: '',
          studentId,
          month: selectedMonth,
          amountRequired: monthlyPrice,
          amountPaid: netPaid,
          discount,
          status,
        }]
      }
    })
  }

  const handleSave = async () => {
    if (!selectedMonth) {
      setToastMessage('الرجاء اختيار شهر أولاً')
      setToastOpen(true)
      return
    }

    if (payments.length === 0) {
      setToastMessage('الرجاء تحديد طالب على الأقل قبل الحفظ')
      setToastOpen(true)
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const promises = payments.map(payment =>
        fetch('/api/payments', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            studentId: payment.studentId,
            groupId,
            month: payment.month,
            amountRequired: payment.amountRequired,
            amountPaid: payment.amountPaid,
            discount: payment.discount,
          }),
        })
      )

      await Promise.all(promises)
      setToastMessage('تم حفظ المدفوعات بنجاح!')
      setToastOpen(true)
    } catch (error) {
      console.error('فشل حفظ المدفوعات:', error)
      setToastMessage('فشل حفظ المدفوعات')
      setToastOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Full': return 'text-green-400'
      case 'Partial': return 'text-yellow-400'
      case 'Unpaid': return 'text-red-400'
      default: return 'text-white'
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <Calendar className="h-4 w-4 mr-2 text-white/40" />
                <SelectValue placeholder="اختر الشهر" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/10 text-white">
                {getAvailableMonths().map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select value={selectedCountry} onValueChange={(value) => value && setSelectedCountry(value)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="الدولة" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/10 text-white">
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!selectedMonth || loading}
            className="bg-white text-black hover:bg-white/90"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ المدفوعات'}
          </Button>
        </div>

      {!selectedMonth ? (
        <div className="text-center py-8 border border-white/10 rounded-lg">
          <p className="text-white/40">اختر شهر لتسجيل المدفوعات</p>
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
              <TableHead className="text-white/60">المطلوب</TableHead>
              <TableHead className="text-white/60">المدفوع</TableHead>
              <TableHead className="text-white/60">خصم</TableHead>
              <TableHead className="text-white/60">الحالة</TableHead>
              <TableHead className="text-white/60">إرسال</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              const payment = payments.find(p => p.studentId === student.id)
              const amountPaid = payment?.amountPaid || 0
              const discount = payment?.discount || 0
              const netPaid = amountPaid + discount
              const status = netPaid >= monthlyPrice ? 'Full' : netPaid > 0 ? 'Partial' : 'Unpaid'
              const remaining = monthlyPrice - netPaid

              return (
                <TableRow key={student.id} className="border-white/10">
                  <TableCell className="font-mono">{student.studentCode}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-white/40" />
                      {monthlyPrice.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) => handlePaymentChange(student.id, 'amountPaid', e.target.value)}
                      className="bg-white/5 border-white/10 text-white w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={discount}
                      onChange={(e) => handlePaymentChange(student.id, 'discount', e.target.value)}
                      className="bg-white/5 border-white/10 text-white w-24"
                    />
                  </TableCell>
                  <TableCell className={getStatusColor(status)}>
                    {status}
                  </TableCell>
                  <TableCell>
                    {student.whatsappNumber && (amountPaid > 0 || discount > 0) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const message = `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب ${student.name}، دفع شهر ${selectedMonth}: ${netPaid} ج.م، المتبقي: ${remaining > 0 ? remaining : 0} ج.م`
                          const phoneWithCountryCode = `${selectedCountry}${student.whatsappNumber}`
                          const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountryCode}&text=${encodeURIComponent(message)}`
                          window.location.href = whatsappUrl
                        }}
                        className="text-green-400 hover:bg-green-400/10"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
    
    <Toast open={toastOpen} onOpenChange={setToastOpen} message={toastMessage} />
    </>
  )
}
