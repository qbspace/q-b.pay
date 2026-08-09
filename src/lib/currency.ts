export const currencies = ['RUB', 'USD', 'EUR'] as const

export type Currency = (typeof currencies)[number]

export const currencySymbols: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
}

export function isCurrency(value: string): value is Currency {
  return currencies.includes(value as Currency)
}
