// The test protocols a coach can record. `as const` keeps each entry as its
// exact string so the Protocol type below can be derived from this list.
export const PROTOCOLS = [
  "All out",
  "Fastest movement",
  "Tempo",
  "100 feel",
  "200 feel",
  "Race footage",
] as const

// "All out" | "Fastest movement" | "Tempo" | "100 feel" | "200 feel" | "Race footage"
export type Protocol = (typeof PROTOCOLS)[number]

// Type guard: narrows an unknown value to Protocol if it's in the list.
export function isProtocol(value: unknown): value is Protocol {
  return PROTOCOLS.includes(value as Protocol)
}
