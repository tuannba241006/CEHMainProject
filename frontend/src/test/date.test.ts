import { describe, it, expect } from "vitest"
import { parseCalendarDate, formatCalendarDate, inDateRange } from "../utils/date"

describe("Date Utilities (frontend/src/utils/date.ts)", () => {
  it("should parse Vietnamese format DD/MM/YYYY correctly", () => {
    const parsed = parseCalendarDate("25/12/2026")
    expect(parsed).not.toBeNull()
    expect(parsed?.getFullYear()).toBe(2026)
    expect(parsed?.getMonth()).toBe(11) // 0-indexed December
    expect(parsed?.getDate()).toBe(25)
  })

  it("should parse Vietnamese format with time DD/MM/YYYY HH:mm", () => {
    const parsed = parseCalendarDate("15/06/2026 14:30")
    expect(parsed).not.toBeNull()
    expect(parsed?.getFullYear()).toBe(2026)
    expect(parsed?.getHours()).toBe(14)
    expect(parsed?.getMinutes()).toBe(30)
  })

  it("should parse standard ISO strings correctly", () => {
    const parsed = parseCalendarDate("2026-11-20T08:00:00Z")
    expect(parsed).not.toBeNull()
    expect(parsed instanceof Date).toBe(true)
  })

  it("should return null for invalid or empty dates", () => {
    expect(parseCalendarDate("")).toBeNull()
    expect(parseCalendarDate(null)).toBeNull()
    expect(parseCalendarDate(undefined)).toBeNull()
    expect(parseCalendarDate("invalid-date-string-xyz")).toBeNull()
  })

  it("should format date to Vietnamese locale string DD/MM/YYYY", () => {
    const formatted = formatCalendarDate("2026-05-19T00:00:00Z")
    expect(formatted).toMatch(/\d{2}\/\d{2}\/2026/)
  })

  it("should check if date falls in range correctly", () => {
    expect(inDateRange("15/06/2026", "01/06/2026", "30/06/2026")).toBe(true)
    expect(inDateRange("01/07/2026", "01/06/2026", "30/06/2026")).toBe(false)
    expect(inDateRange("31/05/2026", "01/06/2026", "30/06/2026")).toBe(false)
  })
})

