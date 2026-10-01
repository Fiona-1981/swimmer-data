import type { Protocol } from "@/lib/protocols"

// One recorded rep. Rep numbers aren't stored; they come from list order.
export type Rep = {
  protocol: Protocol
  strokeRate: number // strokes per minute
  timeSeconds: number // seconds, to hundredths
}
