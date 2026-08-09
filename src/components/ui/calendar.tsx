import { getDay, getDaysInMonth, isSameDay } from "date-fns"
import { Check, ChevronLeftIcon, ChevronRightIcon, ChevronsUpDown } from "lucide-react"
import {
  createContext,
  memo,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface CalendarState {
  month: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
  year: number
}

interface CalendarContextProps {
  locale: Intl.LocalesArgument
  startDay: number
  month: CalendarState["month"]
  setMonth: Dispatch<SetStateAction<CalendarState["month"]>>
  year: CalendarState["year"]
  setYear: Dispatch<SetStateAction<CalendarState["year"]>>
}

const CalendarContext = createContext<CalendarContextProps>({
  locale: "en-US",
  startDay: 0,
  month: new Date().getMonth() as CalendarState["month"],
  setMonth: () => undefined,
  year: new Date().getFullYear(),
  setYear: () => undefined,
})

export const useCalendarMonth = () => {
  const { month, setMonth } = useContext(CalendarContext)

  return [month, setMonth] as const
}

export const useCalendarYear = () => {
  const { year, setYear } = useContext(CalendarContext)

  return [year, setYear] as const
}

export interface Status {
  id: string
  name: string
  color: string
}

export interface Feature {
  id: string
  name: string
  startAt: Date
  endAt: Date
  status: Status
}

interface ComboboxProps {
  value: string
  setValue: (value: string) => void
  data: {
    value: string
    label: string
  }[]
  labels: {
    button: string
    empty: string
    search: string
  }
  className?: string
}

export const monthsForLocale = (
  localeName: Intl.LocalesArgument,
  monthFormat: Intl.DateTimeFormatOptions["month"] = "long",
) => {
  const format = new Intl.DateTimeFormat(localeName, { month: monthFormat }).format

  return [...new Array(12).keys()].map(m => format(new Date(Date.UTC(2021, m, 2))))
}

export const daysForLocale = (locale: Intl.LocalesArgument, startDay: number) => {
  const weekdays: string[] = []
  const baseDate = new Date(2024, 0, startDay)

  for (let i = 0; i < 7; i++) {
    weekdays.push(new Intl.DateTimeFormat(locale, { weekday: "short" }).format(baseDate))
    baseDate.setDate(baseDate.getDate() + 1)
  }

  return weekdays
}

const Combobox = ({ value, setValue, data, labels, className }: ComboboxProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-expanded={open}
            className={cn(
              "h-9 w-40 justify-between rounded-xl border-(--app-border-soft) capitalize",
              className,
            )}
            variant="outline"
          />
        }
      >
        {value ? data.find(item => item.value === value)?.label : labels.button}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-40 overflow-hidden border border-(--app-border) bg-(--app-surface) p-0 text-(--app-text) shadow-xl ring-1 ring-(--app-border) [&_[data-slot=command]]:bg-(--app-surface) [&_[data-slot=command]]:text-(--app-text) [&_[data-slot=command-empty]]:text-(--app-text-soft) [&_[data-slot=command-group]]:text-(--app-text) [&_[data-slot=command-input]]:text-(--app-text) [&_[data-slot=command-input]]:placeholder:text-(--app-text-soft) [&_[data-slot=input-group]]:border-(--app-border) [&_[data-slot=input-group]]:bg-(--app-surface-strong) [&_[data-slot=input-group-addon]]:text-(--app-text-soft)">
        <Command
          className="bg-(--app-surface) text-(--app-text)"
          filter={(itemValue: string, search: string) => {
            const label = data.find(item => item.value === itemValue)?.label

            return label?.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput className="text-(--app-text) placeholder:text-(--app-text-soft)" placeholder={labels.search} />
          <CommandList className="bg-(--app-surface)">
            <CommandEmpty className="text-(--app-text-soft)">{labels.empty}</CommandEmpty>
            <CommandGroup className="text-(--app-text)">
              {data.map(item => (
                <CommandItem
                  className="capitalize text-(--app-text) data-selected:bg-(--app-surface-strong) data-selected:text-(--app-text)"
                  key={item.value}
                  onSelect={(currentValue: string) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  value={item.value}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface OutOfBoundsDayProps {
  day: number
}

const OutOfBoundsDay = ({ day }: OutOfBoundsDayProps) => (
  <div className="relative h-full w-full bg-(--app-bg) p-2 text-xs text-(--app-text-soft)">
    {day}
  </div>
)

export interface CalendarBodyProps {
  features: Feature[]
  children: (props: { feature: Feature }) => ReactNode
}

export const CalendarBody = ({ features, children }: CalendarBodyProps) => {
  const [month] = useCalendarMonth()
  const [year] = useCalendarYear()
  const { startDay } = useContext(CalendarContext)

  // Memoize expensive date calculations
  const currentMonthDate = useMemo(() => new Date(year, month, 1), [year, month])
  const daysInMonth = useMemo(() => getDaysInMonth(currentMonthDate), [currentMonthDate])
  const firstDay = useMemo(
    () => (getDay(currentMonthDate) - startDay + 7) % 7,
    [currentMonthDate, startDay],
  )

  // Memoize previous month calculations
  const prevMonthData = useMemo(() => {
    const prevMonth = month === 0 ? 11 : month - 1
    const prevMonthYear = month === 0 ? year - 1 : year
    const prevMonthDays = getDaysInMonth(new Date(prevMonthYear, prevMonth, 1))
    const prevMonthDaysArray = Array.from({ length: prevMonthDays }, (_, i) => i + 1)
    return { prevMonthDays, prevMonthDaysArray }
  }, [month, year])

  // Memoize next month calculations
  const nextMonthData = useMemo(() => {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextMonthYear = month === 11 ? year + 1 : year
    const nextMonthDays = getDaysInMonth(new Date(nextMonthYear, nextMonth, 1))
    const nextMonthDaysArray = Array.from({ length: nextMonthDays }, (_, i) => i + 1)
    return { nextMonthDaysArray }
  }, [month, year])

  // Memoize features filtering by day to avoid recalculating on every render
  const featuresByDay = useMemo(() => {
    const result: { [day: number]: Feature[] } = {}
    for (let day = 1; day <= daysInMonth; day++) {
      result[day] = features.filter(feature => {
        return isSameDay(new Date(feature.endAt), new Date(year, month, day))
      })
    }
    return result
  }, [features, daysInMonth, year, month])

  const days: ReactNode[] = []

  for (let i = 0; i < firstDay; i++) {
    const day = prevMonthData.prevMonthDaysArray[prevMonthData.prevMonthDays - firstDay + i]

    if (day) {
      days.push(<OutOfBoundsDay day={day} key={`prev-${i}`} />)
    }
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const featuresForDay = featuresByDay[day] || []

    days.push(
      <div
        className="relative flex h-full w-full flex-col gap-2 p-2 text-xs text-(--app-text-muted)"
        key={day}
      >
        {day}
        <div className="space-y-1">{featuresForDay.slice(0, 3).map(feature => children({ feature }))}</div>
        {featuresForDay.length > 3 && (
          <span className="block text-xs text-(--app-text-soft)">
            +{featuresForDay.length - 3} more
          </span>
        )}
      </div>,
    )
  }

  const remainingDays = 7 - ((firstDay + daysInMonth) % 7)
  if (remainingDays < 7) {
    for (let i = 0; i < remainingDays; i++) {
      const day = nextMonthData.nextMonthDaysArray[i]

      if (day) {
        days.push(<OutOfBoundsDay day={day} key={`next-${i}`} />)
      }
    }
  }

  return (
    <div className="grid flex-1 grid-cols-7">
      {days.map((day, index) => (
        <div
          className={cn(
            "relative min-h-24 overflow-hidden border-t border-r border-(--app-border-soft)",
            index % 7 === 6 && "border-r-0",
          )}
          key={index}
        >
          {day}
        </div>
      ))}
    </div>
  )
}

export interface CalendarDatePickerProps {
  className?: string
  children: ReactNode
}

export const CalendarDatePicker = ({ className, children }: CalendarDatePickerProps) => (
  <div className={cn("flex items-center gap-1", className)}>{children}</div>
)

export interface CalendarMonthPickerProps {
  className?: string
}

export const CalendarMonthPicker = ({ className }: CalendarMonthPickerProps) => {
  const [month, setMonth] = useCalendarMonth()
  const { locale } = useContext(CalendarContext)

  // Memoize month data to avoid recalculating date formatting
  const monthData = useMemo(() => {
    return monthsForLocale(locale).map((month, index) => ({
      value: index.toString(),
      label: month,
    }))
  }, [locale])

  return (
    <Combobox
      className={className}
      data={monthData}
      labels={{
        button: "Выберите месяц",
        empty: "Месяц не найден",
        search: "Поиск месяца",
      }}
      setValue={value => setMonth(Number.parseInt(value, 10) as CalendarState["month"])}
      value={month.toString()}
    />
  )
}

export interface CalendarYearPickerProps {
  className?: string
  start: number
  end: number
}

export const CalendarYearPicker = ({ className, start, end }: CalendarYearPickerProps) => {
  const [year, setYear] = useCalendarYear()

  return (
    <Combobox
      className={className}
      data={Array.from({ length: end - start + 1 }, (_, i) => ({
        value: (start + i).toString(),
        label: (start + i).toString(),
      }))}
      labels={{
        button: "Выберите год",
        empty: "Год не найден",
        search: "Поиск года",
      }}
      setValue={value => setYear(Number.parseInt(value, 10))}
      value={year.toString()}
    />
  )
}

export interface CalendarDatePaginationProps {
  className?: string
}

export const CalendarDatePagination = ({ className }: CalendarDatePaginationProps) => {
  const [month, setMonth] = useCalendarMonth()
  const [year, setYear] = useCalendarYear()

  const handlePreviousMonth = useCallback(() => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth((month - 1) as CalendarState["month"])
    }
  }, [month, year, setMonth, setYear])

  const handleNextMonth = useCallback(() => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth((month + 1) as CalendarState["month"])
    }
  }, [month, year, setMonth, setYear])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button onClick={handlePreviousMonth} size="icon" variant="ghost">
        <ChevronLeftIcon size={16} />
      </Button>
      <Button onClick={handleNextMonth} size="icon" variant="ghost">
        <ChevronRightIcon size={16} />
      </Button>
    </div>
  )
}

export interface CalendarDateProps {
  children: ReactNode
}

export const CalendarDate = ({ children }: CalendarDateProps) => (
  <div className="flex items-center justify-between border-b border-(--app-border-soft) p-3">
    {children}
  </div>
)

export interface CalendarHeaderProps {
  className?: string
}

export const CalendarHeader = ({ className }: CalendarHeaderProps) => {
  const { locale, startDay } = useContext(CalendarContext)

  // Memoize days data to avoid recalculating date formatting
  const daysData = useMemo(() => {
    return daysForLocale(locale, startDay)
  }, [locale, startDay])

  return (
    <div className={cn("grid h-10 shrink-0 grid-cols-7 bg-(--app-surface-strong)", className)}>
      {daysData.map(day => (
        <div
          className="flex items-center justify-end px-3 text-[11px] font-medium text-(--app-text-soft)"
          key={day}
        >
          {day}
        </div>
      ))}
    </div>
  )
}

export interface CalendarItemProps {
  feature: Feature
  className?: string
}

export const CalendarItem = memo(({ feature, className }: CalendarItemProps) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div
      className="h-2 w-2 shrink-0 rounded-full"
      style={{
        backgroundColor: feature.status.color,
      }}
    />
    <span className="truncate">{feature.name}</span>
  </div>
))

CalendarItem.displayName = "CalendarItem"

export interface CalendarProviderProps {
  locale?: Intl.LocalesArgument
  startDay?: number
  children: ReactNode
  className?: string
}

export const CalendarProvider = ({
  locale = "en-US",
  startDay = 0,
  children,
  className,
}: CalendarProviderProps) => {
  const [month, setMonth] = useState<CalendarState["month"]>(
    new Date().getMonth() as CalendarState["month"],
  )
  const [year, setYear] = useState<CalendarState["year"]>(new Date().getFullYear())

  const value = useMemo(
    () => ({ locale, startDay, month, setMonth, year, setYear }),
    [locale, startDay, month, year],
  )

  return (
    <CalendarContext.Provider value={value}>
      <div className={cn("relative flex flex-col", className)}>{children}</div>
    </CalendarContext.Provider>
  )
}

// Demo
const demoStatuses: Status[] = [
  { id: "1", name: "Planned", color: "#6B7280" },
  { id: "2", name: "In Progress", color: "#F59E0B" },
  { id: "3", name: "Done", color: "#10B981" },
]

function createDemoFeatures(): Feature[] {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  return [
    {
      id: "1",
      name: "Design Review",
      startAt: new Date(year, month, 1),
      endAt: new Date(year, month, 5),
      status: demoStatuses[2],
    },
    {
      id: "2",
      name: "Sprint Planning",
      startAt: new Date(year, month, 5),
      endAt: new Date(year, month, 8),
      status: demoStatuses[2],
    },
    {
      id: "3",
      name: "API Development",
      startAt: new Date(year, month, 8),
      endAt: new Date(year, month, 15),
      status: demoStatuses[1],
    },
    {
      id: "4",
      name: "Frontend Build",
      startAt: new Date(year, month, 10),
      endAt: new Date(year, month, 18),
      status: demoStatuses[1],
    },
    {
      id: "5",
      name: "Testing Phase",
      startAt: new Date(year, month, 15),
      endAt: new Date(year, month, 22),
      status: demoStatuses[0],
    },
    {
      id: "6",
      name: "Documentation",
      startAt: new Date(year, month, 18),
      endAt: new Date(year, month, 22),
      status: demoStatuses[0],
    },
    {
      id: "7",
      name: "Code Review",
      startAt: new Date(year, month, 20),
      endAt: new Date(year, month, 25),
      status: demoStatuses[0],
    },
    {
      id: "8",
      name: "Release Prep",
      startAt: new Date(year, month, 25),
      endAt: new Date(year, month, 28),
      status: demoStatuses[0],
    },
  ]
}

export function Demo() {
  const [mounted, setMounted] = useState(false)
  const [features, setFeatures] = useState<Feature[]>([])

  // Only render on client to avoid hydration issues
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount once
  useEffect(() => {
    setMounted(true)
    setFeatures(createDemoFeatures())
  }, [])

  if (!mounted) {
    return <div className="h-screen w-screen bg-muted/50 animate-pulse" />
  }

  return (
    <div className="h-screen w-screen p-4">
      <CalendarProvider className="h-full w-full border rounded-lg">
        <CalendarDate>
          <CalendarDatePicker>
            <CalendarMonthPicker />
            <CalendarYearPicker start={2020} end={2030} />
          </CalendarDatePicker>
          <CalendarDatePagination />
        </CalendarDate>
        <CalendarHeader />
        <CalendarBody features={features}>
          {({ feature }) => <CalendarItem feature={feature} key={feature.id} />}
        </CalendarBody>
      </CalendarProvider>
    </div>
  )
}
