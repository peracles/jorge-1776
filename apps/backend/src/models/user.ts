import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { v4 as uuidv4 } from "uuid";
import type { User } from "../types/index.js";

const DATA_PATH = resolve(process.cwd(), "data", "users.json");

interface UserStore {
  users: User[];
}

function readStore(): UserStore {
  const raw = readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeStore(store: UserStore): void {
  writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export const UserModel = {
  findAll(): User[] {
    return readStore().users;
  },

  findById(id: string): User | undefined {
    return readStore().users.find((u) => u.id === id);
  },

  findByEmail(email: string): User | undefined {
    return readStore().users.find((u) => u.email === email);
  },

  create(data: Omit<User, "id" | "balance" | "createdAt">): User {
    const store = readStore();
    const user: User = {
      id: uuidv4(),
      fullName: data.fullName,
      email: data.email,
      passwordHash: data.passwordHash,
      balance: 0,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    writeStore(store);
    return user;
  },

  updateBalance(id: string, amount: number): User | undefined {
    const store = readStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) return undefined;
    user.balance += amount;
    writeStore(store);
    return user;
  },
};
