import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StudentsTab } from '@/components/tabs/students-tab'
import { AttendanceTab } from '@/components/tabs/attendance-tab'
import { PaymentsTab } from '@/components/tabs/payments-tab'

async function getGroupData(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      year: true,
      students: {
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!group) {
    return null
  }

  return group
}

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const group = await getGroupData(id)

  if (!group) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              الرجوع للوحة التحكم
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{group.autoName}</h1>
          <p className="text-white/60">{group.year.autoName}</p>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <Tabs defaultValue="students" className="w-full">
              <TabsList className="bg-white/5 border-white/10 w-full justify-start">
                <TabsTrigger value="students" className="data-[state=active]:bg-white/10">
                  الطلاب
                </TabsTrigger>
                <TabsTrigger value="attendance" className="data-[state=active]:bg-white/10">
                  الحضور
                </TabsTrigger>
                <TabsTrigger value="payments" className="data-[state=active]:bg-white/10">
                  المدفوعات
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="students" className="mt-6">
                <StudentsTab groupId={group.id} monthlyPrice={group.monthlyPrice} />
              </TabsContent>
              
              <TabsContent value="attendance" className="mt-6">
                <AttendanceTab groupId={group.id} days={group.days} students={group.students} createdAt={group.createdAt} />
              </TabsContent>
              
              <TabsContent value="payments" className="mt-6">
                <PaymentsTab groupId={group.id} monthlyPrice={group.monthlyPrice} students={group.students} createdAt={group.createdAt} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
