// Optional tags a coach can add to a rep. Same pattern as PROTOCOLS.
export const TAGS = ["Tempo Trainer", "Tired", "Underwater off"] as const

export type Tag = (typeof TAGS)[number]

// Type guard: narrows an unknown value to Tag if it's in the list.
export function isTag(value: unknown): value is Tag {
  return TAGS.includes(value as Tag)
}
