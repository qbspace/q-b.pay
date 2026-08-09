import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useLayoutEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Calendar, CreditCard, LayoutDashboard, Maximize2, Minus, RefreshCw, Settings, X } from 'lucide-react'
import { db } from '../lib/db'
import { applyAppTheme, defaultTheme, isAppTheme } from '../lib/theme'

type AvailableUpdate = {
  status: 'available'
  currentVersion: string
  latestVersion: string
  releaseName: string
  releaseUrl?: string
  downloadUrl?: string
  canAutoInstall: boolean
  phase: 'available' | 'downloading' | 'installing' | 'error'
  percent?: number
  message?: string
}

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [availableUpdate, setAvailableUpdate] = useState<AvailableUpdate | null>(null)
  const location = useLocation()
  const contentRef = useRef<HTMLElement>(null)
  const isElectron = Boolean(window.electronAPI)
  const navItems = [
    { to: '/', label: 'Главная', short: <LayoutDashboard /> },
    { to: '/payment', label: 'Подписки', short: <CreditCard /> },
    { to: '/calendar', label: 'Календарь', short: <Calendar /> },
    { to: '/settings', label: 'Настройки', short: <Settings /> },
  ]

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'group relative flex min-h-10 rounded-md text-sm font-medium transition',
      isSidebarOpen
        ? 'items-center justify-between px-3 py-2.5'
        : 'mx-auto h-11 w-11 items-center justify-center p-0',
      isActive
        ? 'active bg-(--app-accent) text-(--app-accent-text)'
        : 'text-(--app-text-muted) hover:bg-(--app-hover) hover:text-(--app-text)',
    ].join(' ')

  useEffect(() => {
    async function loadTheme() {
      const setting = await db.settings.get('theme')
      applyAppTheme(setting && isAppTheme(setting.value) ? setting.value : defaultTheme)
    }

    loadTheme()
  }, [])

  useEffect(() => {
    let isMounted = true

    async function checkUpdates() {
      const result = await window.electronAPI?.checkForUpdates()

      if (isMounted && result?.status === 'available') {
        setAvailableUpdate({ ...result, phase: 'available' })
      }
    }

    const timeoutId = window.setTimeout(() => {
      checkUpdates()
    }, 1200)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onUpdateStatus((status) => {
      if (status.status === 'available') {
        setAvailableUpdate({ ...status, phase: 'available' })
        return
      }

      if (status.status === 'downloading') {
        setAvailableUpdate((current) => current ? {
          ...current,
          phase: 'downloading',
          percent: status.percent,
        } : current)
        return
      }

      if (status.status === 'installing') {
        setAvailableUpdate((current) => current ? {
          ...current,
          phase: 'installing',
          latestVersion: status.latestVersion || current.latestVersion,
        } : current)
        return
      }

      if (status.status === 'error') {
        setAvailableUpdate((current) => current ? {
          ...current,
          phase: 'error',
          message: status.message,
        } : current)
      }
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 })
  }, [location.pathname])

  return (
    <div className="h-screen overflow-hidden bg-(--app-bg) text-(--app-text) md:flex select-none">
      <aside
        className={[
          'border-b border-(--app-border) transition-[width] duration-300 md:fixed md:inset-y-0 md:left-0 md:border-b-0 md:border-r',
          isSidebarOpen ? 'md:w-64' : 'md:w-20',
        ].join(' ')}
      >
        <div
          className={[
            'flex h-full flex-col py-5 transition-[padding] duration-300',
            isSidebarOpen ? 'px-6' : 'px-3',
          ].join(' ')}
        >
          <div
            className={[
              'flex items-center border-b border-(--app-border) pb-2',
              isSidebarOpen ? 'justify-between' : 'justify-center',
            ].join(' ')}
          >
            {isSidebarOpen && (
              <img src="./icon.svg" alt="Logo" className="h-7 w-auto" />
            )}
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-(--app-text-muted) transition hover:bg-(--app-hover) hover:text-(--app-text)"
              aria-label={isSidebarOpen ? 'Свернуть сайдбар' : 'Развернуть сайдбар'}
              title={isSidebarOpen ? 'Свернуть сайдбар' : 'Развернуть сайдбар'}
              onClick={() => setIsSidebarOpen((current) => !current)}
            >
              {isSidebarOpen ? <EyeClosedIcon /> : <EyeIcon />}
            </button>
          </div>

          <nav
            className={[
              'mt-6 flex gap-3 md:flex-col',
              isSidebarOpen ? '' : 'md:items-center',
            ].join(' ')}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                className={navLinkClass}
                to={item.to}
                end={item.to === '/'}
                title={item.label}
              >
                <span className={isSidebarOpen ? 'truncate' : 'sr-only'}>
                  {item.label}
                </span>
                <span
                  aria-hidden="true"
                  className={isSidebarOpen ? 'hidden' : 'text-sm font-semibold fill-amber-50'}
                >
                  {item.short}
                </span>
                <div
                  className={[
                    'h-1.5 w-1.5 rounded-full bg-amber-50',
                    isSidebarOpen
                      ? 'ml-2 hidden group-[.active]:block'
                      : 'hidden',
                  ].join(' ')}
                />
              </NavLink>
            ))}
          </nav>
          <div
            className={[
              'mt-auto text-xs text-(--app-text-muted)',
              isSidebarOpen ? 'block' : 'hidden',
            ].join(' ')}
          >
            <p>Made with ❤️</p>
            <div className="flex gap-2">
              <button className="text-xs text-(--app-text-muted) hover:text-(--app-text) cursor-pointer" onClick={() => {
                window.open("https://github.com/quenixxx", "_blank");
              }}>quenixxx</button>
              <button className="text-xs text-(--app-text-muted) hover:text-(--app-text) cursor-pointer" onClick={() => {
                window.open("https://github.com/Verninonaw", "_blank");
              }}>verbrannt</button>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={[
          'min-w-0 flex-1 overflow-hidden transition-[padding] duration-300 md:flex md:h-screen md:flex-col',
          isSidebarOpen ? 'md:pl-64' : 'md:pl-20',
        ].join(' ')}
      >
        {isElectron && <WindowTitleBar />}
        <UpdateBanner
          update={availableUpdate}
          isElectron={isElectron}
          isSidebarOpen={isSidebarOpen}
          onClose={() => setAvailableUpdate(null)}
        />

        <main
          ref={contentRef}
          className={[
            'w-full flex-1 overflow-y-auto px-6',
            isElectron ? 'pb-10 pt-5' : 'py-10',
          ].join(' ')}
        >
          <div className="mx-auto w-full max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

function UpdateBanner({
  update,
  isElectron,
  isSidebarOpen,
  onClose,
}: {
  update: AvailableUpdate | null
  isElectron: boolean
  isSidebarOpen: boolean
  onClose: () => void
}) {
  if (!update) {
    return null
  }

  const updateInfo = update
  const isBusy = updateInfo.phase === 'downloading' || updateInfo.phase === 'installing'
  const updateButtonText =
    updateInfo.phase === 'downloading'
      ? `Скачивается ${updateInfo.percent ?? 0}%`
      : updateInfo.phase === 'installing'
        ? 'Установка...'
        : updateInfo.canAutoInstall
          ? 'Обновиться'
          : 'Открыть'

  async function openUpdate() {
    if (!updateInfo.canAutoInstall) {
      const url = updateInfo.downloadUrl || updateInfo.releaseUrl

      if (url) {
        await window.electronAPI?.openUpdate(url)
      }

      return
    }

    const result = await window.electronAPI?.downloadAndInstallUpdate()

    if (result?.status === 'error') {
      setTimeout(() => {
        window.electronAPI?.openUpdate(updateInfo.releaseUrl || updateInfo.downloadUrl || '')
      }, 0)
    }
  }

  return (
    <div
      className={[
        'window-no-drag fixed left-1/2 z-80 w-[min(92vw,560px)] -translate-x-1/2 rounded-b-2xl border border-t-0 border-(--app-border) bg-(--app-surface) px-4 py-2.5 text-(--app-text) shadow-lg transition-all duration-300',
        isElectron ? 'top-9' : 'top-0',
        isSidebarOpen ? 'md:left-[calc(50%+8rem)]' : 'md:left-[calc(50%+2.5rem)]',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--app-accent)/15 text-(--app-accent)">
          <RefreshCw className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">Доступно новое обновление</p>
          <p className="truncate text-xs text-(--app-text-muted)">
            {updateInfo.phase === 'error'
              ? updateInfo.message || 'Не удалось скачать обновление'
              : `Текущая ${updateInfo.currentVersion} • новая ${updateInfo.latestVersion}`}
          </p>
        </div>

        <button
          type="button"
          className="window-no-drag shrink-0 rounded-lg bg-(--app-accent) px-3 py-1.5 text-xs font-semibold text-(--app-accent-text) transition hover:bg-(--app-accent-hover) active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          disabled={isBusy}
          onClick={openUpdate}
        >
          {updateButtonText}
        </button>

        <button
          type="button"
          className="window-no-drag flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-(--app-text-muted) transition hover:bg-(--app-hover) hover:text-(--app-text) cursor-pointer"
          aria-label="Скрыть уведомление об обновлении"
          title="Скрыть"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

function WindowTitleBar() {
  return (
    <div className="window-drag z-50 flex h-9 shrink-0 items-center justify-end backdrop-blur-md">
        <button
          type="button"
          className="window-no-drag flex h-full w-11 cursor-pointer items-center justify-center text-(--app-text-muted) transition hover:bg-(--app-hover) hover:text-(--app-text)"
          aria-label="Свернуть окно"
          title="Свернуть"
          onClick={() => window.electronAPI?.minimizeWindow()}
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          className="window-no-drag flex h-full w-11 cursor-pointer items-center justify-center text-(--app-text-muted) transition hover:bg-(--app-hover) hover:text-(--app-text)"
          aria-label="Развернуть окно"
          title="Развернуть"
          onClick={() => window.electronAPI?.toggleMaximizeWindow()}
        >
          <Maximize2 className="size-3" />
        </button>
        <button
          type="button"
          className="window-no-drag flex h-full w-11 cursor-pointer items-center justify-center text-(--app-text-muted) transition hover:bg-red-500 hover:text-white"
          aria-label="Закрыть окно"
          title="Закрыть"
          onClick={() => window.electronAPI?.closeWindow()}
        >
          <X className="size-3.5" />
        </button>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeClosedIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" />
      <path d="M6.1 6.8C3.7 8.5 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.7 0 3.2-.5 4.5-1.2" />
      <path d="M9.5 5.9c.8-.3 1.6-.4 2.5-.4 6 0 9.5 6.5 9.5 6.5s-.7 1.3-2 2.7" />
    </svg>
  )
}

export default AppLayout
