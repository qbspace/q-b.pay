// imports
import { useEffect, useState } from "react";
import { db } from "../lib/db";
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

function HomePage() {
  const [name, setName] = useState("");
  const [enableSubscriptions, setEnableSubscriptions] = useState<any[]>([]);
  const [today, setToday] = useState(dayjs())

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(dayjs())
    }, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])


  const now = today.format('DD.MM.YYYY')
  const tomorrow = today.add(1, 'day').format('DD.MM.YYYY')

  useEffect(() => {
    async function loadName() {
      const setting = await db.settings.get("username");

      if (setting) {
        setName(setting.value);
      }
    }

    async function LoadSubscriptions() {
      const subscriptions = await db.subscriptions.toArray();
      setEnableSubscriptions(subscriptions);
    }

    loadName();
    LoadSubscriptions();
  }, []);

  const overdueSubscriptions = enableSubscriptions.filter((sub) => {
    return dayjs(sub.dateEnd, "DD.MM.YYYY").isBefore(today, "day");
  });

  const overdueSliceSub = overdueSubscriptions.slice(0, 5)
  const overdueCountSub = overdueSliceSub.length

  const monthLater = today.add(1, "month");
  const activeSubscriptions = enableSubscriptions
    .filter((sub) => {
      const endDate = dayjs(sub.dateEnd, "DD.MM.YYYY");

      return (
        !endDate.isBefore(today, "day") &&
        (endDate.isBefore(monthLater, "day") || endDate.isSame(monthLater, "day"))
      );
    })
    .sort((a, b) => {
      return (
        dayjs(a.dateEnd, "DD.MM.YYYY").valueOf() -
        dayjs(b.dateEnd, "DD.MM.YYYY").valueOf()
      );
    });

  const activeSliceSub = activeSubscriptions.slice(0, 5)
  const activeCountSub = activeSliceSub.length
  const currencyLabels: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
  }
  const currencyOrder = ['₽', '€', '$']
  const completeSums = activeSubscriptions.reduce<Record<string, number>>((acc, sub) => {
    const currency = currencyLabels[sub.currency] || sub.currency || '₽'
    acc[currency] = (acc[currency] || 0) + Number(sub.price || 0)
    return acc
  }, {})

  const completeSumsList = Object.entries(completeSums).sort(([currencyA], [currencyB]) => {
    const orderA = currencyOrder.indexOf(currencyA)
    const orderB = currencyOrder.indexOf(currencyB)

    return (orderA === -1 ? currencyOrder.length : orderA) - (orderB === -1 ? currencyOrder.length : orderB)
  })


  return (
    <section>
      {/* <button onClick={checkSubscriptions}>Da</button> */}
      <div
        className="w-full h-35 bg-no-repeat flex justify-start items-center rounded-2xl bg-cover bg-center mb-6"
        style={{ backgroundImage: "url('./card.jpg')" }}
      >
        <h1 className='text-[1.6rem] font-bold text-[#f3f3f3] pl-10 drop-shadow-[0_1.2px_1.1px_rgba(0,0,0,0.8)] select-none'>{`Добро пожаловать ${name ? `, ${name}` : ''}!`}</h1>
      </div>


      <section className="bg-(--app-surface) border border-(--app-border) rounded-2xl p-5">

        <div className="text-xs text-(--app-text-muted) font-medium mb-1">Расходы в ближайший месяц</div>
        <div className="text-3xl font-extrabold tracking-tight flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {completeSumsList.length > 0 ? completeSumsList.map(([currency, sum]) => (
            <span key={currency}>{sum.toFixed(2)} {currency}</span>
          )) : <span>0.00 ₽</span>}
          <span className="text-sm font-normal text-(--app-text-soft)">/ мес</span>
        </div>

        <div className="mt-4 pt-3 border-t border-(--app-border-soft) text-xs text-(--app-text-muted) flex items-center gap-2 flex-wrap">
          <span className="text-(--app-text-soft) font-medium">Активные:</span>
          {activeSubscriptions.map((i) => (
            <div key={i.id} className=''>
              <span className="text-green-400">•</span>
              <span className='p-2'>{i.name} ({i.price} {i.currency})</span>
            </div>
          ))}
        </div>

      </section>


      {overdueSliceSub.length > 0 && (<section className="bg-(--app-surface) border border-red-400/50 rounded-2xl p-5 mt-5">


        <div className="flex justify-between items-baseline mb-4">
          <div>
            {/* <div className="text-xs text-(--app-text-muted) font-medium mb-1">Просроченные платежи</div> */}
            <div className="text-lg font-bold tracking-tight">Просроченные платежи</div>
          </div>
          <span className="text-xs text-(--app-text-soft)">{overdueCountSub} на очереди</span>
        </div>

        {overdueSliceSub.map((i) => (
          <div key={i.id}>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-(--app-surface-strong) border border-(--app-border-soft) text-(--app-text-muted) font-medium text-xs flex items-center justify-center">
                  {/* {i.name[0]} */}
                  <img src={i.logoUrl} alt={i.name} className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <div className="font-medium text-sm">{i.name}</div>
                  <div className="text-xs text-(--app-text-soft)">{i.category}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm">{i.price} {i.currency}</div>
                <div className={`text-xs font-medium ${i.dateEnd === now ? 'text-red-400' : i.dateEnd === tomorrow ? 'text-orange-400' : 'text-(--app-text-soft)'}`}>{i.dateEnd === now ? 'Сегодня' : i.dateEnd === tomorrow ? 'Завтра' : dayjs(i.dateEnd, "DD.MM.YYYY").isBefore(today, "day") ? 'Просрочено' : i.dateEnd}</div>
              </div>
            </div>

            <div className="border-t border-(--app-border-soft) mt-1" />
          </div>
        ))}

        <div className="space-y-3"></div>
      </section>)}


      <section className="bg-(--app-surface) border border-(--app-border) rounded-2xl p-5 mt-5">


        <div className="flex justify-between items-baseline mb-4">
          <div>
            <div className="text-xs text-(--app-text-muted) font-medium mb-1">Ближайшие списания</div>
            <div className="text-lg font-bold tracking-tight">График платежей</div>
          </div>
          <span className="text-xs text-(--app-text-soft)">{activeCountSub} на очереди</span>
        </div>


        <div className="space-y-3">

          {activeSliceSub.length ? activeSliceSub.map((i) => (
            <div key={i.id}>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-(--app-surface-strong) border border-(--app-border-soft) text-(--app-text-muted) font-medium text-xs flex items-center justify-center">
                    {/* {i.name[0]} */}
                    <img src={i.logoUrl} alt={i.name} className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{i.name}</div>
                    <div className="text-xs text-(--app-text-soft)">{i.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{i.price} {i.currency}</div>
                  <div className={`text-xs font-medium ${i.dateEnd === now ? 'text-red-400' : i.dateEnd === tomorrow ? 'text-orange-400' : 'text-(--app-text-soft)'}`}>{i.dateEnd === now ? 'Сегодня' : i.dateEnd === tomorrow ? 'Завтра' : dayjs(i.dateEnd, "DD.MM.YYYY").isBefore(today, "day") ? 'Просрочено' : i.dateEnd}</div>
                </div>
              </div>

              <div className="border-t border-(--app-border-soft) mt-1" />
            </div>
          )) : <p className="text-sm text-(--app-text-muted)">Ближайший списаний нет</p>}
        </div>

      </section>
    </section>
  )
}

export default HomePage
