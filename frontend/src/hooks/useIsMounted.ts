import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true, // client snapshot — mounted
    () => false, // server snapshot — not mounted
  );
}
