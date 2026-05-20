interface SelectedDocument {
  id: number;
  label: string;
  value: string;
}

class DocumentSelectionManager {
  private documents: SelectedDocument[] = [];
  private selectedDocument: SelectedDocument | null = null;
  private container: HTMLElement | null = null;
  private addButton: HTMLButtonElement | null = null;
  private hiddenInput: HTMLInputElement | null = null;
  private documentsList: HTMLElement | null = null;
  private noDocumentsMessage: HTMLElement | null = null;

  constructor() {
    this.container = document.querySelector('[data-document-selection]');
    if (!this.container) {
      return;
    }

    this.addButton = this.container.querySelector('[data-add-document]');
    this.hiddenInput = this.container.querySelector('[name="documentsJson"]');
    this.documentsList = this.container.querySelector('[data-documents-list]');
    this.noDocumentsMessage = this.container.querySelector('[data-no-documents]');

    this.initializeFromSession();
    this.setupEventListeners();
    this.render();
  }

  private initializeFromSession(): void {
    if (this.hiddenInput && this.hiddenInput.value) {
      try {
        this.documents = JSON.parse(this.hiddenInput.value);
      } catch {
        this.documents = [];
      }
    }
  }

  private setupEventListeners(): void {
    document.addEventListener('document:selected', (event: Event) => {
      const customEvent = event as CustomEvent<SelectedDocument>;
      this.selectedDocument = customEvent.detail;
    });

    if (this.addButton) {
      this.addButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.addDocument();
      });
    }
  }

  private async addDocument(): Promise<void> {
    if (!this.selectedDocument) {
      return;
    }

    try {
      const response = await fetch('/upload/document-selection/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.selectedDocument),
      });

      if (!response.ok) {
        throw new Error('Failed to add document');
      }

      const data = await response.json();
      this.documents = data.documents;
      this.selectedDocument = null;
      
      this.clearAutocompleteInput();
      this.updateHiddenInput();
      this.render();
    } catch (error) {
      console.error('Error adding document:', error);
    }
  }

  private clearAutocompleteInput(): void {
    const autocompleteInput = document.querySelector('#document-type') as HTMLInputElement;
    if (autocompleteInput) {
      autocompleteInput.value = '';
    }
  }

  private async removeDocument(index: number): Promise<void> {
    try {
      const response = await fetch(`/upload/document-selection/remove/${index}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove document');
      }

      const data = await response.json();
      this.documents = data.documents;
      this.updateHiddenInput();
      this.render();
    } catch (error) {
      console.error('Error removing document:', error);
    }
  }

  private updateHiddenInput(): void {
    if (this.hiddenInput) {
      this.hiddenInput.value = JSON.stringify(this.documents);
    }
  }

  private render(): void {
    if (!this.documentsList || !this.noDocumentsMessage) {
      return;
    }

    if (this.documents.length === 0) {
      this.noDocumentsMessage.style.display = 'block';
      this.documentsList.innerHTML = '';
      return;
    }

    this.noDocumentsMessage.style.display = 'none';
    
    const listHtml = this.documents.map((doc, index) => `
      <div class="govuk-summary-list__row">
        <dt class="govuk-summary-list__value">
          ${this.escapeHtml(doc.label)}
        </dt>
        <dd class="govuk-summary-list__actions">
          <a href="#" class="govuk-link" data-remove-document="${index}">
            Remove<span class="govuk-visually-hidden"> ${this.escapeHtml(doc.label)}</span>
          </a>
        </dd>
      </div>
    `).join('');

    this.documentsList.innerHTML = `
      <dl class="govuk-summary-list">
        ${listHtml}
      </dl>
    `;

    this.documentsList.querySelectorAll('[data-remove-document]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt((e.currentTarget as HTMLElement).getAttribute('data-remove-document') || '0');
        this.removeDocument(index);
      });
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

function initDocumentSelection(): void {
  if (document.querySelector('[data-document-selection]')) {
    new DocumentSelectionManager();
  }
}

export { initDocumentSelection };
