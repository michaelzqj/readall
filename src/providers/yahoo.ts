import type { IEmailProvider } from './types';
import { waitForElement, simulateClick } from '../utils/dom';

export class YahooProvider implements IEmailProvider {
  name = 'Yahoo';

  isApplicable(location: Location): boolean {
    return location.hostname.includes('mail.yahoo.com');
  }

  async isReady(): Promise<boolean> {
    const list = await waitForElement('div[data-test-id="virtual-list"]', 5000);
    return !!list;
  }

  async selectAll(): Promise<void> {
    // Yahoo often puts the checkbox in a button wrapper
    const selectAllBtn = await waitForElement('button[data-test-id="checkbox-select-all"]');
    if (selectAllBtn) {
        // Check if already selected? Yahoo's checkbox state is visually indicated by svg change.
        // But clicking it usually cycles: Select All -> Deselect All.
        // We assume we are starting from a state where we want to select.
        simulateClick(selectAllBtn);
    }
  }

  async markAsRead(): Promise<void> {
    // Look for the "Mark as read" action in the toolbar
    // Sometimes it is inside a "More" dropdown if the screen is small, but usually visible.
    
    // Attempt 1: Visible toolbar button
    let markReadBtn = document.querySelector('button[title="Mark as read"]');
    
    // Attempt 2: "k" shortcut is native to Yahoo, but we want click simulation.
    // Let's look for data-test-id
    if (!markReadBtn) {
        markReadBtn = document.querySelector('button[data-test-id="toolbar-mark-read"]');
    }

    if (markReadBtn) {
        simulateClick(markReadBtn as HTMLElement);
    }
  }

  async deselectAll(): Promise<void> {
    const selectAllBtn = document.querySelector('button[data-test-id="checkbox-select-all"]');
    if (selectAllBtn) {
        // Yahoo usually toggles. Assuming it is currently selected.
        simulateClick(selectAllBtn as HTMLElement);
    }
  }
}
