import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import {
  CalendarBody,
  CalendarDate,
  CalendarDatePagination,
  CalendarDatePicker,
  CalendarHeader,
  CalendarItem,
  CalendarMonthPicker,
  CalendarProvider,
  CalendarYearPicker,
  type Feature,
  type Status,
} from '../components/ui/calendar'
import { db, type Subscription } from '../lib/db'

dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)

const statuses: Record<string, Status> = {
  overdue: { id: 'overdue', name: 'Просрочено', color: '#ef4444' },
  today: { id: 'today', name: 'Сегодня', color: '#ef4444' },
  tomorrow: { id: 'tomorrow', name: 'Завтра', color: '#f59e0b' },
  planned: { id: 'planned', name: 'План', color: '#8b5cf6' },
}

function parseSubscriptionDate(date: string) {
  const parsedDate = dayjs(date, 'DD.MM.YYYY', true)

  return parsedDate.isValid() ? parsedDate : dayjs(date)
}

function getSubscriptionStatus(date: dayjs.Dayjs) {
  const today = dayjs()

  if (date.isBefore(today, 'day')) return statuses.overdue
  if (date.isSame(today, 'day')) return statuses.today
  if (date.isSame(today.add(1, 'day'), 'day')) return statuses.tomorrow

  return statuses.planned
}

function CalendarPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])

  useEffect(() => {
    async function loadSubscriptions() {
      const savedSubscriptions = await db.subscriptions.toArray()

      setSubscriptions(savedSubscriptions)
    }

    loadSubscriptions()
  }, [])

  const payments = useMemo<Feature[]>(() => {
    return subscriptions.flatMap((subscription) => {
      const endDate = parseSubscriptionDate(subscription.dateEnd)

      if (!endDate.isValid()) return []

      const paymentDate = endDate.toDate()

      return {
        id: String(subscription.id ?? `${subscription.name}-${subscription.dateEnd}`),
        name: subscription.name,
        startAt: paymentDate,
        endAt: paymentDate,
        status: getSubscriptionStatus(endDate),
      }
    })
  }, [subscriptions])

  return (
    <section className="select-none">
      <div
        className="w-full h-30 bg-no-repeat flex justify-start items-center rounded-2xl bg-cover bg-top mb-6"
        style={{ backgroundImage: "url('./calendar.jpg')" }}
      >
        <h1 className="text-[1.6rem] font-bold text-[#f3f3f3] pl-10 drop-shadow-[0_1.2px_1.1px_rgba(0,0,0,0.8)] select-none">
          Календарь
        </h1>
      </div>
      <CalendarProvider
        className="h-[calc(100vh-7rem)] min-h-[444px] overflow-hidden rounded-2xl"
        locale="ru-RU"
        startDay={1}
      >
        <CalendarDate>
          <CalendarDatePicker>
            <CalendarMonthPicker className="w-44 bg-(--app-surface-strong) text-(--app-text)" />
            <CalendarYearPicker
              className="w-28 bg-(--app-surface-strong) text-(--app-text)"
              start={2024}
              end={2032}
            />
          </CalendarDatePicker>
          <CalendarDatePagination />
        </CalendarDate>

        <CalendarHeader />
        <CalendarBody features={payments}>
          {({ feature }) => (
            <CalendarItem
              className="rounded-md bg-(--app-surface-strong) px-2 py-1 text-[11px] font-medium text-(--app-text)"
              feature={feature}
              key={feature.id}
            />
          )}
        </CalendarBody>
      </CalendarProvider>
    </section>
  )
}

export default CalendarPage
