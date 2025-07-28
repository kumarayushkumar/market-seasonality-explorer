import { FinancialMetrics } from '@/services/api'
import jsPDF from 'jspdf'

export const generateCSV = (data: FinancialMetrics[]) => {
  const headers = [
    'Date',
    'Open',
    'High',
    'Low',
    'Close',
    'Volume',
    'Performance',
    'Volatility',
    'Liquidity'
  ]
  const rows = data.map(item => [
    item.date,
    item.open,
    item.high,
    item.low,
    item.close,
    item.volume,
    item.performance,
    item.volatility,
    item.liquidity
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export const generatePDF = (
  data: FinancialMetrics[],
  timeframe: string,
  assetInfo: { name: string; symbol: string }
) => {
  // Create a new PDF document
  const pdf = new jsPDF()

  // Set document properties
  pdf.setProperties({
    title: `${assetInfo.name} Calendar Report`,
    subject: `Financial Calendar - ${timeframe.toUpperCase()}`,
    author: 'Financial Calendar App',
    creator: 'Financial Calendar App'
  })

  // Add title
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`${assetInfo.name} Calendar Report`, 20, 20)

  // Add subtitle
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Timeframe: ${timeframe.toUpperCase()}`, 20, 30)
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 37)

  // Add summary section
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Summary', 20, 50)

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  const avgPerformance = (
    data.reduce((sum, item) => sum + item.performance, 0) / data.length
  ).toFixed(2)
  const avgVolatility = (
    data.reduce((sum, item) => sum + item.volatility, 0) / data.length
  ).toFixed(2)

  pdf.text(`• Total periods: ${data.length}`, 20, 60)
  pdf.text(`• Average performance: ${avgPerformance}%`, 20, 67)
  pdf.text(`• Average volatility: ${avgVolatility}%`, 20, 74)

  // Add data table
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Data', 20, 90)

  // Table headers
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Date', 20, 100)
  pdf.text('Close', 60, 100)
  pdf.text('Performance', 90, 100)
  pdf.text('Volatility', 130, 100)
  pdf.text('Volume', 160, 100)

  // Table data
  pdf.setFont('helvetica', 'normal')
  let yPosition = 110
  const itemsPerPage = 25

  data.forEach((item, index) => {
    // Check if we need a new page
    if (index > 0 && index % itemsPerPage === 0) {
      pdf.addPage()
      yPosition = 20

      // Add headers to new page
      pdf.setFont('helvetica', 'bold')
      pdf.text('Date', 20, yPosition)
      pdf.text('Close', 60, yPosition)
      pdf.text('Performance', 90, yPosition)
      pdf.text('Volatility', 130, yPosition)
      pdf.text('Volume', 160, yPosition)
      yPosition = 30
    }

    pdf.setFont('helvetica', 'normal')
    pdf.text(item.date, 20, yPosition)
    pdf.text(`$${item.close.toFixed(2)}`, 60, yPosition)
    pdf.text(
      `${item.performance > 0 ? '+' : ''}${item.performance.toFixed(2)}%`,
      90,
      yPosition
    )
    pdf.text(`${item.volatility.toFixed(2)}%`, 130, yPosition)
    pdf.text(item.volume.toLocaleString(), 160, yPosition)

    yPosition += 7
  })

  return pdf
}

export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string
) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
