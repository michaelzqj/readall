export class FloatingButton {
  private shadowRoot: ShadowRoot;
  private button: HTMLButtonElement;
  private container: HTMLDivElement;
  private onClick: () => void;

  constructor(onClick: () => void) {
    this.onClick = onClick;
    this.container = document.createElement('div');
    this.container.id = 'read-all-extension-root';
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });
    this.button = document.createElement('button');
    this.render();
  }

  public mount() {
    if (!document.getElementById('read-all-extension-root')) {
      document.body.appendChild(this.container);
    }
  }

  public setLoading(isLoading: boolean) {
    if (isLoading) {
      this.button.classList.add('loading');
      this.button.disabled = true;
      this.button.innerHTML = `
        <span class="spinner"></span>
        <span>Processing...</span>
      `;
    } else {
      this.button.classList.remove('loading');
      this.button.disabled = false;
      this.button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Mark All Read</span>
      `;
    }
  }

  private render() {
    // Basic CSS Reset for the shadow DOM + Button Styles
    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
        z-index: 2147483647; /* Max Z-Index to stay on top */
        position: fixed;
        bottom: 24px;
        right: 24px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      button {
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: #0b57d0; /* Gmail Blue */
        color: white;
        border: none;
        border-radius: 16px;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: transform 0.2s, background-color 0.2s;
        outline: none;
      }

      button:hover {
        background-color: #0842a0;
        transform: translateY(-2px);
      }

      button:active {
        transform: translateY(0);
      }

      button.loading {
        background-color: #5f6368;
        cursor: wait;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;

    this.button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onClick();
    });
    
    // Set initial content
    this.setLoading(false);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(this.button);
  }
}
