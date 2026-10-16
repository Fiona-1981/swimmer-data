import type { Protocol } from "@/lib/protocols"
import type { Tag } from "@/lib/tags"

// One recorded rep.
export type Rep = {
  repNumber: number // 1, 2, 3... within the session; part of its key in the database
  saved: boolean // true once the backend has confirmed it
  protocol: Protocol
  strokeRate: number // strokes per minute
  timeSeconds: number // seconds, to hundredths
  tags: Tag[] // empty array when none are selected
  note?: string // only set when the coach typed something
}
