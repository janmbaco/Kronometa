import { Singleton } from "@janmbaco/injectkit";

export type ClockListener = (now: number) => void;

@Singleton()
export class ClockService {
  private readonly listeners = new Set<ClockListener>();
  private intervalId: number | null = null;
  private now = Date.now();

  getNow(): number {
    return this.now;
  }

  subscribe(listener: ClockListener): () => void {
    this.listeners.add(listener);
    listener(this.now);
    this.ensureRunning();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  private ensureRunning(): void {
    if (this.intervalId !== null || typeof window === "undefined") {
      return;
    }

    this.intervalId = window.setInterval(() => {
      this.now = Date.now();
      this.listeners.forEach((listener) => listener(this.now));
    }, 100);
  }

  private stop(): void {
    if (this.intervalId === null || typeof window === "undefined") {
      return;
    }

    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }
}
