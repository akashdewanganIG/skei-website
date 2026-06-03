import { ENQUIRY_FOCUS_EVENT } from "./constants";

export function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/**
 * Signal the enquiry form to scroll into view and play an attention "pop".
 * The Hero owns the scroll + timing so the pop fires only once it has landed.
 */
export function focusEnquiry() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ENQUIRY_FOCUS_EVENT));
  }
}
