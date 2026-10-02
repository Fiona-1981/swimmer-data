import type { Protocol } from "@/lib/protocols"
import type { Tag } from "@/lib/tags"

// One recorded rep. Rep numbers aren't stored; they come from list order.
export type Rep = {
  protocol: Protocol
  strokeRate: number // strokes per minute
  timeSeconds: number // seconds, to hundredths
  tags: Tag[] // empty array when none are selected
  note?: string // only set when the coach typed something
}
