import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { v4 as uuidv4 } from "uuid";
import type { Session } from "../types/index.js";

const DATA_PATH = resolve(process.cwd(), "data", "sessions.json");

interface SessionStore {
  sessions: Session[];
}

function readStore(): SessionStore {
  const raw = readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeStore(store: SessionStore): void {
  writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export const SessionModel = {
  create(userId: string): Session {
    const store = readStore();
    const session: Session = {
      id: uuidv4(),
      userId,
      createdAt: new Date().toISOString(),
    };
    store.sessions.push(session);
    writeStore(store);
    return session;
  },

  findByToken(token: string): Session | undefined {
    return readStore().sessions.find((s) => s.id === token);
  },

  delete(token: string): boolean {
    const store = readStore();
    const index = store.sessions.findIndex((s) => s.id === token);
    if (index === -1) return false;
    store.sessions.splice(index, 1);
    writeStore(store);
    return true;
  },

  deleteByUserId(userId: string): void {
    const store = readStore();
    store.sessions = store.sessions.filter((s) => s.userId !== userId);
    writeStore(store);
  },
};
