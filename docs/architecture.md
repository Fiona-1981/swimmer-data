Big button interface for easy input by coaches on poolside. 


```mermaid
flowchart TD
    A[Big button interface] --> B[Save data locally]
    B --> C[(DynamoDB)]
    C --> D[Retrieve data]
    D --> E[Generate graphs]
```