import axios from 'axios';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

const axiosConfig = {
  headers: { 'Accept-Encoding': 'gzip' },
  maxRedirects: 0,
  // We allow 200 (OK) or 302 (Redirect, e.g., to a login page)
  validateStatus: (status: number) => status === 200 || status === 302,
};

describe('Smoke Test - Page Availability', () => {
  test('Home page loads', async () => {
    const response = await axios.get(`${testUrl}/`, axiosConfig);
    expect([200, 302]).toContain(response.status);
  });

  test('Enter Case Number page loads', async () => {
    const response = await axios.get(`${testUrl}/enter-case-number`, axiosConfig);
    expect([200, 302]).toContain(response.status);
  });

  test('Enter Access Code page loads', async () => {
    const response = await axios.get(`${testUrl}/enter-access-code`, axiosConfig);
    expect([200, 302]).toContain(response.status);
  });
});
