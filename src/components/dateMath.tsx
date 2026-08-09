type DateMath = {
    date: string,
    period: string
}

export default function DateMath({ date, period }: DateMath) {
    if (!date) return;

    const newDate = new Date(date);

    newDate.setMonth(newDate.getMonth() + Number(period));
}
