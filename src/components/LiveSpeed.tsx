"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { liveSample } from "@/lib/speed-test";

export type LiveSpeedSnap = {
  pingMs: number | null;
  jitterMs: number | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  at: number;
  paused: boolean;
  error: string | null;
  history: Array<{ t: number; ping: number; down: number | null; up: number | null }>;
};

const EMPTY: LiveSpeedSnap = {
  pingMs: null,
  jitterMs: null,
  downloadMbps: null,
  uploadMbps: null,
  at: 0,
  paused: false,
  error: null,
  history: [],
};

const LiveSpeedContext = createContext<{
  snap: LiveSpeedSnap;
  setHot: (hot: boolean) => void;
  setPaused: (paused: boolean) => void;
}>({ snap: EMPTY, setHot: () => {}, setPaused: () => {} });

function ema(prev: number | null, next: number | null): number | null {
  if (next == null) return prev;
  if (prev == null) return next;
  return prev * 0.65 + next * 0.35;
}

const PAUSE_KEY = "cc-live-speed-paused";

export function LiveSpeedProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<LiveSpeedSnap>(EMPTY);
  const pausedRef = useRef(false);
  const hotRef = useRef(false);
  const pings = useRef<number[]>([]);

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
    try {
      sessionStorage.setItem(PAUSE_KEY, paused ? "1" : "0");
    } catch {
      /* private mode */
    }
    setSnap((prev) => ({ ...prev, paused }));
  }, []);

  const setHotSafe = useCallback((value: boolean) => {
    hotRef.current = value;
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(PAUSE_KEY) === "1") {
        pausedRef.current = true;
        setSnap((prev) => ({ ...prev, paused: true }));
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;
    let tick = 0;
    const ctrl = new AbortController();

    async function sample() {
      if (cancelled || pausedRef.current || document.hidden) return;
      const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
      if (nav.connection?.saveData) return;
      const aggressive = hotRef.current;
      const down = aggressive ? tick % 2 === 0 : tick % 3 === 1;
      const up = aggressive ? tick % 4 === 2 : tick % 6 === 3;
      try {
        const s = await liveSample(
          ctrl.signal,
          {
            down,
            up,
            downBytes: aggressive ? 400_000 : 160_000,
            upBytes: aggressive ? 100_000 : 48_000,
          },
          pings.current,
        );
        if (cancelled) return;
        setSnap((prev) => {
          const downloadMbps = ema(prev.downloadMbps, s.downloadMbps);
          const uploadMbps = ema(prev.uploadMbps, s.uploadMbps);
          const point = {
            t: Date.now(),
            ping: s.pingMs,
            down: downloadMbps,
            up: uploadMbps,
          };
          const history = [...prev.history, point].slice(-48);
          return {
            pingMs: s.pingMs,
            jitterMs: s.jitterMs,
            downloadMbps,
            uploadMbps,
            at: Date.now(),
            paused: false,
            error: null,
            history,
          };
        });
      } catch (err) {
        if ((err as Error).name === "AbortError" || cancelled) return;
        setSnap((prev) => ({
          ...prev,
          error: "Could not reach Cloudflare speed host.",
        }));
      }
    }

    async function loop() {
      while (!cancelled) {
        await sample();
        tick += 1;
        const wait = document.hidden ? 8000 : hotRef.current ? 1200 : 2500;
        await new Promise((r) => window.setTimeout(r, wait));
      }
    }

    void loop();
    const onVis = () => {
      if (!document.hidden) void sample();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      ctrl.abort();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const value = useMemo(
    () => ({ snap, setHot: setHotSafe, setPaused }),
    [snap, setHotSafe, setPaused],
  );

  return <LiveSpeedContext.Provider value={value}>{children}</LiveSpeedContext.Provider>;
}

export function useLiveSpeed() {
  return useContext(LiveSpeedContext);
}
