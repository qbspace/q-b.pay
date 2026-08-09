# q-b.pay

A lightweight desktop application for tracking subscriptions, recurring payments, and upcoming charges.

Built with **Electron, React, TypeScript and Tailwind CSS**.

---

## About

**q-b.pay** helps you keep all recurring payments in one place.

Add your subscriptions, specify their price and billing date, and the app will keep track of upcoming payments automatically.

The application works locally and does not require an account or cloud storage.

## Features

- Subscription management
- Upcoming payment tracking
- Automatic billing date calculation
- Payment overview
- Multiple currency support
- Local data storage
- Desktop notifications
- Persistent settings
- Clean and minimal interface
- Cross-platform desktop application

## Tech Stack

**Frontend**

- React
- TypeScript
- Tailwind CSS
- Vite

**Desktop**

- Electron

**Storage**

- Dexie
- IndexedDB

## Local-first

q-b.pay stores application data locally on your device.

No account is required and your subscription information is not sent to external servers.

## Development

Clone the repository:

```bash
git clone https://github.com/USERNAME/q-b.pay.git
cd q-b.pay
```

Install dependencies:

```bash
npm install
```

Start the development environment:

```bash
npm run dev
```

## Build

Create a production build:

```bash
npm run build
```

## Project Structure

```text
q-b.pay/
├── electron/
│   └── main.ts
├── src/
│   ├── components/
│   ├── pages/
│   ├── db/
│   ├── hooks/
│   └── App.tsx
├── public/
└── package.json
```

## Roadmap

- [ ] Payment history
- [ ] Spending statistics
- [ ] Subscription categories
- [ ] Custom notification settings
- [ ] Data export / import
- [ ] Automatic updates
- [ ] Backup and restore

## License

This project is intended for personal and educational use.

---

\<p align="center">
&#x20; \<b>q-b.pay\</b>\<br>
&#x20; Keep your subscriptions under control.
\</p>
