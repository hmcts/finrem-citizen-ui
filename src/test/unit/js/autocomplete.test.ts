/**
 * @jest-environment jsdom
 */

type SourceFn = (query: string, populateResults: (results: string[]) => void) => Promise<void> | void;

let capturedSource: SourceFn | null = null;

const DUMMY_QUERY_DATA = [
  { id: 1, label: 'Bank statements', value: 'bank-statements' },
  { id: 2, label: 'Payslips', value: 'payslips' }
]

jest.mock('accessible-autocomplete', () => {
  return jest.fn((options: { source: SourceFn }) => {
    capturedSource = options.source;
  });
});

describe('autocomplete caching', () => {
  beforeEach(() => {
    jest.resetModules();
    capturedSource = null;
    document.body.innerHTML = `
      <div data-autocomplete>
        <div id="document-type-container"></div>
      </div>
    `;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  async function initAndGetSource(): Promise<SourceFn> {
    const { initAutocomplete } = await import('../../../main/js/autocomplete');
    initAutocomplete();

    if (!capturedSource) {
      throw new Error('Expected source callback to be configured');
    }

    return capturedSource;
  }

  it('caches empty query results', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => DUMMY_QUERY_DATA,
    } as Response);

    const source = await initAndGetSource();

    await source('', jest.fn());
    await source('', jest.fn());

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent requests', async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    const fetchPromise = new Promise<Response>(resolve => {
      resolveFetch = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

    const source = await initAndGetSource();

    const firstCall = source('', jest.fn());
    const secondCall = source('', jest.fn());

    expect(global.fetch).toHaveBeenCalledTimes(1);

    if (!resolveFetch) {
      throw new Error('Expected fetch resolver to be set');
    }

    const resolver = resolveFetch as (value: Response) => void;

    resolver({
      ok: true,
      json: async () => DUMMY_QUERY_DATA,
    } as Response);

    await Promise.all([firstCall, secondCall]);
  });

  it('clears empty query cache when document types change', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => DUMMY_QUERY_DATA,
    } as Response);

    const source = await initAndGetSource();

    await source('', jest.fn());
    document.dispatchEvent(new CustomEvent('document-types:changed', { bubbles: true }));
    await source('', jest.fn());

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('does not cache non-empty query results', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => DUMMY_QUERY_DATA,
    } as Response);

    const source = await initAndGetSource();

    await source('bank', jest.fn());
    await source('bank', jest.fn());

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
