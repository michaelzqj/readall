import type { IEmailProvider } from './types';
import { waitForElement, simulateClick } from '../utils/dom';

export class OutlookProvider implements IEmailProvider {
  name = 'Outlook';

  isApplicable(location: Location): boolean {
    return location.hostname.includes('outlook.live.com') || location.hostname.includes('outlook.office365.com');
  }

  async isReady(): Promise<boolean> {
    const list = await waitForElement('[role="listbox"]', 5000) || await waitForElement('[role="grid"]', 5000);
    return !!list;
  }

  async selectAll(): Promise<void> {
    // Outlook has a "Select All" checkbox in the header.
    // It often has a title "Select all" or aria-label.
    const selectAllCheckbox = await waitForElement('div[role="checkbox"][title*="Select all"]');
    
    if (selectAllCheckbox && selectAllCheckbox.getAttribute('aria-checked') !== 'true') {
      simulateClick(selectAllCheckbox);
    } else {
        // Fallback: Try identifying by icon name if the title changes
        const checkIcon = document.querySelector('i[data-icon-name="CircleRing"]');
        if (checkIcon) {
             // The click usually needs to be on the parent container
             const container = checkIcon.closest('div[role="checkbox"]');
             if (container) simulateClick(container as HTMLElement);
        }
    }
  }

  async markAsRead(): Promise<void> {
    // Outlook toolbar changes dynamically.
    // Look for button with specific title or name.
    const markReadBtn = await waitForElement('button[name="Mark as read"]');
    
    if (markReadBtn) {
      simulateClick(markReadBtn);
    } else {
        // Sometimes it's an icon in the top bar
        const markReadIcon = document.querySelector('button i[data-icon-name="Read"]');
        if (markReadIcon) {
            simulateClick(markReadIcon.closest('button') as HTMLElement);
        }
    }
  }

  async deselectAll(): Promise<void> {
    const selectAllCheckbox = document.querySelector('div[role="checkbox"][title*="Select all"]');
    if (selectAllCheckbox && selectAllCheckbox.getAttribute('aria-checked') === 'true') {
      simulateClick(selectAllCheckbox as HTMLElement);
    }
  }
}
