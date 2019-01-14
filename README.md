# How to use

```
import * as refParser from 'json-schema-ref-parser'
import JsonSchemaTypescriptResolver from 'json-schema-typescript-resolver'

refParser.bundle({
    $ref: 'src/users.ts#/definitions/User'
}, { resolve: { ts: new JsonSchemaTypescriptResolver }})
```