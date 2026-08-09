import { X, CalendarDays, Upload, MoveLeft, Link } from 'lucide-react'
import ModalAvatars, { type SelectedIcon } from './modalAvatars'
import { useState, useEffect } from "react"
import { db } from "../lib/db";
import { formatPeriod, getNextPayDate, type PeriodUnit } from './periodMath';
import CustomSelect from './customSelect';
import NumberStepper from './numberStepper';

const categoryOptions = [
    { value: 'Подписка', label: 'Подписка' },
    { value: 'Музыка', label: 'Музыка' },
    { value: 'Нейросети', label: 'Нейросети' },
    { value: 'Сервера', label: 'Сервера' },
    { value: 'OTHER', label: 'Другое..' },
]

const currencyOptions = [
    { value: '₽', label: '₽ - Российский рубль' },
    { value: '$', label: '$ - Доллар' },
    { value: '€', label: '€ - Евро' },
]

const periodUnitOptions = [
    { value: 'days', label: 'дней' },
    { value: 'months', label: 'месяцев' },
    { value: 'years', label: 'лет' },
]

type ModalAddSubProps = {
    isOpen: boolean
    onClose: () => void
}

export default function ModalAddSub({ isOpen, onClose }: ModalAddSubProps) {
    const [modalAvatar, setModalAvatar] = useState(false)
    const [selectedIcon, setSelectedIcon] = useState<SelectedIcon | null>(null)

    const [startDate, setStartDate] = useState('')
    const [periodCount, setPeriodCount] = useState("1")
    const [periodUnit, setPeriodUnit] = useState<PeriodUnit>("months")
    const [nextPay, setNextPay] = useState("")
    const [category, setCategory] = useState('Подписка')
    const [name, setName] = useState('')
    const [price, setPrice] = useState<number | ''>('')
    const [urlSub, setUrlSub] = useState('')

    const [isCustomCategory, setIsCustomCategory] = useState(false)
    const [selectedValute, setSelectedValute] = useState('₽')
    const [showValidationNotice, setShowValidationNotice] = useState(false)

    useEffect(() => {
        function HandleEscapeKey(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose()
            }
        }
        document.addEventListener('keydown', HandleEscapeKey);
    }, [isOpen, onClose])

    useEffect(() => {
        setNextPay(getNextPayDate(startDate, periodCount, periodUnit));
    }, [startDate, periodCount, periodUnit]);

    useEffect(() => {
        if (!showValidationNotice) return;

        const timeoutId = window.setTimeout(() => {
            setShowValidationNotice(false);
        }, 2500);

        return () => window.clearTimeout(timeoutId);
    }, [showValidationNotice]);

    if (!isOpen) {
        return null
    }

    async function saveSub() {
        if (!name.trim() || !price || !nextPay || !startDate || !category.trim() || Number(periodCount) <= 0) {
            setShowValidationNotice(true);
            return false;
        }

        await db.subscriptions.put({
            name: name,
            logoUrl: selectedIcon ? selectedIcon.url : '',
            price: Number(price),
            currency: selectedValute,
            period: formatPeriod(periodCount, periodUnit),
            category: category,
            dateStart: startDate,
            dateEnd: nextPay,
            urlSub: urlSub
        })

        setName('')
        setSelectedIcon(null)
        setPeriodCount("1")
        setPeriodUnit("months")
        setNextPay('')
        setCategory("Музыка")
        setPrice('')
        setStartDate('')
        return true;
    }


    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center backdrop-blur-xs">
            <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
            <div className="z-10 w-260 bg-(--app-surface) border border-(--app-border) rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-bold text-(--app-text)">Добавить подписку</h1>
                    <X className="cursor-pointer text-(--app-text-muted) hover:text-(--app-text)" onClick={onClose} />
                </div>
                <div className='grid grid-cols-2 mt-5'>
                    <div className='flex flex-col gap-3'>
                        <div className='flex flex-row gap-3'>
                            <div className='flex flex-col items-center'>
                                <button
                                    className={`${selectedIcon ? "h-25 cursor-pointer" : "m-4 flex h-22 w-22 cursor-pointer items-center justify-center rounded-full bg-(--app-accent)/70 outline-2 outline-offset-5 outline-dashed outline-(--app-accent)"}`}
                                    onClick={() => setModalAvatar(true)}
                                    type="button"
                                >
                                    {selectedIcon ? (
                                        <img
                                            alt={selectedIcon.name}
                                            className="h-13 w-13 object-contain"
                                            src={selectedIcon.url}
                                        />
                                    ) : (
                                        <Upload />
                                    )}
                                </button>
                                <p className='font-medium'>Логотип</p>
                                <p className='text-center text-sm text-gray-400/50'>Нажмите, чтобы <br></br>загрузить</p>
                            </div>
                            <div className='flex-1'>
                                <p className='font-medium mb-2'>Название</p>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder='Введите название сервиса' className='focus:outline-0 w-full border border-(--app-border) rounded-lg p-2 px-3' />
                                <p className='font-medium pt-5'>Цена</p>
                                <input type="text" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder={`${selectedValute === 'RUB' ? '0,00 ₽' : selectedValute === 'USD' ? '$ 0,00' : selectedValute === 'EUR' ? '€ 0,00' : '0,00'}`} className='focus:outline-0 w-full border border-(--app-border) rounded-lg p-2 px-3 mt-3' />
                                <p className='font-medium mb-2 pt-5'>Дата оплаты</p>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className='focus:outline-0 w-full border border-(--app-border) rounded-lg p-2 px-3' />
                            </div>
                        </div>
                    </div>
                    <div className='ml-12'>
                        <p className='font-medium mb-2'>Категория</p>
                        <div className="mt-2">
                            {isCustomCategory ?
                                <div className='flex items-center justify-between w-full border border-(--app-border) rounded-lg p-2 px-3'>
                                    <input value={category} onChange={(e) => setCategory(e.target.value)} className='w-full focus:outline-0' placeholder='Укажите категорию'></input>
                                    <div className='rounded-full w-6 h-6 flex items-center justify-center'><MoveLeft className='cursor-pointer' size={16} onClick={() => { setCategory('Подписка'); setIsCustomCategory(false) }} /></div>
                                </div> : <CustomSelect value={category} options={categoryOptions} onChange={(value) => {
                                    if (value === "OTHER") {
                                        setCategory("");
                                        setIsCustomCategory(true);
                                    } else {
                                        setCategory(value);
                                    }
                                }} />}
                        </div>
                        <p className='font-medium pt-5'>Валюта</p>
                        <div className="mt-3">
                            <CustomSelect value={selectedValute} options={currencyOptions} onChange={setSelectedValute} />
                        </div>
                        <p className='font-medium pt-5'>Период</p>
                        <div className="grid grid-cols-[1fr_1.4fr] gap-2 mt-2">
                            <NumberStepper value={periodCount} onChange={setPeriodCount} />
                            <CustomSelect value={periodUnit} options={periodUnitOptions} onChange={(value) => setPeriodUnit(value as PeriodUnit)} />
                        </div>
                    </div>
                </div>
                <p className='font-medium mt-3'>Ссылка на оплату</p>
                <div className='w-full border border-(--app-border) rounded-lg mt-2 p-2 pl-4 flex flex-row gap-3 items-center'>
                    <Link size={17} />
                    <input value={urlSub} onChange={(e) => setUrlSub(e.target.value)} className=' focus:outline-0 w-full' placeholder='https://www.google.com'></input>
                </div>
                <div className='bg-linear-to-b from-(--app-accent)/9 to-transparent mt-6 flex items-center justify-between rounded-lg border border-(--app-accent) p-3'>
                    <div className='flex items-center gap-4 ml-4'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-(--app-accent)'>
                            <CalendarDays />
                        </div>

                        <div>
                            <p className='text-(--app-text) font-bold'>Следующий платеж</p>
                        </div>
                    </div>

                    <p className='text-xl mr-5 text-(--app-text) font-bold'>{nextPay ? nextPay : '--.--.----'}</p>
                </div>
                <div className='flex justify-end gap-3 text-(--app-text)'>
                    <button className='w-46 border border-(--app-border) rounded-xl p-3.5 mt-3 cursor-pointer text-md' onClick={onClose}>Назад</button>
                    <button className='w-46 bg-(--app-accent) font-medium border border-(--app-border) rounded-xl p-3.5 mt-3 cursor-pointer text-md' onClick={async () => {
                        const isSaved = await saveSub();

                        if (isSaved) {
                            onClose()
                        }
                    }}>Добавить</button>
                </div>
                <div className={`pointer-events-none fixed top-0 left-1/2 z-80 -translate-x-1/2 rounded-b-2xl border border-t-0 border-(--app-border) bg-(--app-surface) p-2 text-center shadow-lg transition-all duration-300 w-70 h-10 ${showValidationNotice ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                    <p className='text-md font-bold text-(--app-text)'>Заполните все поля.</p>
                </div>
                <ModalAvatars
                    isOpen={modalAvatar}
                    onClose={() => setModalAvatar(false)}
                    onSelectIcon={setSelectedIcon}
                />
            </div>
        </div>
    )
}



// Код официально подписан Глентом.
