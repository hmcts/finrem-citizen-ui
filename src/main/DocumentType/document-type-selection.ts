import { getLogger } from '../assets/js/logger';

interface SelectedDocumentType {
  id: number;
  label: string;
  value: string;
}

const logger = getLogger('document-type-selection');

class DocumentTypeSelectionManager {
  private documentTypes: SelectedDocumentType[] = [];
  private selectedDocumentType: SelectedDocumentType | null = null;
  private container: HTMLElement | null = null;
  private addButton: HTMLButtonElement | null = null;
  private hiddenInput: HTMLInputElement | null = null;
  private documentTypesList: HTMLElement | null = null;
  private noDocumentTypesMessage: HTMLElement | null = null;

  constructor() {
    this.container = document.querySelector('[data-document-type-selection]');
    if (!this.container) {
      return;
    }

    this.addButton = this.container.querySelector('[data-add-document-type]');
    this.hiddenInput = this.container.querySelector('[name="documentsJson"]');
    this.documentTypesList = this.container.querySelector('[data-document-types-list]');
    this.noDocumentTypesMessage = this.container.querySelector('[data-no-document-types]');

    this.initializeFromSession();
    this.setupEventListeners();
    this.render();
  }

  private initializeFromSession(): void {
    if (this.hiddenInput && this.hiddenInput.value) {
      try {
        this.documentTypes = JSON.parse(this.hiddenInput.value);
      } catch {
        this.documentTypes = [];
      }
    }
  }

  private setupEventListeners(): void {
    document.addEventListener('document:selected', (event: Event) => {
      const customEvent = event as CustomEvent<SelectedDocumentType>;
      this.selectedDocumentType = customEvent.detail;
    });

    if (this.addButton) {
      this.addButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.addDocumentType();
      });
    }
  }

  private async addDocumentType(): Promise<void> {
    if (!this.selectedDocumentType) {
      return;
    }

    try {
      const response = await fetch('/upload/document-type-selection/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.selectedDocumentType),
      });

      if (!response.ok) {
        throw new Error('Failed to add document type');
      }

      const data = await response.json();
      this.documentTypes = data.documents;
      this.selectedDocumentType = null;
      
      this.clearAutocompleteInput();
      this.updateHiddenInput();
      this.render();
    } catch (error) {
      logger.error('Error adding document type:', error);
    }
  }

  private clearAutocompleteInput(): void {
    const autocompleteInput = document.querySelector('#document-type') as HTMLInputElement;
    if (autocompleteInput) {
      autocompleteInput.value = '';
    }
  }

  private async removeDocumentType(index: number): Promise<void> {
    try {
      const response = await fetch(`/upload/document-type-selection/remove/${index}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove document type');
      }

      const data = await response.json();
      this.documentTypes = data.documents;
      this.updateHiddenInput();
      this.render();
    } catch (error) {
      logger.error('Error removing document type:', error);
    }
  }

  private updateHiddenInput(): void {
    if (this.hiddenInput) {
      this.hiddenInput.value = JSON.stringify(this.documentTypes);
    }
  }

  private render(): void {
    if (!this.documentTypesList || !this.noDocumentTypesMessage) {
      return;
    }

    if (this.documentTypes.length === 0) {
      this.noDocumentTypesMessage.style.display = 'block';
      this.documentTypesList.innerHTML = '';
      return;
    }

    this.noDocumentTypesMessage.style.display = 'none';
    
    const listHtml = this.documentTypes.map((doc, index) => `
      <div class="govuk-summary-list__row">
        <dt class="govuk-summary-list__value">
          ${this.escapeHtml(doc.label)}
        </dt>
        <dd class="govuk-summary-list__actions">
          <a href="#" class="govuk-link" data-remove-document-type="${index}">
            Remove<span class="govuk-visually-hidden"> ${this.escapeHtml(doc.label)}</span>
          </a>
        </dd>
      </div>
    `).join('');

    this.documentTypesList.innerHTML = `
      <dl class="govuk-summary-list">
        ${listHtml}
      </dl>
    `;

    this.documentTypesList.querySelectorAll('[data-remove-document-type]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt((e.currentTarget as HTMLElement).getAttribute('data-remove-document-type') || '0');
        this.removeDocumentType(index);
      });
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

function initDocumentTypeSelection(): void {
  if (document.querySelector('[data-document-type-selection]')) {
    new DocumentTypeSelectionManager();
  }
}

export { initDocumentTypeSelection };
