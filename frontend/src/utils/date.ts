/** Parse API ISO dates and legacy Vietnamese DD/MM/YYYY dates safely. */
export function parseCalendarDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const s = String(value).trim()
  const vi = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?$/)
  if (vi) {
    const [,dd,mm,yyyy,hh="0",mi="0"] = vi
    const y=Number(yyyy), m=Number(mm)-1, d=Number(dd)
    const result = new Date(y,m,d,Number(hh),Number(mi))
    return result.getFullYear() === y && result.getMonth() === m && result.getDate() === d ? result : null
  }
  const iso = new Date(s)
  return Number.isNaN(iso.getTime()) ? null : iso
}
export function formatCalendarDate(value: string | Date | null | undefined): string {
  const date = parseCalendarDate(value)
  return date ? date.toLocaleDateString("vi-VN", {day: "2-digit", month: "2-digit", year: "numeric"}) : "—"
}
export function inDateRange(value: string, start: string, end: string): boolean {
  const date = parseCalendarDate(value)
  const left = parseCalendarDate(start)
  const right = parseCalendarDate(end)
  if (!date || !left || !right) return false
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  return day >= left.getTime() && day <= right.getTime()
}
