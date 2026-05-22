/**
 * @jest-environment jsdom
 */
import { initDocumentTypeSelection } from '../../../main/DocumentType/document-type-selection';

describe('document-type-selection', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-document-type-selection>
        <button type="button" data-add-document-type>Add</button>
        <input type="hidden" name="documentsJson" value="" />
        <p data-no-document-types style="display: block;">No documents</p>
        <div data-document-types-list></div>
      </div>
      <input id="document-type" type="text" />
    `;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('initDocumentTypeSelection', () => {
    it('should not initialize when container is missing', () => {
      document.body.innerHTML = '';
      expect(() => initDocumentTypeSelection()).not.toThrow();
    });

    it('should initialize with empty list', () => {
      initDocumentTypeSelection();
      const noMessage = document.querySelector('[data-no-document-types]') as HTMLElement;
      expect(noMessage.style.display).toBe('block');
    });

    it('should initialize from session data', () => {
      const hiddenInput = document.querySelector('[name="documentsJson"]') as HTMLInputElement;
      hiddenInput.value = JSON.stringify([{ id: 1, label: 'Payslips', value: 'payslips' }]);
      
      initDocumentTypeSelection();
      
      const list = document.querySelector('[data-document-types-list]') as HTMLElement;
      expect(list.innerHTML).toContain('Payslips');
    });

    it('should handle invalid JSON gracefully', () => {
      const hiddenInput = document.querySelector('[name="documentsJson"]') as HTMLInputElement;
      hiddenInput.value = 'invalid json';
      
      initDocumentTypeSelection();
      
      const noMessage = document.querySelector('[data-no-document-types]') as HTMLElement;
      expect(noMessage.style.display).toBe('block');
    });
  });

  describe('add document type', () => {
    it('should add document type on button click', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ documents: [{ id: 1, label: 'Payslips', value: 'payslips' }] }),
      } as Response);

      initDocumentTypeSelection();

      const event = new CustomEvent('document:selected', {
        detail: { id: 1, label: 'Payslips', value: 'payslips' },
      });
      document.dispatchEvent(event);

      const button = document.querySelector('[data-add-document-type]') as HTMLButtonElement;
      button.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith(
        '/upload/document-type-selection/add',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should not add when no document selected', () => {
      initDocumentTypeSelection();
      const button = document.querySelector('[data-add-document-type]') as HTMLButtonElement;
      button.click();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false } as Response);

      initDocumentTypeSelection();

      const event = new CustomEvent('document:selected', {
        detail: { id: 1, label: 'Test', value: 'test' },
      });
      document.dispatchEvent(event);

      const button = document.querySelector('[data-add-document-type]') as HTMLButtonElement;
      button.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should clear autocomplete input after adding', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ documents: [{ id: 1, label: 'Test', value: 'test' }] }),
      } as Response);

      initDocumentTypeSelection();

      const autocomplete = document.querySelector('#document-type') as HTMLInputElement;
      autocomplete.value = 'test';

      const event = new CustomEvent('document:selected', {
        detail: { id: 1, label: 'Test', value: 'test' },
      });
      document.dispatchEvent(event);

      const button = document.querySelector('[data-add-document-type]') as HTMLButtonElement;
      button.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(autocomplete.value).toBe('');
    });

    it('should handle missing autocomplete input gracefully', async () => {
      document.body.innerHTML = `
        <div data-document-type-selection>
          <button type="button" data-add-document-type>Add</button>
          <input type="hidden" name="documentsJson" value="" />
          <p data-no-document-types style="display: block;">No documents</p>
          <div data-document-types-list></div>
        </div>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ documents: [{ id: 1, label: 'Test', value: 'test' }] }),
      } as Response);

      initDocumentTypeSelection();

      const event = new CustomEvent('document:selected', {
        detail: { id: 1, label: 'Test', value: 'test' },
      });
      document.dispatchEvent(event);

      const button = document.querySelector('[data-add-document-type]') as HTMLButtonElement;
      button.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('remove document type', () => {
    it('should remove document type on link click', async () => {
      const hiddenInput = document.querySelector('[name="documentsJson"]') as HTMLInputElement;
      hiddenInput.value = JSON.stringify([{ id: 1, label: 'Payslips', value: 'payslips' }]);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ documents: [] }),
      } as Response);

      initDocumentTypeSelection();

      const removeLink = document.querySelector('[data-remove-document-type]') as HTMLAnchorElement;
      removeLink.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith(
        '/upload/document-type-selection/remove/0',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle remove error', async () => {
      const hiddenInput = document.querySelector('[name="documentsJson"]') as HTMLInputElement;
      hiddenInput.value = JSON.stringify([{ id: 1, label: 'Test', value: 'test' }]);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false } as Response);

      initDocumentTypeSelection();

      const removeLink = document.querySelector('[data-remove-document-type]') as HTMLAnchorElement;
      removeLink.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('should not render when required elements are missing', () => {
      document.body.innerHTML = `
        <div data-document-type-selection>
          <button type="button" data-add-document-type>Add</button>
          <input type="hidden" name="documentsJson" value="" />
        </div>
      `;
      expect(() => initDocumentTypeSelection()).not.toThrow();
    });

    it('should show no documents message when empty', () => {
      initDocumentTypeSelection();
      const noMessage = document.querySelector('[data-no-document-types]') as HTMLElement;
      const list = document.querySelector('[data-document-types-list]') as HTMLElement;
      
      expect(noMessage.style.display).toBe('block');
      expect(list.innerHTML).toBe('');
    });

    it('should render document list', () => {
      const hiddenInput = document.querySelector('[name="documentsJson"]') as HTMLInputElement;
      hiddenInput.value = JSON.stringify([
        { id: 1, label: 'Payslips', value: 'payslips' },
        { id: 2, label: 'Bank Statements', value: 'bank' },
      ]);

      initDocumentTypeSelection();

      const list = document.querySelector('[data-document-types-list]') as HTMLElement;
      expect(list.innerHTML).toContain('Payslips');
      expect(list.innerHTML).toContain('Bank Statements');
    });

    it('should escape HTML in labels', () => {
      const hiddenInput = document.querySelector('[name="documentsJson"]') as HTMLInputElement;
      hiddenInput.value = JSON.stringify([
        { id: 1, label: '<script>alert("xss")</script>', value: 'xss' },
      ]);

      initDocumentTypeSelection();

      const list = document.querySelector('[data-document-types-list]') as HTMLElement;
      expect(list.innerHTML).toContain('&lt;script&gt;');
      expect(list.innerHTML).not.toContain('<script>alert("xss")</script>');
    });
  });

  describe('updateHiddenInput', () => {
    it('should update hidden input after add', async () => {
      const doc = { id: 1, label: 'Test', value: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ documents: [doc] }),
      } as Response);

      initDocumentTypeSelection();

      const event = new CustomEvent('document:selected', { detail: doc });
      document.dispatchEvent(event);

      const button = document.querySelector('[data-add-document-type]') as HTMLButtonElement;
      button.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      const hiddenInput = document.querySelector('[name="documentsJson"]') as HTMLInputElement;
      expect(JSON.parse(hiddenInput.value)).toEqual([doc]);
    });
  });
});
