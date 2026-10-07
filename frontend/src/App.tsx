import { useState, type SubmitEvent } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { isProtocol, PROTOCOLS, type Protocol } from "@/lib/protocols"
import { isTag, TAGS, type Tag } from "@/lib/tags"
import type { Rep } from "@/lib/types"

// Touch targets are 60px tall (h-15) for wet hands and covered iPads.
// md:text-lg is needed to override the Input's default md:text-sm.
// The last three classes hide number spinners: [appearance:textfield] for
// Firefox, the ::-webkit-*-spin-button ones for Chrome and Safari.
const inputClassName =
  "h-15 px-3 text-lg md:text-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
const labelClassName = "text-base"
// Shared by protocol and tag chips; the selected chip is filled.
const chipClassName =
  "h-15 text-base whitespace-normal aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"

function App() {
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  // Inputs give us text, so keep it as strings and convert on submit.
  const [strokeRate, setStrokeRate] = useState("")
  const [timeSeconds, setTimeSeconds] = useState("")
  const [tags, setTags] = useState<Tag[]>([])
  const [note, setNote] = useState("")
  // Oldest first, so a rep's number is its position + 1.
  const [reps, setReps] = useState<Rep[]>([])

  const canSubmit = protocol !== null && strokeRate !== "" && timeSeconds !== ""

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    // Stop the browser's default form submit, which would reload the page.
    event.preventDefault()
    if (protocol === null) return

    const trimmedNote = note.trim()
    const rep: Rep = {
      protocol,
      strokeRate: Number(strokeRate),
      timeSeconds: Number(timeSeconds),
      tags,
      // Only include a note if something other than spaces was typed.
      ...(trimmedNote ? { note: trimmedNote } : {}),
    }
    // Make a new array rather than changing the old one, so React re-renders.
    setReps((current) => [...current, rep])

    // Clear everything for the next rep except the protocol.
    setStrokeRate("")
    setTimeSeconds("")
    setTags([])
    setNote("")
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

  function submitReps() {
    const confirmed = window.confirm(
      `Submit ${reps.length} ${reps.length === 1 ? "rep" : "reps"} to the swimmer's file?`,
    )
    if (!confirmed) return

    // Placeholder until there's a backend: log the reps, then start afresh.
    console.log("Submitted reps", reps)
    setReps([])
  }

  return (
    // Phones: one column. iPad and up (md, 768px+): form left, reps right.
    // items-start stops the panes stretching, which `sticky` needs to work.
    <main className="mx-auto grid min-h-svh w-full max-w-md grid-cols-1 content-start items-start gap-8 p-4 md:max-w-5xl md:grid-cols-2 md:gap-10 md:p-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 md:sticky md:top-8"
      >
        <FieldSet>
          <FieldLegend className="data-[variant=legend]:text-lg">
            Protocol
          </FieldLegend>
          <ToggleGroup
            variant="outline"
            className="grid w-full grid-cols-2 md:grid-cols-3"
            value={protocol ? [protocol] : []}
            onValueChange={(values) => {
              // Tapping the selected chip again would clear it; ignore that
              // so a protocol always stays selected once chosen.
              const [next] = values
              if (isProtocol(next)) setProtocol(next)
            }}
          >
            {PROTOCOLS.map((p) => (
              <ToggleGroupItem key={p} value={p} className={chipClassName}>
                {p}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>

        {/* items-end lines the boxes up if one label wraps to two lines. */}
        <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-2 md:gap-4">
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
        </div>

        <FieldSet>
          <FieldLegend className="data-[variant=legend]:text-lg">
            Tags (optional)
          </FieldLegend>
          <ToggleGroup
            multiple
            variant="outline"
            className="grid w-full grid-cols-3"
            value={tags}
            // The guard filters out anything that isn't a known tag.
            onValueChange={(values) => setTags(values.filter(isTag))}
          >
            {TAGS.map((t) => (
              <ToggleGroupItem key={t} value={t} className={chipClassName}>
                {t}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>

        <Field>
          <FieldLabel className={labelClassName} htmlFor="note">
            Note (optional)
          </FieldLabel>
          <Input
            className={inputClassName}
            id="note"
            type="text"
            maxLength={80}
            autoComplete="off"
            placeholder="e.g. breathed on 3"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <Button type="submit" className="h-15 text-lg" disabled={!canSubmit}>
          Add rep
        </Button>
      </form>

      <section className="flex flex-col gap-4">
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
                  className="flex flex-col gap-2 rounded-lg border px-4 py-3 text-base"
                >
                  <div className="flex items-baseline gap-3">
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
                  </div>
                  {rep.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {rep.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="h-6 text-sm"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {rep.note && (
                    <p className="text-sm text-muted-foreground">{rep.note}</p>
                  )}
                </li>
              )
            })}
          </ol>
        )}

        {reps.length > 0 && (
          <Button type="button" className="h-15 text-lg" onClick={submitReps}>
            Submit to swimmer's file
          </Button>
        )}
      </section>
    </main>
  )
}

export default App
