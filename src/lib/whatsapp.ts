export interface WhatsAppMessageParams {
  phoneNumber: string
  studentName: string
  type: 'attendance' | 'payment'
  details: {
    date?: string
    status?: string
    month?: string
    amount?: number
    remaining?: number
  }
}

export function generateWhatsAppLink(params: WhatsAppMessageParams): string {
  const { phoneNumber, studentName, type, details } = params
  
  // Remove any non-numeric characters and ensure it starts with country code
  const cleanPhone = phoneNumber.replace(/\D/g, '')
  
  let message = ''
  
  if (type === 'attendance') {
    const statusMap: Record<string, string> = {
      'حاضر': 'حاضر',
      'غائب': 'غائب',
      'معتذر': 'معتذر',
      'متأخر': 'متأخر'
    }
    const status = statusMap[details.status || ''] || details.status
    message = `📚 تحديث الحضور\n\nالطالب: ${studentName}\nالتاريخ: ${details.date}\nالحالة: ${status}\n\nشكراً لتواصلكم معنا`
  } else if (type === 'payment') {
    const paid = details.amount || 0
    const remaining = details.remaining || 0
    message = `💰 تحديث الدفع\n\nالطالب: ${studentName}\nالشهر: ${details.month}\nالمبلغ المدفوع: ${paid} ج.م\nالمتبقي: ${remaining} ج.م\n\nشكراً لتواصلكم معنا`
  }
  
  const encodedMessage = encodeURIComponent(message)
  
  // Use the official WhatsApp click-to-chat link
  // This will open the app on mobile if installed, otherwise opens web
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export function sendWhatsAppNotification(params: WhatsAppMessageParams): string {
  return generateWhatsAppLink(params)
}
