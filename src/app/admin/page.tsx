'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Users, Calendar, LogOut, Trash2 } from 'lucide-react'

interface Teacher {
  id: string
  username: string
  role: string
  totalStudents: number
  totalGroups: number
  totalYears: number
  createdAt: string
}

export default function AdminDashboard() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!token || user.role !== 'admin') {
      router.push('/login')
      return
    }

    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/admin/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTeachers(data)
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('فشل تحميل البيانات:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: newUsername, 
          password: newPassword,
          displayName: newDisplayName,
          role: 'teacher'
        })
      })

      if (response.ok) {
        setNewUsername('')
        setNewPassword('')
        setNewDisplayName('')
        fetchTeachers()
      } else {
        const data = await response.json()
        setError(data.error || 'فشل إنشاء المدرس')
      }
    } catch (error) {
      setError('حدث خطأ في الاتصال')
    }
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('أكيد عايز تحذف المدرس ده؟')) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchTeachers()
      } else {
        alert('فشل حذف المدرس')
      }
    } catch (error) {
      alert('حدث خطأ في الاتصال')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">لوحة تحكم الإدارة</h1>
            <p className="text-white/60">إدارة المدرسين والبيانات</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            تسجيل الخروج
          </Button>
        </div>

        {/* Add Teacher Form */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إضافة مدرس جديد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">الاسم للتحية</Label>
                  <Input
                    id="displayName"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="مثال: أستاذ أحمد"
                  />
                </div>
              </div>
              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}
              <Button type="submit" className="bg-white text-black hover:bg-white/90">
                إضافة مدرس
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Teachers List */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>المدرسين</CardTitle>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <p className="text-white/40 text-center py-8">مفيش مدرسين مسجلين</p>
            ) : (
              <div className="space-y-4">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5">
                    <div>
                      <div className="font-semibold">{teacher.username}</div>
                      <div className="text-sm text-white/60">
                        {teacher.totalStudents} طالب • {teacher.totalGroups} مجموعة • {teacher.totalYears} سنة
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeacher(teacher.id)}
                      className="text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
