
# Class `Pinecone`

The `Pinecone` class is the main entry point to this SDK. You will use instances of it to create and manage indexes as well as perform data operations on those indexes after they are created.

---

## Initializing the Client

There is one piece of configuration required to use the Pinecone client: an API key. This value can be passed using environment variables or in code through a configuration object.  

Find your API key in the console dashboard at [https://app.pinecone.io](https://app.pinecone.io).

---

## Using Environment Variables

The environment variables used to configure the client are the following:

```bash
export PINECONE_API_KEY="your_api_key"
export PINECONE_CONTROLLER_HOST="your_controller_host"
```

When these environment variables are set, the client constructor does not require any additional arguments.

```javascript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone();
```

---

## Using a Configuration Object

If you prefer to pass configuration in code, the constructor accepts a config object containing the `apiKey` and `environment` values.  

This could be useful if your application needs to interact with multiple projects, each with a different configuration.

```javascript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: 'your_api_key',
});
```
