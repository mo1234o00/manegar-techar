'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, Calendar as CalendarIcon, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { CreateAcademicYearModal } from '@/components/create-academic-year-modal'
import { CreateGroupModal } from '@/components/create-group-modal'
import { EditAcademicYearModal } from '@/components/edit-academic-year-modal'
import { EditGroupModal } from '@/components/edit-group-modal'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface DashboardData {
  totalStudents: number
  totalGroups: number
  totalYears: number
  todayGroups: any[]
  years: any[]
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editYear, setEditYear] = useState<any>(null)
  const [editGroup, setEditGroup] = useState<any>(null)
  const [editYearOpen, setEditYearOpen] = useState(false)
  const [editGroupOpen, setEditGroupOpen] = useState(false)
  const [deleteYear, setDeleteYear] = useState<any>(null)
  const [deleteYearOpen, setDeleteYearOpen] = useState(false)
  const [deleteGroup, setDeleteGroup] = useState<any>(null)
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [userName, setUserName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting('صباح الخير')
    } else if (hour >= 12 && hour < 18) {
      setGreeting('مساء الخير')
    } else {
      setGreeting('مساء الخير')
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserName(user.displayName || user.username || '')

    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('فشل تحميل البيانات:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteYear = async (yearId: string) => {
    try {
      const response = await fetch(`/api/academic-years/${yearId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchDashboardData()
      } else {
        const error = await response.json()
        alert(error.error || 'فشل حذف السنة')
      }
    } catch (error) {
      console.error('فشل حذف السنة:', error)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchDashboardData()
      } else {
        const error = await response.json()
        alert(error.error || 'فشل حذف المجموعة')
      }
    } catch (error) {
      console.error('فشل حذف المجموعة:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>فشل تحميل البيانات</p>
      </div>
    )
  }

  // Zero State: No data at all
  if (data.totalYears === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <CalendarIcon className="h-10 w-10 text-white/40" />
              </div>
              <h1 className="text-4xl font-bold mb-4">{greeting}، {userName}</h1>
              <p className="text-xl text-white/60 mb-2">هنعملك الإعداد</p>
              <p className="text-white/40">ابدأ بإنشاء أول سنة أكاديمية</p>
            </div>
            
            <div className="space-y-4">
              <CreateAcademicYearModal />
              
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center justify-center gap-4 text-sm text-white/40">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">1</span>
                    إنشاء سنة
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">2</span>
                    إضافة مجموعات
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">3</span>
                    إضافة طلاب
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{greeting}، {userName}</h1>
          <p className="text-white/60">أهلاً بك في نظام إدارة المعلمين</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white/60 text-sm font-medium">إجمالي الطلاب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalStudents}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white/60 text-sm font-medium">إجمالي المجموعات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalGroups}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white/60 text-sm font-medium">السنوات الأكاديمية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalYears}</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Groups */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              مجموعات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.todayGroups.length === 0 ? (
              <p className="text-white/40">مفيش مجموعات مجدولة النهاردة</p>
            ) : (
              <div className="space-y-2">
                {data.todayGroups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
                      <div>
                        <div className="font-semibold">{group.autoName}</div>
                        <p className="text-sm text-white/60">{group.year.autoName}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-white/60">
                          <Users className="h-4 w-4 inline mr-1" />
                          {group._count.students} طالب
                        </div>
                        <Button size="sm" className="bg-white text-black hover:bg-white/90">
                          فتح
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Years */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>السنوات الأكاديمية</CardTitle>
            <CreateAcademicYearModal />
          </CardHeader>
          <CardContent>
            {data.years.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/40 mb-4">مفيش سنوات أكاديمية</p>
                <CreateAcademicYearModal />
              </div>
            ) : (
              <div className="space-y-4">
                {data.years.map((year) => (
                  <div key={year.id} className="border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{year.autoName}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditYear(year)
                              setEditYearOpen(true)
                            }}
                            className="text-white hover:bg-white/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteYear(year)
                              setDeleteYearOpen(true)
                            }}
                            className="text-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CreateGroupModal yearId={year.id} />
                    </div>
                    {year.groups.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-white/10 rounded-lg">
                        <p className="text-sm text-white/40 mb-3">لسه مفيش مجموعات في السنة دي</p>
                        <CreateGroupModal yearId={year.id} />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {year.groups.map((group: any) => (
                          <div key={group.id} className="flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 transition-colors">
                            <Link href={`/groups/${group.id}`} className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{group.autoName}</div>
                                  <div className="text-xs text-white/60">
                                    <Users className="h-3 w-3 inline mr-1" />
                                    {group._count.students} طالب
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                                  فتح
                                </Button>
                              </div>
                            </Link>
                            <div className="flex gap-2 mr-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditGroup(group)
                                  setEditGroupOpen(true)
                                }}
                                className="text-white hover:bg-white/10"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleteGroup(group)
                                  setDeleteGroupOpen(true)
                                }}
                                className="text-red-400 hover:bg-red-400/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {editYear && (
        <EditAcademicYearModal
          year={editYear}
          open={editYearOpen}
          onOpenChange={setEditYearOpen}
        />
      )}

      {editGroup && (
        <EditGroupModal
          group={editGroup}
          open={editGroupOpen}
          onOpenChange={setEditGroupOpen}
        />
      )}

      {deleteYear && (
        <ConfirmDialog
          open={deleteYearOpen}
          onOpenChange={setDeleteYearOpen}
          title="حذف السنة الأكاديمية"
          message={`أكيد عايز تحذف السنة "${deleteYear.autoName}"؟ لازم تكون مفيش مجموعات فيها.`}
          onConfirm={() => handleDeleteYear(deleteYear.id)}
          confirmText="حذف"
          cancelText="إلغاء"
        />
      )}

      {deleteGroup && (
        <ConfirmDialog
          open={deleteGroupOpen}
          onOpenChange={setDeleteGroupOpen}
          title="حذف المجموعة"
          message={`أكيد عايز تحذف المجموعة "${deleteGroup.autoName}"؟ لازم تكون مفيش طلاب فيها.`}
          onConfirm={() => handleDeleteGroup(deleteGroup.id)}
          confirmText="حذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  )
}
