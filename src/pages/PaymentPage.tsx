// imports
import { Check, ListSortAscending, ListSortDescending, Pencil, Trash } from 'lucide-react';
import { useState, useEffect } from 'react';
import ModalAddSub from '../components/modalAddSub';
import EditModalSub from '#components/editModalSub';
import { db, type Subscription } from "../lib/db";
import { getRenewedPayDate } from '../components/periodMath';
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)


function PaymentPage() {

  const [searchText, setSearchText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalEditOpen, setModalEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>()
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [enableSubscriptions, setEnableSubscriptions] = useState<Subscription[]>([]);
  const [today, setToday] = useState(dayjs())
  const [sortDirection, setSortDirection] = useState<'nearest' | 'farthest'>('nearest')

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(dayjs())
    }, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])


  async function LoadSubscriptions() {
    const subscriptions = await db.subscriptions.toArray();
    setEnableSubscriptions(subscriptions);
  }

  useEffect(() => {
    LoadSubscriptions();
  }, []);

  useEffect(() => {
    if (confirmDeleteId == null) return;

    const timeoutId = window.setTimeout(() => {
      setConfirmDeleteId(null)
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [confirmDeleteId])

  const filteredSubscriptions = enableSubscriptions.filter((sub) =>
    sub.name.toLowerCase().includes(searchText.toLowerCase()) ||
    sub.category.toLowerCase().includes(searchText.toLowerCase())
  )

  function getDateLabel(dateEnd: string) {
    const date = dayjs(dateEnd, "DD.MM.YYYY")

    if (date.isSame(today, "day")) return "Сегодня"
    if (date.isSame(today.add(1, "day"), "day")) return "Завтра"
    if (date.isBefore(today, "day")) return "Истекла"

    return dateEnd
  }

  function closeModal() {
    setModalOpen(false);
    setModalEditOpen(false);
    LoadSubscriptions();
  }

  function sortByDate(a: Subscription, b: Subscription) {
    const dateA = dayjs(a.dateEnd, "DD.MM.YYYY").valueOf()
    const dateB = dayjs(b.dateEnd, "DD.MM.YYYY").valueOf()

    return sortDirection === 'nearest' ? dateA - dateB : dateB - dateA
  }

  const overdueSubscriptions = filteredSubscriptions.filter((sub) => {
    return dayjs(sub.dateEnd, "DD.MM.YYYY").isBefore(today, "day");
  }).sort(sortByDate);

  async function HandleClickDelete(id: number) {
    await db.subscriptions.delete(id)
    setConfirmDeleteId(null)
    LoadSubscriptions();

  }

  function handleDeleteConfirm(id?: number) {
    if (!id) return;

    if (confirmDeleteId === id) {
      HandleClickDelete(id)
      return;
    }

    setConfirmDeleteId(id)
  }

  async function handleRenewSubscription(subscription: Subscription) {
    if (!subscription.id) return;

    const renewedDate = getRenewedPayDate(subscription.dateEnd, subscription.period)

    if (!renewedDate) return;

    await db.subscriptions.update(subscription.id, {
      dateEnd: renewedDate,
    })

    LoadSubscriptions()
  }

  const activeSubscriptions = filteredSubscriptions
    .filter((sub) => {
      const endDate = dayjs(sub.dateEnd, "DD.MM.YYYY");

      return (
        !endDate.isBefore(today, "day")
      );
    })
    .sort(sortByDate);



  return (
    <div className="w-full bg-(--app-bg) text-(--app-text) space-y-6 select-none">

      <header className="flex justify-between items-center">
        <div
          className="w-full h-30 bg-no-repeat flex justify-between items-center px-10 rounded-2xl bg-cover bg-center mb-6"
          style={{ backgroundImage: "url('./payment.jpg')" }}
        >
          <h1 className='text-[1.6rem] font-bold text-[#f3f3f3] drop-shadow-[0_1.2px_1.1px_rgba(0,0,0,0.8)] select-none'>Подписки</h1>
          <button onClick={() => setModalOpen(true)} className="bg-(--app-button) text-(--app-button-text) text-[13px] font-semibold px-4.5 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition cursor-pointer">
            + Добавить
          </button>
        </div>
      </header>


      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-(--app-text-soft)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchText} onChange={(e) => setSearchText(e.target.value)}
            placeholder="Поиск подписок..."
            className="w-full bg-(--app-surface-soft) border border-(--app-border) rounded-xl pl-10 pr-4 py-2 text-xs text-(--app-text) placeholder:text-(--app-text-soft) focus:outline-none focus:border-(--app-accent) transition"
          />
        </div>

        <button
          onClick={() => setSortDirection(sortDirection === 'nearest' ? 'farthest' : 'nearest')}
          title={sortDirection === 'nearest' ? 'Сначала ближайшие' : 'Сначала дальние'}
          className={`border p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${sortDirection === 'nearest' ? 'bg-(--app-surface-soft) border-(--app-border) text-(--app-text-muted) hover:text-(--app-text) hover:border-(--app-accent)' : 'bg-(--app-accent)/15 border-(--app-accent) text-(--app-accent)'}`}
        >
          {sortDirection === 'nearest' ? (
            <ListSortAscending className="size-4" />
          ) : (
            <ListSortDescending className="size-4" />
          )}
        </button>
      </div>

      {overdueSubscriptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-(--app-text-muted) uppercase tracking-wider">
            Просроченные
          </h2>

          <div className="space-y-2">
            {overdueSubscriptions.map((i) => (
              <div key={i.id} className="bg-(--app-surface) border border-red-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-(--app-surface-strong) border border-(--app-border-soft) text-(--app-text-muted) font-medium text-xs flex items-center justify-center">
                    {i.logoUrl ? (
                      <img src={i.logoUrl} alt={i.name} className="w-6 h-6 object-contain" />
                    ) : (
                      i.name[0]
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{i.name}</div>
                    <div className="text-xs text-(--app-text-muted)">{i.price} {i.currency} • {getDateLabel(i.dateEnd)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleRenewSubscription(i)} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-xl hover:bg-emerald-500/20 transition cursor-pointer">
                    Оплачено
                  </button>

                  <button onClick={() =>{
                    setEditId(i.id)
                    setModalEditOpen(true)
                  }} className="p-2 text-(--app-text-muted) hover:text-(--app-text) bg-(--app-surface-strong) border border-(--app-border-soft) rounded-xl transition cursor-pointer">
                    <Pencil className='size-3.5' />
                  </button>

                  <button className={`p-2 bg-(--app-surface-strong) border border-(--app-border-soft) rounded-xl transition cursor-pointer ${confirmDeleteId === i.id ? 'text-emerald-400 hover:text-emerald-300' : 'text-(--app-text-muted) hover:text-red-400'}`} onClick={() => handleDeleteConfirm(i.id)}>
                    {confirmDeleteId === i.id ? <Check className='size-3.5' /> : <Trash className='size-3.5' />}
                  </button>
                </div>

              </div>
            ))}
          </div>
        </section>
      )}


      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-(--app-text-muted) uppercase tracking-wider">
          Подписки
        </h2>

        <div className="space-y-2">
          {activeSubscriptions.length ? activeSubscriptions.map((i) => (
            <div key={i.id} className="bg-(--app-surface) border border-(--app-border) rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-(--app-surface-strong) border border-(--app-border-soft) text-(--app-text-muted) font-medium text-xs flex items-center justify-center">
                  {i.logoUrl ? (
                    <img src={i.logoUrl} alt={i.name} className="w-6 h-6 object-contain cursor-pointer" onClick={() => window.open(i.urlSub, "_blank")}/>
                  ) : (
                    i.name[0]
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm cursor-pointer" onClick={() => window.open(i.urlSub, "_blank")}>{i.name}</div>
                  <div className="text-xs text-(--app-text-soft)">{i.price} {i.currency} • {getDateLabel(i.dateEnd)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => handleRenewSubscription(i)} className="bg-(--app-surface-strong) border border-(--app-border-soft) text-(--app-text-muted) text-xs font-medium px-3 py-1.5 rounded-xl hover:bg-(--app-hover) hover:text-(--app-text) transition cursor-pointer">
                  Продлить
                </button>

                <button onClick={() =>{
                    setEditId(i.id)
                    setModalEditOpen(true)
                  }} className="p-2 text-(--app-text-muted) hover:text-(--app-text) bg-(--app-surface-strong) border border-(--app-border-soft) rounded-xl transition cursor-pointer">
                  <Pencil className='size-3.5' />
                </button>

                <button className={`p-2 bg-(--app-surface-strong) border border-(--app-border-soft) rounded-xl transition cursor-pointer ${confirmDeleteId === i.id ? 'text-emerald-400 hover:text-emerald-300' : 'text-(--app-text-muted) hover:text-red-400'}`} onClick={() => handleDeleteConfirm(i.id)}>
                  {confirmDeleteId === i.id ? <Check className='size-3.5' /> : <Trash className='size-3.5' />}
                </button>
              </div>
            </div>
          )): <p className='text-sm text-(--app-text-muted)'>У Вас еще нет подписок</p>}
        </div>
      </section>
      <ModalAddSub isOpen={modalOpen} onClose={closeModal} />
      <EditModalSub isOpen={modalEditOpen} onClose={closeModal} subId={editId || null} />
    </div>
  )
}

export default PaymentPage
