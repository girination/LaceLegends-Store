# Supabase server usage examples

This file shows examples of how to use the Service Role key on the server-side. **Never** use the service role key on the browser.

## Express example

```js
// server/index.js
import express from 'express';
import { supabaseAdmin } from '../../src/lib/supabaseServer';

const app = express();
app.get('/api/orders', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('orders').select('*');
  if (error) return res.status(500).json({ error });
  return res.json({ data });
});

app.listen(3000);
```

## Serverless function (e.g., Vercel / Netlify)

```js
// api/orders.js (serverless)
import { supabaseAdmin } from '../../src/lib/supabaseServer';

export default async function handler(req, res) {
  const { data, error } = await supabaseAdmin.from('orders').select('*');
  if (error) return res.status(500).json({ error });
  return res.status(200).json({ data });
}
```

## Important security notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` in your hosting provider's secrets (do not store it in client code or in a public repo).
- Rotate keys immediately if they have been exposed.
