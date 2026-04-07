import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiStore {
  isSidebarOpen: boolean; // mobile: drawer open/close
  isSidebarCollapsed: boolean; // desktop: collapsed to icon-only
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebarOpen: () => void;
  toggleSidebarCollapsed: () => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      isSidebarOpen: false,
      isSidebarCollapsed: false,
      openSidebar: () => set({ isSidebarOpen: true }),
      closeSidebar: () => set({ isSidebarOpen: false }),
      toggleSidebarOpen: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
      toggleSidebarCollapsed: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
    }),
    { name: "ui-store", partialize: (s) => ({ isSidebarCollapsed: s.isSidebarCollapsed }) },
  ),
);
