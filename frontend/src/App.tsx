import { useEffect, useState, type SubmitEvent } from "react"
import { Check, ChevronLeft } from "lucide-react"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { newSessionId, submitSession } from "@/lib/api"
import { loadLocalSession, storeLocalSession } from "@/lib/localSession"
import type { Swimmer } from "@/lib/swimmers"
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

// Where the last "Submit to <name>'s file" got to. Only "error" carries a
// message, and TypeScript makes us check the state before reading it.
type SaveStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved" }
  | { state: "error"; message: string }

// The swimmer is looked up from the address, e.g. /swimmers/test-kate (see
// SwimmerRoute.tsx), so App only ever sees one that exists.
function App({ swimmer }: { swimmer: Swimmer }) {
  const swimmerId = swimmer.id
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  // Inputs give us text, so keep it as strings and convert on submit.
  const [strokeRate, setStrokeRate] = useState("")
  const [timeSeconds, setTimeSeconds] = useState("")
  const [tags, setTags] = useState<Tag[]>([])
  const [note, setNote] = useState("")
  // Pick up this swimmer's session from the browser, if one is in progress.
  // The function form runs once, on the first render, not on every render.
  const [initialSession] = useState(() => loadLocalSession(swimmerId))
  // Every rep in the session, oldest first. Saved reps stay listed until the
  // session ends.
  const [reps, setReps] = useState<Rep[]>(initialSession.reps)
  // Created with the first rep of a session and kept until "End session", so
  // every save and retry in the session writes under the same ID.
  const [sessionId, setSessionId] = useState<string | null>(
    initialSession.sessionId,
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: "idle" })
  const isSaving = saveStatus.state === "saving"

  // Copy the session to the browser after every change, so leaving the page
  // or refreshing loses nothing. End session empties it, which removes it.
  useEffect(() => {
    storeLocalSession(swimmerId, { sessionId, reps })
  }, [swimmerId, sessionId, reps])

  const unsavedReps = reps.filter((rep) => !rep.saved)
  const lastRep = reps.at(-1)
  // Saved reps can't be undone, and undoing mid-save would remove a rep
  // that's being sent.
  const canUndo = lastRep !== undefined && !lastRep.saved && !isSaving

  const canSubmit = protocol !== null && strokeRate !== "" && timeSeconds !== ""

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    // Stop the browser's default form submit, which would reload the page.
    event.preventDefault()
    if (protocol === null) return

    const trimmedNote = note.trim()
    // Make a new array rather than changing the old one, so React re-renders.
    setReps((current) => [
      ...current,
      {
        // One more than the last rep, or 1 for the first rep of a session.
        repNumber: (current.at(-1)?.repNumber ?? 0) + 1,
        saved: false,
        protocol,
        strokeRate: Number(strokeRate),
        timeSeconds: Number(timeSeconds),
        tags,
        // Only include a note if something other than spaces was typed.
        ...(trimmedNote ? { note: trimmedNote } : {}),
      },
    ])
    if (sessionId === null) setSessionId(newSessionId())

    // A new rep starts a new set, so the last "Saved" no longer applies.
    if (saveStatus.state === "saved") setSaveStatus({ state: "idle" })

    // Clear everything for the next rep except the protocol.
    setStrokeRate("")
    setTimeSeconds("")
    setTags([])
    setNote("")
  }

  function undoLastRep() {
    if (!canUndo) return

    // Ask first, so a stray wet tap can't remove a rep.
    const confirmed = window.confirm(
      `Remove Rep ${lastRep.repNumber} (${lastRep.protocol}, ${lastRep.strokeRate} spm, ${lastRep.timeSeconds.toFixed(2)} s)?`,
    )
    if (confirmed) setReps((current) => current.slice(0, -1))
  }

  async function submitReps() {
    // Freeze what's being sent; reps added during the save aren't included.
    const toSave = unsavedReps
    const confirmed = window.confirm(
      `Submit ${toSave.length} ${toSave.length === 1 ? "rep" : "reps"} to ${swimmer.name}'s file?`,
    )
    // Always set once there's a rep; the check is for TypeScript.
    if (!confirmed || sessionId === null) return

    setSaveStatus({ state: "saving" })
    try {
      await submitSession(swimmerId, sessionId, toSave)
      // Mark exactly the reps that were sent. Updating from `current`, not
      // `reps`, keeps any reps added while the request was in flight.
      const savedNumbers = new Set(toSave.map((rep) => rep.repNumber))
      setReps((current) =>
        current.map((rep) =>
          savedNumbers.has(rep.repNumber) ? { ...rep, saved: true } : rep,
        ),
      )
      setSaveStatus({ state: "saved" })
    } catch (error) {
      // Change nothing, so the coach can retry with the same reps and
      // sessionId. fetch throws a TypeError if the network is down, so this
      // catches that too.
      let message = error instanceof Error ? error.message : "Save failed"
      // The browser's own timeout message is vague ("signal timed out").
      if (error instanceof DOMException && error.name === "TimeoutError") {
        message = "No response from the server. Check the connection and try again."
      }
      setSaveStatus({ state: "error", message })
    }
  }

  function endSession() {
    if (unsavedReps.length > 0) {
      const confirmed = window.confirm(
        `End session? ${unsavedReps.length} unsaved ${unsavedReps.length === 1 ? "rep" : "reps"} will be lost.`,
      )
      if (!confirmed) return
    }
    // Back to the start: the next rep creates a new sessionId and is Rep 1.
    setReps([])
    setSessionId(null)
    setSaveStatus({ state: "idle" })
  }

  return (
    // Phones: one column. iPad and up (md, 768px+): form left, reps right.
    // items-start stops the panes stretching, which `sticky` needs to work.
    <main className="mx-auto grid min-h-svh w-full max-w-md grid-cols-1 content-start items-start gap-8 p-4 md:max-w-5xl md:grid-cols-2 md:gap-10 md:p-8">
      {/* md:col-span-2: one row above both panes on iPad. */}
      <header className="flex flex-col items-start md:col-span-2">
        {/* h-15 keeps it a full-size touch target, like the buttons. */}
        <Link
          to="/"
          className="inline-flex h-15 items-center gap-1 text-base underline-offset-4 hover:underline"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          Back to swimmers
        </Link>
        <h1 className="text-2xl font-medium">{swimmer.name}</h1>
      </header>

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
            disabled={!canUndo}
          >
            Undo last rep
          </Button>
        </div>

        {reps.length === 0 ? (
          <p className="text-muted-foreground">No reps yet.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {/* Copy before reversing: .reverse() would change the state array. */}
            {[...reps].reverse().map((rep) => {
              return (
                <li
                  key={rep.repNumber}
                  className="flex flex-col gap-2 rounded-lg border px-4 py-3 text-base"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="flex items-center gap-1 font-medium whitespace-nowrap">
                      Rep {rep.repNumber}
                      {rep.saved && (
                        <>
                          {/* aria-hidden: the icon is decoration; the
                              sr-only text is what screen readers announce. */}
                          <Check
                            aria-hidden="true"
                            className="size-4 text-green-600 dark:text-green-500"
                          />
                          <span className="sr-only">(saved)</span>
                        </>
                      )}
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

        {/* Only when there's something to save. Reps being sent stay unsaved
            until the save succeeds, so it also stays up while "Saving…". */}
        {unsavedReps.length > 0 && (
          <Button
            type="button"
            className="h-15 text-lg"
            onClick={submitReps}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : `Submit to ${swimmer.name}'s file`}
          </Button>
        )}

        {/* Outside the block above, so "Saved" still shows once the button
            hides. role="status"/"alert" make screen readers announce it. */}
        {saveStatus.state === "saved" && (
          <p role="status" className="text-center text-base">
            Saved
          </p>
        )}
        {saveStatus.state === "error" && (
          <p role="alert" className="text-center text-base text-destructive">
            {saveStatus.message}
          </p>
        )}

        {reps.length > 0 && (
          <Button
            type="button"
            variant="outline"
            className="h-15 text-lg"
            onClick={endSession}
            // Ending mid-save would clear reps whose save is still in flight.
            disabled={isSaving}
          >
            End session
          </Button>
        )}
      </section>

      {/* md:col-span-2 stretches the footer under both panes on iPad. */}
      <footer className="text-center text-sm text-muted-foreground md:col-span-2">
        <a
          href="https://github.com/Fiona-1981/swimmer-data"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          View the code on GitHub
        </a>
      </footer>
    </main>
  )
}

export default App
