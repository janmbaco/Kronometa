import type { INavigationService } from "pick-components";

const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

const basePath = normalizeBasePath(import.meta.env.BASE_URL);

export class KronometaNavigationService implements INavigationService {
  navigate(path: string, options: { replace?: boolean } = {}): void {
    if (!isBrowser) {
      return;
    }

    const browserPath = toBrowserPath(path);

    if (options.replace) {
      window.history.replaceState({}, "", browserPath);
    } else {
      window.history.pushState({}, "", browserPath);
    }

    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  getCurrentPath(): string {
    if (!isBrowser) {
      return "/";
    }

    return toAppPath(window.location.pathname);
  }

  subscribe(listener: () => void): () => void {
    if (!isBrowser) {
      return () => {};
    }

    window.addEventListener("popstate", listener);

    return () => window.removeEventListener("popstate", listener);
  }
}

function normalizeBasePath(baseUrl: string): string {
  if (!baseUrl || baseUrl === "/" || baseUrl === "./") {
    return "";
  }

  const absoluteBase = getPathname(baseUrl);
  const withLeadingSlash = absoluteBase.startsWith("/")
    ? absoluteBase
    : `/${absoluteBase}`;
  const withoutTrailingSlash = withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;

  return withoutTrailingSlash === "/" ? "" : withoutTrailingSlash;
}

function toAppPath(browserPath: string): string {
  const routePath = normalizeRoutePath(browserPath);

  if (!basePath) {
    return routePath;
  }

  if (routePath === basePath) {
    return "/";
  }

  if (routePath.startsWith(`${basePath}/`)) {
    return routePath.slice(basePath.length) || "/";
  }

  return routePath;
}

function toBrowserPath(appPath: string): string {
  const routePath = toAppPath(appPath);

  if (!basePath) {
    return routePath;
  }

  return routePath === "/" ? `${basePath}/` : `${basePath}${routePath}`;
}

function normalizeRoutePath(path: string): string {
  const pathname = getPathname(path);

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function getPathname(path: string): string {
  if (URL.canParse(path)) {
    return new URL(path).pathname;
  }

  return path.split(/[?#]/, 1)[0] || "/";
}
