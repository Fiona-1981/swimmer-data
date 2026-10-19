// A swimmer a coach can record reps for.
export type Swimmer = {
  id: string // lowercase letters, digits and hyphens, as the backend requires
  name: string
}

// Stand-ins until coaches can manage their own swimmers. The test- prefix
// marks them as test data in the database. Names are the IDs for now.
const MOCK_SWIMMERS: Swimmer[] = [
  { id: "test-fiona", name: "test-fiona" },
  { id: "test-adam", name: "test-adam" },
  { id: "test-kate", name: "test-kate" },
]

// Async so callers already await them, as they will once these call the
// API. Swapping the bodies for fetch() then won't change any caller.
export async function getSwimmers(): Promise<Swimmer[]> {
  // A copy, like a fresh API response, so callers can't change the mock.
  return [...MOCK_SWIMMERS]
}

// undefined when no swimmer has that ID, as an API's "not found" would be.
export async function getSwimmer(id: string): Promise<Swimmer | undefined> {
  return MOCK_SWIMMERS.find((swimmer) => swimmer.id === id)
}
