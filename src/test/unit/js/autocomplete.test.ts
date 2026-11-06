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

  it('clears empty query cache when selected document types change', async () => {
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
});
