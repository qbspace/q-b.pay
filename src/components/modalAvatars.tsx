import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export type SelectedIcon = {
    id: string
    name: string
    url: string
}

type ModalAvatarsProps = {
    isOpen: boolean
    onClose: () => void
    onSelectIcon?: (icon: SelectedIcon) => void
}

type IconifySearchResponse = {
    icons?: string[]
}

const ICONIFY_API = 'https://api.iconify.design'
const ICON_SETS = 'logos,simple-icons'


const queryAliases: Record<string, string> = {
    спотифай: 'spotify',
    споти: 'spotify',
    нетфликс: 'netflix',
    ютуб: 'youtube',
    телеграм: 'telegram',
    тг: 'telegram',
    дискорд: 'discord',
    дс: 'discord',
    чатгпт: 'openai',
    гпт: 'openai',
    опенай: 'openai',
    гитхаб: 'github',
}

const presetIcons: SelectedIcon[] = [
    createIcon('logos:netflix-icon', 'Netflix'),
    createIcon('logos:spotify-icon', 'Spotify'),
    createIcon('simple-icons:openai', 'ChatGPT'),
    createIcon('logos:youtube-icon', 'YouTube'),
    createIcon('logos:telegram', 'Telegram'),
    createIcon('logos:discord-icon', 'Discord'),
    createIcon('logos:github-icon', 'GitHub'),
    createIcon('logos:steam', 'Steam'),
    createIcon('logos:apple', 'Apple'),
    createIcon('logos:google-icon', 'Google'),
    createIcon('logos:figma', 'Figma'),
    createIcon('logos:notion-icon', 'Notion'),
]

function normalizeQuery(value: string) {
    const query = value.trim().toLowerCase()

    return queryAliases[query] ?? query
}

function formatIconName(iconId: string) {
    const name = iconId.split(':')[1] ?? iconId

    return name
        .replace(/-icon$/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
}

function createIcon(iconId: string, name = formatIconName(iconId)): SelectedIcon {
    return {
        id: iconId,
        name,
        url: getIconUrl(iconId),
    }
}

function getIconUrl(iconId: string) {
    const [prefix, name] = iconId.split(':')
    const params = prefix === 'logos' ? '' : '?color=%23ffffff'

    return `${ICONIFY_API}/${prefix}/${name}.svg${params}`
}

export default function ModalAvatars({ isOpen, onClose, onSelectIcon }: ModalAvatarsProps) {
    const [searchText, setSearchText] = useState('')
    const [icons, setIcons] = useState<SelectedIcon[]>([])
    const [selectedIcon, setSelectedIcon] = useState<SelectedIcon | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const normalizedQuery = useMemo(() => normalizeQuery(searchText), [searchText])
    const visibleIcons = searchText.trim() ? icons : presetIcons


    // useEffect(() => {
    //     function HandleEscapeKey(event: KeyboardEvent) {
    //         if (event.key === 'Escape') {
    //             onClose()
    //         }
    //     }
    //     document.addEventListener('keydown', HandleEscapeKey);
    // }, [isOpen, onClose])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        if (normalizedQuery.length < 2) {
            setIcons([])
            setError('')
            setIsLoading(false)
            return
        }

        const controller = new AbortController()
        const timeoutId = window.setTimeout(async () => {
            setIsLoading(true)
            setError('')

            try {
                const params = new URLSearchParams({
                    query: normalizedQuery,
                    prefixes: ICON_SETS,
                    limit: '48',
                })
                const response = await fetch(`${ICONIFY_API}/search?${params}`, {
                    signal: controller.signal,
                })

                if (!response.ok) {
                    throw new Error('Failed to load icons')
                }

                const data = (await response.json()) as IconifySearchResponse
                setIcons((data.icons ?? []).map(iconId => createIcon(iconId)))
            } catch (requestError) {
                if (requestError instanceof DOMException && requestError.name === 'AbortError') {
                    return
                }

                setIcons([])
                setError('Не удалось найти иконки. Проверь интернет и попробуй ещё раз.')
            } finally {
                setIsLoading(false)
            }
        }, 350)

        return () => {
            controller.abort()
            window.clearTimeout(timeoutId)
        }
    }, [isOpen, normalizedQuery])

    if (!isOpen) return null

    const handleAddIcon = () => {
        if (!selectedIcon) {
            return
        }

        onSelectIcon?.(selectedIcon)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center backdrop-blur-xs">
            <button
                aria-label="Закрыть выбор иконки"
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
                type="button"
            />

            <div className="z-10 flex h-[560px] w-[1040px] flex-col rounded-2xl border border-(--app-border) bg-(--app-surface) p-6">
                <div className="flex items-center justify-between">
                    <p className="text-xl font-medium">Выбор иконки</p>
                    <div className="flex items-center justify-center gap-4">
                        <button
                            className="rounded-lg bg-(--app-accent) px-4 py-2 text-sm font-medium transition hover:bg-(--app-accent-hover) disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                            disabled={!selectedIcon}
                            onClick={handleAddIcon}
                            type="button"
                        >
                            Добавить
                        </button>
                        <X
                            className="cursor-pointer text-(--app-text-muted) hover:text-(--app-text)"
                            onClick={onClose}
                        />
                    </div>
                </div>

                <div className="mt-4 flex w-full flex-row items-center rounded-xl border border-(--app-border) bg-(--app-surface-soft) px-4 py-2 text-(--app-text) transition focus-within:border-(--app-accent)">
                    <Search className="size-4 text-(--app-text-soft)" />
                    <input
                        className="h-full w-full bg-transparent pl-2 text-sm outline-none placeholder:text-(--app-text-soft)"
                        onChange={event => setSearchText(event.target.value)}
                        placeholder="Spotify, Netflix, Спотифай..."
                        type="text"
                        value={searchText}
                    />
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <p className="text-lg font-medium">
                        {searchText.trim() ? 'Найденные иконки' : 'Предустановленные'}
                    </p>
                    {selectedIcon && (
                        <p className="text-xs text-(--app-text-soft)">
                            Выбрано: <span className="text-(--app-text-muted)">{selectedIcon.name}</span>
                        </p>
                    )}
                </div>

                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                    {isLoading && (
                        <div className="grid grid-cols-6 gap-4">
                            {Array.from({ length: 12 }, (_, index) => (
                                <div
                                    className="h-32 animate-pulse rounded-xl border border-(--app-border-soft) bg-(--app-surface-strong)"
                                    key={index}
                                />
                            ))}
                        </div>
                    )}

                    {!isLoading && error && (
                        <div className="flex h-full items-center justify-center rounded-xl border border-(--app-border-soft) text-sm text-(--app-text-soft)">
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && visibleIcons.length === 0 && (
                        <div className="flex h-full items-center justify-center rounded-xl border border-(--app-border-soft) text-sm text-(--app-text-soft)">
                            Ничего не найдено
                        </div>
                    )}

                    {!isLoading && !error && visibleIcons.length > 0 && (
                        <div className="grid grid-cols-6 gap-4">
                            {visibleIcons.map(icon => (
                                <button
                                    className={[
                                        'flex h-32 flex-col items-center justify-center rounded-xl border bg-(--app-surface-strong) p-3 transition hover:border-(--app-accent) hover:bg-(--app-hover) cursor-pointer',
                                        selectedIcon?.id === icon.id
                                            ? 'border-(--app-accent) ring-2 ring-(--app-accent)/30'
                                            : 'border-(--app-border-soft)',
                                    ].join(' ')}
                                    key={icon.id}
                                    onClick={() => setSelectedIcon(icon)}
                                    title={icon.id}
                                    type="button"
                                >
                                    <img alt={icon.name} className="h-14 w-14 object-contain" src={icon.url} />
                                    <span className="mt-3 max-w-full truncate text-xs font-medium">
                                        {icon.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


// Код официально подписан Глентом
