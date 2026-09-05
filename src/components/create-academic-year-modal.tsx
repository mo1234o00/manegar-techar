'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

const STAGES = ['ابتدائي', 'إعدادي', 'ثانوي'] // Updated
const TERMS = ['ترم أول', 'ترم ثاني']
const EDUCATION_SYSTEMS = ['النظام القديم', 'نظام البكالوريا الجديد']
const GRADES_NEW_SYSTEM = ['المرحلة التمهيدية العامة', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي']
const GRADES_OLD_SYSTEM = ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي']
const SPECIALIZATIONS_NEW_SYSTEM = [
  'مسار القطاع الطبي وعلوم الحياة',
  'مسار الهندسة والتكنولوجيا وعلوم الحاسب',
  'مسار العلوم الإدارية والأعمال',
  'مسار الآداب والفنون والعلوم الإنسانية'
]
const SPECIALIZATIONS_OLD_SYSTEM_GRADE_2 = ['علمي', 'أدبي']
const SPECIALIZATIONS_OLD_SYSTEM_GRADE_3 = ['علمي علوم', 'علمي رياضة', 'أدبي']

const academicYearSchema = z.object({
  stage: z.string().min(1, 'مطلوب اختيار المرحلة'),
  term: z.string().optional(),
  educationSystem: z.string().optional(),
  grade: z.string().optional(),
  specialization: z.string().optional(),
})

type AcademicYearFormValues = z.infer<typeof academicYearSchema>

export function CreateAcademicYearModal({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedStage, setSelectedStage] = useState('')
  const [selectedEducationSystem, setSelectedEducationSystem] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')

  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      stage: '',
      term: '',
      educationSystem: '',
      grade: '',
      specialization: '',
    },
  })

  const handleStageChange = (value: string | null) => {
    if (!value) return
    setSelectedStage(value)
    setSelectedEducationSystem('')
    setSelectedGrade('')
    form.setValue('stage', value)
    form.setValue('term', '')
    form.setValue('educationSystem', '')
    form.setValue('grade', '')
    form.setValue('specialization', '')
  }

  const handleEducationSystemChange = (value: string | null) => {
    if (!value) return
    setSelectedEducationSystem(value)
    setSelectedGrade('')
    form.setValue('educationSystem', value)
    form.setValue('grade', '')
    form.setValue('specialization', '')
  }

  const handleGradeChange = (value: string | null) => {
    if (!value) return
    setSelectedGrade(value)
    form.setValue('grade', value)
    form.setValue('specialization', '')
  }

  const handleSpecializationChange = (value: string | null) => {
    if (!value) return
    form.setValue('specialization', value)
  }

  const onSubmit = async (values: AcademicYearFormValues) => {
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      
      // Auto-generate dates based on current year
      const currentYear = new Date().getFullYear()
      const startDate = `${currentYear}-09-01`
      const endDate = `${currentYear + 1}-06-30`

      const response = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...values,
          startDate,
          endDate,
        }),
      })

      if (response.ok) {
        setOpen(false)
        form.reset()
        setSelectedStage('')
        setSelectedEducationSystem('')
        setSelectedGrade('')
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error) {
      console.error('فشل إنشاء السنة الأكاديمية:', error)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = () => {
    if (!selectedStage) return false
    
    if (selectedStage === 'ابتدائي' || selectedStage === 'إعدادي') {
      return form.watch('term') !== ''
    }
    
    if (selectedStage === 'ثانوي') {
      if (!selectedEducationSystem) return false
      if (!selectedGrade) return false
      
      // New system - Grade 1 doesn't need specialization
      if (selectedEducationSystem === 'نظام البكالوريا الجديد') {
        if (selectedGrade === 'المرحلة التمهيدية العامة') {
          return true
        }
        return form.watch('specialization') !== ''
      }
      
      // Old system - Grade 1 doesn't need specialization
      if (selectedEducationSystem === 'النظام القديم') {
        if (selectedGrade === 'الصف الأول الثانوي') {
          return true
        }
        return form.watch('specialization') !== ''
      }
    }
    
    return false
  }

  const getAvailableSpecializations = () => {
    if (selectedEducationSystem === 'نظام البكالوريا الجديد') {
      return SPECIALIZATIONS_NEW_SYSTEM
    }
    
    if (selectedEducationSystem === 'النظام القديم') {
      if (selectedGrade === 'الصف الثاني الثانوي') {
        return SPECIALIZATIONS_OLD_SYSTEM_GRADE_2
      }
      if (selectedGrade === 'الصف الثالث الثانوي') {
        return SPECIALIZATIONS_OLD_SYSTEM_GRADE_3
      }
    }
    
    return []
  }

  const showSpecialization = () => {
    if (selectedStage !== 'ثانوي' || !selectedEducationSystem || !selectedGrade) return false
    
    if (selectedEducationSystem === 'نظام البكالوريا الجديد') {
      return selectedGrade !== 'المرحلة التمهيدية العامة'
    }
    
    if (selectedEducationSystem === 'النظام القديم') {
      return selectedGrade !== 'الصف الأول الثانوي'
    }
    
    return false
  }

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-white text-black hover:bg-white/90"
      >
        <Plus className="h-4 w-4 mr-2" />
        إضافة سنة
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>إنشاء سنة أكاديمية</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stage">المرحلة الدراسية</Label>
              <Select value={selectedStage} onValueChange={handleStageChange}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="اختر المرحلة" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10 text-white">
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedStage === 'ابتدائي' || selectedStage === 'إعدادي') && (
              <div className="space-y-2">
                <Label htmlFor="term">الفصل الدراسي</Label>
                <Select 
                  value={form.watch('term')} 
                  onValueChange={(value) => value && form.setValue('term', value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="اختر الفصل" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white">
                    {TERMS.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStage === 'ثانوي' && (
              <div className="space-y-2">
                <Label htmlFor="educationSystem">نظام الدراسة</Label>
                <Select value={selectedEducationSystem} onValueChange={handleEducationSystemChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="اختر النظام" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white">
                    {EDUCATION_SYSTEMS.map((system) => (
                      <SelectItem key={system} value={system}>
                        {system}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStage === 'ثانوي' && selectedEducationSystem && (
              <div className="space-y-2">
                <Label htmlFor="grade">الصف الدراسي</Label>
                <Select value={selectedGrade} onValueChange={handleGradeChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white">
                    {(selectedEducationSystem === 'نظام البكالوريا الجديد' 
                      ? GRADES_NEW_SYSTEM 
                      : GRADES_OLD_SYSTEM
                    ).map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showSpecialization() && (
              <div className="space-y-2">
                <Label htmlFor="specialization">
                  {selectedEducationSystem === 'نظام البكالوريا الجديد' ? 'التخصص' : 'التشعيب'}
                </Label>
                <Select 
                  value={form.watch('specialization')} 
                  onValueChange={handleSpecializationChange}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder={`اختر ${selectedEducationSystem === 'نظام البكالوريا الجديد' ? 'التخصص' : 'التشعيب'}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white">
                    {getAvailableSpecializations().map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading || !canSubmit()} 
              className="w-full bg-white text-black hover:bg-white/90"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء السنة الأكاديمية'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
