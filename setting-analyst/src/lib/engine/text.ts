import { ASKED_NO_ANSWER } from "./types.ts";

export function filled(value: string | undefined | null): boolean {
  return Boolean(value && value.trim() && value.trim() !== ASKED_NO_ANSWER);
}

export function declined(value: string | undefined | null): boolean {
  return Boolean(value && value.trim() === ASKED_NO_ANSWER);
}

export function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function norm(value: string): string {
  return value.toLowerCase();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function unique(list: string[]): string[] {
  return Array.from(new Set(list.filter(Boolean)));
}

export function quote(value: string): string {
  const t = value.trim();
  return t ? `"${t}"` : "—";
}
