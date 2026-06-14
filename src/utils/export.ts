import ExcelJS from 'exceljs'
import { formatDate } from './date'
import type { ComplianceRow, CriticalAlert, OwnerRiskScore } from '@/types'

/**
 * Guard against CSV/Excel formula injection: a cell whose text begins with
 * =, +, -, @, tab or carriage-return is prefixed with an apostrophe so the
 * spreadsheet treats it as literal text rather than a formula (audit M27).
 */
function safeCell(v: string | null | undefined): string {
  const s = v ?? ''
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  try {
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    throw new Error(
      e instanceof Error ? `Failed to generate file: ${e.message}` : 'Failed to generate Excel file'
    )
  }
}

function styledHeader(ws: ExcelJS.Worksheet, columns: { header: string; key: string; width: number }[]) {
  ws.columns = columns
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 20
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

export async function exportCompliances(rows: ComplianceRow[], filename = 'compliances') {
  try {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Grammercy Compliance Dashboard — KIPL'
    const ws = wb.addWorksheet('Compliances')

    styledHeader(ws, [
      { header: 'Certificate No',   key: 'certificate_no',    width: 20 },
      { header: 'Certificate Name', key: 'certificate_name',  width: 35 },
      { header: 'Owner',            key: 'owner_name',        width: 22 },
      { header: 'Category',         key: 'category_name',     width: 22 },
      { header: 'Department',       key: 'department_name',   width: 22 },
      { header: 'Renewal Freq.',    key: 'renewal_frequency', width: 16 },
      { header: 'Last Renewed',     key: 'last_renewed_date', width: 16 },
      { header: 'Next Renewal',     key: 'next_renewal_date', width: 16 },
      { header: 'Status',           key: 'status',            width: 14 },
      { header: 'Days Remaining',   key: 'days_remaining',    width: 16 },
      { header: 'Notes',            key: 'notes',             width: 40 },
    ])

    rows.forEach((r) => {
      ws.addRow({
        ...r,
        certificate_no: safeCell(r.certificate_no),
        certificate_name: safeCell(r.certificate_name),
        owner_name: safeCell(r.owner_name),
        category_name: safeCell(r.category_name),
        department_name: safeCell(r.department_name),
        last_renewed_date: formatDate(r.last_renewed_date),
        next_renewal_date: formatDate(r.next_renewal_date),
        days_remaining: r.days_remaining ?? '',
        notes: safeCell(r.notes),
      })
    })

    ws.eachRow((row, i) => {
      if (i === 1) return
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }
      })
      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      }
    })

    await downloadWorkbook(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : 'Failed to export compliances'
    )
  }
}

export async function exportAlerts(rows: CriticalAlert[]) {
  try {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Critical Alerts')

    styledHeader(ws, [
      { header: 'Certificate No',   key: 'certificate_no',    width: 20 },
      { header: 'Certificate Name', key: 'certificate_name',  width: 35 },
      { header: 'Owner',            key: 'owner_name',        width: 22 },
      { header: 'Category',         key: 'category_name',     width: 22 },
      { header: 'Department',       key: 'department_name',   width: 22 },
      { header: 'Next Renewal',     key: 'next_renewal_date', width: 16 },
      { header: 'Days Remaining',   key: 'days_remaining',    width: 16 },
      { header: 'Status',           key: 'status',            width: 14 },
    ])

    rows.forEach((r) => {
      ws.addRow({
        ...r,
        certificate_no: safeCell(r.certificate_no),
        certificate_name: safeCell(r.certificate_name),
        owner_name: safeCell(r.owner_name),
        category_name: safeCell(r.category_name),
        department_name: safeCell(r.department_name),
        next_renewal_date: formatDate(r.next_renewal_date),
        days_remaining: r.days_remaining ?? '',
      })
    })

    await downloadWorkbook(wb, `critical_alerts_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : 'Failed to export alerts'
    )
  }
}

export async function exportRiskScores(rows: OwnerRiskScore[]) {
  try {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Owner Risk Scores')

    styledHeader(ws, [
      { header: 'Owner',       key: 'owner_name',        width: 25 },
      { header: 'Total',       key: 'total_compliances', width: 10 },
      { header: 'Overdue',     key: 'overdue_count',     width: 12 },
      { header: 'Due Soon',    key: 'due_soon_count',    width: 12 },
      { header: 'Active',      key: 'active_count',      width: 10 },
      { header: 'Risk Score',  key: 'risk_score',        width: 12 },
    ])

    rows.forEach((r) => ws.addRow({ ...r, owner_name: safeCell(r.owner_name) }))

    await downloadWorkbook(wb, `owner_risk_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : 'Failed to export risk scores'
    )
  }
}
