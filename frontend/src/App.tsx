import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"

function App() {
  return (
    <>
      <div className="flex min-h-svh flex-col items-center justify-center">
        <Button>Woohoo!</Button>
        <Button>Another button</Button>
        <Button>Woohoo!</Button>
        <Field>
          <FieldLabel htmlFor="input-demo-api-key">All out rate</FieldLabel>
          <Input id="input-demo-api-key" type="password" placeholder="Rate" />
          {/* <FieldDescription>
            A field description can go here.
          </FieldDescription> */}
        </Field>
        <Field>
          <FieldLabel htmlFor="input-demo-api-key">All out time</FieldLabel>
          <Input id="input-demo-api-key" type="password" placeholder="Time" />
        </Field>
      </div>
    </>
  )
}

export default App