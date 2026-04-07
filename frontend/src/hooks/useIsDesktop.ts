import { useSyncExternalStore } from "react";

const BREAKPOINT = "(min-width: 1024px)";

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia(BREAKPOINT);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(BREAKPOINT).matches,
    () => true, // server snapshot — assume desktop
  );
}
