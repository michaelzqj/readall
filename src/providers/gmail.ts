import type { IEmailProvider } from './types';
import { waitForElement, simulateClick } from '../utils/dom';

export class GmailProvider implements IEmailProvider {
  name = 'Gmail';

  isApplicable(location: Location): boolean {
    return location.hostname.includes('mail.google.com');
  }

  async isReady(): Promise<boolean> {
    // Wait for the main table role to appear
    const mainTable = await waitForElement('table[role="grid"]', 5000);
    return !!mainTable;
  }

  async selectAll(): Promise<void> {
    console.log('Read All: Starting Bulk Selection Strategy...');

    // 1. Find the Master Checkbox
    const allCheckboxes = Array.from(document.querySelectorAll('[role="checkbox"]'));
    const toolbarCheckboxes = allCheckboxes.filter(cb => {
        if ((cb as HTMLElement).offsetParent === null) return false;
        if (cb.closest('table[role="grid"]')) return false;
        if (cb.closest('tr')) return false;
        return true;
    });
    toolbarCheckboxes.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    const masterCheckbox = toolbarCheckboxes[0];

    if (!masterCheckbox) throw new Error('Could not find toolbar checkbox.');

    // 2. Click Master Checkbox (Selects current page)
    if (masterCheckbox.getAttribute('aria-checked') !== 'true' && masterCheckbox.getAttribute('aria-checked') !== 'mixed') {
        simulateClick(masterCheckbox as HTMLElement);
        
        // Wait for selection to register
        await new Promise(r => setTimeout(r, 500));
    }

    // 3. Look for "Select all [number] conversations in Inbox" Banner
    // This is the key step for "All History"
    console.log('Read All: Checking for Bulk Select Banner...');
    
    // The banner usually appears in a notification area below the toolbar
    // We look for a span with role="link" or similar behavior that contains "Select all"
    // Note: In different languages "Select all" differs, but the structure is usually consistent.
    // It's often the *only* link in the 'v1' alert class, but classes change.
    
    // We try to find a link that looks like a bulk selector
    const links = Array.from(document.querySelectorAll('span[role="link"], div[role="link"]'));
    const bulkLink = links.find(el => {
        const text = el.textContent || '';
        // Heuristic: specific Gmail ID or text patterns
        return el.id === 'link_vsm' || (text.includes('Select all') && text.includes('conversation'));
    });

    if (bulkLink && (bulkLink as HTMLElement).offsetParent !== null) {
        console.log('Read All: Found Bulk Link! Clicking to select entire history...');
        simulateClick(bulkLink as HTMLElement);
        
        // Wait for the "All conversations selected" confirmation message
        await new Promise(r => setTimeout(r, 1000));
    } else {
        console.log('Read All: No bulk link found. Assuming clean inbox or < 50 items.');
    }
  }

  async markAsRead(): Promise<void> {
    // 1. Click "Mark as read"
    let markReadBtn = document.querySelector('div[role="button"][aria-label="Mark as read"]');
    if (!markReadBtn) {
         markReadBtn = document.querySelector('div[data-tooltip="Mark as read"]');
    }

    if (!markReadBtn) {
         // Try More menu logic
         const moreBtn = document.querySelector('div[role="button"][aria-label="More"]');
         if (moreBtn) {
            simulateClick(moreBtn as HTMLElement);
            await new Promise(r => setTimeout(r, 300));
            const menuItems = Array.from(document.querySelectorAll('div[role="menuitem"]'));
            const markReadItem = menuItems.find(el => el.textContent === 'Mark as read');
            if (markReadItem) {
                simulateClick(markReadItem as HTMLElement);
                // Handle modal after this
                await this.handleBulkModal();
                return;
            }
         }
         throw new Error('Could not find "Mark as read" button.');
    }

    simulateClick(markReadBtn as HTMLElement);
    
    // 2. Handle Potential "Bulk Action" Modal
    await this.handleBulkModal();
  }

  // Helper to click "OK" on the "This will affect all conversations" popup
  private async handleBulkModal(): Promise<void> {
      // Wait briefly to see if modal appears
      await new Promise(r => setTimeout(r, 1000));

      const modal = document.querySelector('div[role="alertdialog"]');
      if (modal) {
          console.log('Read All: Bulk Action Modal detected. Auto-confirming...');
          
          // Find the "OK" button. 
          // It's usually name="ok" or text "OK".
          const buttons = Array.from(modal.querySelectorAll('button'));
          const okBtn = buttons.find(b => b.name === 'ok' || b.textContent === 'OK');
          
          if (okBtn) {
              simulateClick(okBtn);
              // Wait for the heavy operation to start processing
              await new Promise(r => setTimeout(r, 2000));
          }
      }
  }

  async deselectAll(): Promise<void> {
    console.log('Read All: Starting Deselect Phase (Dropdown Strategy)...');
    
    // 1. Find the Master Checkbox (Anchor)
    const allCheckboxes = Array.from(document.querySelectorAll('[role="checkbox"]'));
    const toolbarCheckboxes = allCheckboxes.filter(cb => {
        if ((cb as HTMLElement).offsetParent === null) return false;
        if (cb.closest('table[role="grid"]')) return false;
        if (cb.closest('tr')) return false;
        return true;
    });
    toolbarCheckboxes.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    const masterCheckbox = toolbarCheckboxes[0];

    if (!masterCheckbox) {
         console.warn('Read All: Could not find master checkbox to locate dropdown.');
         return;
    }

    // 2. Find the "Select" Dropdown Triangle
    // It is usually a sibling of the checkbox, or in the same container.
    // It has aria-haspopup="true" and role="button" (or slightly different depending on version).
    const container = masterCheckbox.parentElement?.parentElement;
    if (!container) return;

    // Look for the element with popup capability
    const dropdownBtn = Array.from(container.querySelectorAll('[aria-haspopup="true"]'))
                             .find(el => el.getAttribute('role') === 'button' || el.getAttribute('role') === 'menuitem');
    
    if (dropdownBtn) {
        // Open the menu
        simulateClick(dropdownBtn as HTMLElement);
        await new Promise(r => setTimeout(r, 300)); // Wait for animation
        
        // 3. Find "None" option
        // We look for role="menuitem" with text "None"
        const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
        
        // Find the one that says "None" (English) or is the 2nd/3rd item? 
        // "None" is standard.
        const noneOption = menuItems.find(el => el.textContent === 'None');
        
        if (noneOption) {
            simulateClick(noneOption as HTMLElement);
            console.log('Read All: Clicked "None" in dropdown.');
            return;
        } else {
            console.warn('Read All: Could not find "None" option. Closing menu.');
            simulateClick(dropdownBtn as HTMLElement); // Close it
        }
    } else {
        console.warn('Read All: Could not find Dropdown button.');
    }

    // Fallback: If Dropdown failed, try the Checkbox click (The "Hail Mary")
    console.log('Read All: Falling back to checkbox click...');
    const state = masterCheckbox.getAttribute('aria-checked');
    if (state === 'true' || state === 'mixed') {
        simulateClick(masterCheckbox as HTMLElement);
        // If it was mixed, it might have become 'true' (selected all). Check and click again.
        await new Promise(r => setTimeout(r, 500));
        if (masterCheckbox.getAttribute('aria-checked') === 'true') {
             simulateClick(masterCheckbox as HTMLElement);
        }
    }
  }
}
