export const appThemes = ['dark', 'violet', 'light', 'totaldark'] as const

export type AppTheme = (typeof appThemes)[number]

export const defaultTheme: AppTheme = 'dark'

export const themeLabels: Record<AppTheme, string> = {
  dark: 'Тёмная',
  violet: 'Фиолетовая',
  light: 'Светлая',
  totaldark: 'Чёрная',
}

export function isAppTheme(value: string): value is AppTheme {
  return appThemes.includes(value as AppTheme)
}

export function applyAppTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme
}
