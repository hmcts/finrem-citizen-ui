import { createServer } from 'http';

import { createMockCaseApiApp } from './app';

const port = parseInt(process.env.MOCK_CASE_API_PORT || '4100', 10);
const app = createMockCaseApiApp();

createServer(app).listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock case API listening on http://localhost:${port}`);
});
