import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export type PeriodUnit = 'days' | 'months' | 'years'

const dayjsPeriodUnits: Record<PeriodUnit, 'day' | 'month' | 'year'> = {
  days: 'day',
  months: 'month',
  years: 'year',
}

export function parsePeriod(period: string): { count: string; unit: PeriodUnit } {
  const normalizedPeriod = String(period || '').trim()
  const match = normalizedPeriod.match(/^(\d+)\s+(days|months|years)$/)

  if (match) {
    return {
      count: match[1],
      unit: match[2] as PeriodUnit,
    }
  }

  return {
    count: normalizedPeriod || '1',
    unit: 'months',
  }
}

export function formatPeriod(count: string, unit: PeriodUnit) {
  return `${Math.max(1, Number(count) || 1)} ${unit}`
}

export function getNextPayDate(startDate: string, count: string, unit: PeriodUnit) {
  const periodCount = Number(count)

  if (!startDate || !Number.isFinite(periodCount) || periodCount <= 0) {
    return ''
  }

  return dayjs(startDate).add(periodCount, dayjsPeriodUnits[unit]).format('DD.MM.YYYY')
}

export function getRenewedPayDate(dateEnd: string, period: string) {
  const { count, unit } = parsePeriod(period)
  const periodCount = Number(count)

  if (!dateEnd || !Number.isFinite(periodCount) || periodCount <= 0) {
    return ''
  }

  const currentEndDate = dayjs(dateEnd, 'DD.MM.YYYY')

  if (!currentEndDate.isValid()) {
    return ''
  }

  return currentEndDate.add(periodCount, dayjsPeriodUnits[unit]).format('DD.MM.YYYY')
}
