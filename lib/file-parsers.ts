import { parse as csvParse } from "csv-parse/sync"
import * as XLSX from "xlsx"
import { PDFDocument } from "pdf-lib"

// Define transaction type for parsed data
type ParsedTransaction = {
  date: string
  description: string
  amount: number
  categoryId?: string | null
}

// Define column mappings type
type ColumnMappings = {
  date: string
  description: string
  amount: string
  category?: string
}

export async function parseCSV(file: File, mappings: ColumnMappings): Promise<ParsedTransaction[]> {
  // Read file as text
  const text = await file.text()

  // Parse CSV
  const records = csvParse(text, {
    columns: true,
    skip_empty_lines: true,
  })

  // Map records to transactions
  return records
    .map((record: any) => {
      const amount = Number.parseFloat(record[mappings.amount])

      return {
        date: record[mappings.date],
        description: record[mappings.description],
        amount: isNaN(amount) ? 0 : amount,
        categoryId: mappings.category ? record[mappings.category] : null,
      }
    })
    .filter(
      (transaction: ParsedTransaction) => transaction.date && transaction.description && !isNaN(transaction.amount),
    )
}

export async function parseExcel(file: File, mappings: ColumnMappings): Promise<ParsedTransaction[]> {
  // Read file as array buffer
  const buffer = await file.arrayBuffer()

  // Parse Excel
  const workbook = XLSX.read(buffer, { type: "array" })

  // Get first sheet
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Convert to JSON
  const records = XLSX.utils.sheet_to_json(sheet)

  // Map records to transactions
  return records
    .map((record: any) => {
      const amount = Number.parseFloat(record[mappings.amount])

      return {
        date: record[mappings.date],
        description: record[mappings.description],
        amount: isNaN(amount) ? 0 : amount,
        categoryId: mappings.category ? record[mappings.category] : null,
      }
    })
    .filter(
      (transaction: ParsedTransaction) => transaction.date && transaction.description && !isNaN(transaction.amount),
    )
}

export async function parsePDF(file: File): Promise<ParsedTransaction[]> {
  // This is a simplified implementation
  // In a real application, you would use a more sophisticated PDF parsing library

  // Read file as array buffer
  const buffer = await file.arrayBuffer()

  // Load PDF
  const pdfDoc = await PDFDocument.load(buffer)

  // Get number of pages
  const pageCount = pdfDoc.getPageCount()

  // This is a placeholder - actual PDF parsing is complex and depends on the PDF structure
  // In a real application, you would extract text and use regex or other techniques to identify transactions

  // Return empty array for now
  return []
}

