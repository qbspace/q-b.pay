import Dexie, { type EntityTable } from "dexie";

export interface Setting {
  key: string;
  value: string;
}

export interface Subscription {
  id?: number;
  name: string;
  logoUrl: string;
  price: number;
  currency: string;
  period: string;
  category: string;
  dateStart: string;
  dateEnd: string;
  urlSub: string;
}

const db = new Dexie("subscription-manager") as Dexie & {
  settings: EntityTable<Setting, "key">;
  subscriptions: EntityTable<Subscription, "id">;
};

db.version(1).stores({
  settings: "key",
  subscriptions: "++id",
});

export { db };