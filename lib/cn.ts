import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combine class names; later Tailwind utilities win on conflict. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
