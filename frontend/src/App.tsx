import { useState, type SubmitEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { isProtocol, PROTOCOLS, type Protocol } from "@/lib/protocols"
import type { Rep } from "@/lib/types"

// Touch targets are 60px tall (h-15) for wet hands and covered iPads.
// md:text-lg is needed to override the Input's default md:text-sm.
// The last three classes hide number spinners: [appearance:textfield] for
// Firefox, the ::-webkit-*-spin-button ones for Chrome and Safari.
const inputClassName =
  "h-15 px-3 text-lg md:text-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
const labelClassName = "text-base"

function App() {
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  // Inputs give us text, so keep it as strings and convert on submit.
  const [strokeRate, setStrokeRate] = useState("")
  const [timeSeconds, setTimeSeconds] = useState("")
  // Oldest first, so a rep's number is its position + 1.
  const [reps, setReps] = useState<Rep[]>([])

  const canSubmit = protocol !== null && strokeRate !== "" && timeSeconds !== ""

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    // Stop the browser's default form submit, which would reload the page.
    event.preventDefault()
    if (protocol === null) return

    const rep: Rep = {
      protocol,
      strokeRate: Number(strokeRate),
      timeSeconds: Number(timeSeconds),
    }
    // Make a new array rather than changing the old one, so React re-renders.
    setReps((current) => [...current, rep])

    // Clear the numbers for the next rep but keep the protocol selected.
    setStrokeRate("")
    setTimeSeconds("")
  }

  function undoLastRep() {
    const last = reps.at(-1)
    if (!last) return

    // Ask first, so a stray wet tap can't remove a rep.
    const confirmed = window.confirm(
      `Remove Rep ${reps.length} (${last.protocol}, ${last.strokeRate} spm, ${last.timeSeconds.toFixed(2)} s)?`,
    )
    if (confirmed) setReps((current) => current.slice(0, -1))
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FieldSet>
          <FieldLegend className="data-[variant=legend]:text-lg">
            Protocol
          </FieldLegend>
          <ToggleGroup
            variant="outline"
            className="grid w-full grid-cols-2"
            value={protocol ? [protocol] : []}
            onValueChange={(values) => {
              // Tapping the selected chip again would clear it; ignore that
              // so a protocol always stays selected once chosen.
              const [next] = values
              if (isProtocol(next)) setProtocol(next)
            }}
          >
            {PROTOCOLS.map((p) => (
              <ToggleGroupItem
                key={p}
                value={p}
                className="h-15 text-base whitespace-normal aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {p}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>

        <Field>
          <FieldLabel className={labelClassName} htmlFor="stroke-rate">
            Stroke rate (strokes/min)
          </FieldLabel>
          <Input
            className={inputClassName}
            id="stroke-rate"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="Stroke rate"
            value={strokeRate}
            onChange={(e) => setStrokeRate(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel className={labelClassName} htmlFor="time-seconds">
            Time (seconds)
          </FieldLabel>
          <Input
            className={inputClassName}
            id="time-seconds"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            placeholder="e.g. 18.42"
            value={timeSeconds}
            onChange={(e) => setTimeSeconds(e.target.value)}
          />
        </Field>

        <Button type="submit" className="h-15 text-lg" disabled={!canSubmit}>
          Add rep
        </Button>
      </form>

      <section className="mt-8 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium">Reps ({reps.length})</h2>
          <Button
            type="button"
            variant="outline"
            className="h-15 px-4 text-base"
            onClick={undoLastRep}
            disabled={reps.length === 0}
          >
            Undo last rep
          </Button>
        </div>

        {reps.length === 0 ? (
          <p className="text-muted-foreground">No reps yet.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {/* Copy before reversing: .reverse() would change the state array. */}
            {[...reps].reverse().map((rep, i) => {
              const repNumber = reps.length - i
              return (
                <li
                  key={repNumber}
                  className="flex items-baseline gap-3 rounded-lg border px-4 py-3 text-base"
                >
                  <span className="font-medium whitespace-nowrap">
                    Rep {repNumber}
                  </span>
                  <span className="flex-1">{rep.protocol}</span>
                  <span className="whitespace-nowrap tabular-nums">
                    {rep.strokeRate} spm
                  </span>
                  <span className="whitespace-nowrap tabular-nums">
                    {rep.timeSeconds.toFixed(2)} s
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </main>
  )
}

export default App
