// imports
import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { db, type Subscription } from "../lib/db";
import { appThemes, applyAppTheme, type AppTheme, defaultTheme, isAppTheme, themeLabels } from "../lib/theme";

function SettingsPage() {

  const [name, setName] = useState("");
  const [theme, setTheme] = useState<AppTheme>(defaultTheme);
  const [importExportMessage, setImportExportMessage] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadName() {
      const setting = await db.settings.get("username");

      if (setting) {
        setName(setting.value);
      }
    }

    async function loadTheme() {
      const setting = await db.settings.get("theme");

      if (setting && isAppTheme(setting.value)) {
        setTheme(setting.value);
        applyAppTheme(setting.value);
      }
    }

    loadName();
    loadTheme();
  }, []);

  async function saveTheme(value: AppTheme) {
    applyAppTheme(value);
    setTheme(value);
    await db.settings.put({
      key: "theme",
      value,
    })
  }

  async function saveName() {
    await db.settings.put({
      key: "username",
      value: name,
    });
  }

  async function exportSubscriptions() {
    const subscriptions = await db.subscriptions.toArray();
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      subscriptions,
    };

    const file = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "subscriptions.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importSubscriptions(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const subscriptions = Array.isArray(data) ? data : data.subscriptions;

      if (!Array.isArray(subscriptions)) {
        throw new Error("Invalid subscriptions file");
      }

      const subscriptionsForImport: Omit<Subscription, "id">[] = subscriptions.map((sub) => ({
        name: String(sub.name ?? ""),
        logoUrl: String(sub.logoUrl ?? ""),
        price: Number(sub.price ?? 0),
        currency: String(sub.currency ?? "₽"),
        period: String(sub.period ?? "1"),
        category: String(sub.category ?? ""),
        dateStart: String(sub.dateStart ?? ""),
        dateEnd: String(sub.dateEnd ?? ""),
        urlSub: String(sub.urlSub ?? ""),
      }));

      await db.subscriptions.bulkAdd(subscriptionsForImport);
    } catch {
      setImportExportMessage("Не удалось импортировать файл");
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  }

  return (
    <section className="bg-(--app-surface) border border-(--app-border) rounded-2xl p-5">
      <div className="mb-5">
        <h1 className='text-[1.6rem] font-bold text-[#f3f3f3] drop-shadow-[0_1.2px_1.1px_rgba(0,0,0,0.8)] select-none'>Настройки</h1>
      </div>
      <p className="text-(--app-text) text-lg mb-2">Основные</p>
      <p className="text-(--app-text-muted) mb-1">Имя пользователя</p>
      <div className="flex flex-row gap-4 mb-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Введите имя"
          className="w-full p-2 rounded-md bg-(--app-surface-strong) text-(--app-text) border border-(--app-border) placeholder:text-(--app-text-soft) focus:outline-none focus:ring-2 focus:ring-(--app-accent)"
        />

        <button onClick={saveName} className="px-4 py-2 bg-(--app-accent) text-(--app-accent-text) rounded-md hover:bg-(--app-accent-hover) transition cursor-pointer">
          Сохранить
        </button>
      </div>
      <div className="space-y-4">
        <p className="text-(--app-text) text-lg mb-2">Внешний вид</p>

        <div>
          <p className="mb-1 text-(--app-text-muted)">Тема приложения</p>

          <select
            value={theme}
            onChange={(e) => {
              const value = e.target.value
              if (!isAppTheme(value)) {
                return
              }

              saveTheme(value)
            }}
            className="w-full cursor-pointer rounded-md border border-(--app-border) bg-(--app-surface-strong) p-2 text-(--app-text) outline-none focus:ring-2 focus:ring-(--app-accent)"
          >
            {appThemes.map((item) => (
              <option key={item} value={item}>{themeLabels[item]}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-(--app-text) text-lg mb-2">Данные</p>
          <p className="mb-2 text-(--app-text-muted)">Подписки</p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportSubscriptions}
              className="inline-flex items-center gap-2 rounded-md bg-(--app-accent) px-4 py-2 text-(--app-accent-text) transition hover:bg-(--app-accent-hover) cursor-pointer"
              type="button"
            >
              <Download size={16} />
              Экспорт
            </button>

            <button
              onClick={() => importInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-(--app-border) bg-(--app-surface-strong) px-4 py-2 text-(--app-text) transition hover:border-(--app-accent) cursor-pointer"
              type="button"
            >
              <Upload size={16} />
              Импорт
            </button>

            <input
              ref={importInputRef}
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  importSubscriptions(file);
                }
              }}
              type="file"
            />
          </div>

          {importExportMessage && (
            <p className="mt-2 text-xs text-(--app-text-soft)">{importExportMessage}</p>
          )}
        </div>
      </div>
      <div className="mt-5 text-(--app-text-muted) text-xs select-none">
        <p>oplata.dev - 0.1.2v</p>
      </div>
          
    </section>
  );

}

export default SettingsPage
