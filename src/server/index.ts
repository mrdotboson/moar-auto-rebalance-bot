import 'dotenv/config';
import { createServer } from './api.js';

const PORT = Number(process.env.PORT ?? 5173);

createServer().then((app) => {
  app.listen({ host: '0.0.0.0', port: PORT })
    .then(() => console.log(`server on http://localhost:${PORT}`))
    .catch((err) => { console.error(err); process.exit(1); });
});


