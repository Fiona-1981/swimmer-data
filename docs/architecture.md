Big button interface for easy input by coaches on poolside. 


```mermaid
flowchart TD
    A[Big button interface] --> B[Save data locally]
    B --> C[(DynamoDB)]
    C --> D[Retrieve data]
    D --> E[Generate graphs]
```


“Users: coaches only for the prototype. Parked: parents (data entry for own child; would reuse the coach–swimmer link pattern) and swimmers (MySwimPro etc. cover this). Media: optional and consent-gated; presigned POST to private S3; after auth.”

Maybe: “Later (after auth): per-coach custom protocol buttons, stored as data. Each has a stable ID, a renameable label and an optional base category, so history and cross-coach analysis stay intact. Coaches can reorder and hide buttons.”