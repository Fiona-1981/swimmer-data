import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldSet } from "@/components/ui/field"

// Large touch targets for poolside iPads (Apple recommends 44px minimum).
// md:text-lg is needed to override the Input's default md:text-sm.
// The last three classes hide number spinners: [appearance:textfield] for
// Firefox, the ::-webkit-*-spin-button ones for Chrome and Safari.
const inputClassName =
  "h-12 px-3 text-lg md:text-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
const labelClassName = "text-base"

// A stroke rate field plus a minutes:seconds time field.
// `id` prefixes the input ids, e.g. "all-out" -> "all-out-rate".
function RateTimeGroup({ id, title }: { id: string; title: string }) {
  return (
    <FieldSet className="w-full">
      <Field>
        <FieldLabel className={labelClassName} htmlFor={`${id}-rate`}>
          {title} stroke rate
        </FieldLabel>
        <Input
          className={inputClassName}
          id={`${id}-rate`}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="Stroke rate"
        />
      </Field>
      <Field>
        <FieldLabel className={labelClassName} htmlFor={`${id}-time-minutes`}>
          {title} time
        </FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            className={inputClassName}
            id={`${id}-time-minutes`}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="min"
            aria-label={`${title} time minutes`}
          />
          <span className="text-lg">:</span>
          <Input
            className={inputClassName}
            id={`${id}-time-seconds`}
            type="number"
            inputMode="decimal"
            min={0}
            max={59.99}
            step={0.01}
            placeholder="sec"
            aria-label={`${title} time seconds`}
          />
        </div>
      </Field>
    </FieldSet>
  )
}

function App() {
  return (
    <>
      <div className="flex min-h-svh flex-col items-center justify-center gap-10 p-4">
        <div className="grid w-full max-w-2xl grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
          <RateTimeGroup id="all-out" title="All out" />
          <RateTimeGroup id="fastest-movement" title="Fastest movement" />
          <RateTimeGroup id="test-rate-1" title="Test Rate 1" />
          <RateTimeGroup id="test-rate-2" title="Test Rate 2" />
        </div>
      </div>
    </>
  )
}

export default App
