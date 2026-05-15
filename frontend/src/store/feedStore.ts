import { create } from "zustand";

export type FeedKind = "released" | "paused" | "override" | "blocked" | "info";
export interface FeedEvent {
  id: string;
  ts: number;
  kind: FeedKind;
  message: string;
}

interface FeedState {
  events: FeedEvent[];
  push: (e: Omit<FeedEvent, "id" | "ts">) => void;
}

let counter = 0;
export const useFeedStore = create<FeedState>((set) => ({
  events: [
    { id: "f0", ts: Date.now(), kind: "info", message: "Squad webhook channel connected." },
  ],
  push: (e) =>
    set((s) => ({
      events: [{ id: `f${++counter}`, ts: Date.now(), ...e }, ...s.events].slice(0, 80),
    })),
}));
