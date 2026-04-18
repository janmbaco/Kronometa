import { Singleton } from "@janmbaco/injectkit";
import { navigate } from "pick-components";

export type RouteListener = (path: string) => void;

const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

@Singleton()
export class KronometaRoutingService {
  getCurrentPath(): string {
    if (!isBrowser) {
      return "/";
    }

    return window.location.pathname;
  }

  navigateTo(path: string, options: { replace?: boolean } = {}): void {
    if (!isBrowser) {
      return;
    }

    navigate(path, options);
  }

  subscribe(listener: RouteListener): () => void {
    if (!isBrowser) {
      return () => {};
    }

    const onPopState = () => {
      listener(window.location.pathname);
    };

    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }
}
