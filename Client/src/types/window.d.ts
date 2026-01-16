import { BrowserTab } from "../features/context/types";

declare global {
  interface Window {
    lockInExtensionTabs?: BrowserTab[];
  }
}

export {};
