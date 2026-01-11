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
    // Strategy: Try to select ONLY unread emails first (User Request).
    // This avoids "Select All" warning for massive inboxes.
    
    // 1. Locate the Toolbar
    // We reuse the logic to find the toolbar area via the Master Checkbox heuristic
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
        throw new Error('Could not find the toolbar.');
    }

    const toolbarContainer = masterCheckbox.parentElement?.parentElement;
    
    // 2. Try to find the "Select" Dropdown Arrow (Triangle)
    // It's usually a button next to the checkbox with aria-haspopup="true" or similar.
    // In standard Gmail, it's often a div with role="button" and aria-label="Select" 
    // sitting right next to the checkbox div.
    let dropdownBtn: HTMLElement | null = null;
    
    if (toolbarContainer) {
        dropdownBtn = toolbarContainer.querySelector('div[role="button"][aria-label*="Select"]') as HTMLElement;
        // Verify it's not the checkbox itself (sometimes they share labels)
        if (dropdownBtn === masterCheckbox) {
            // Look for siblings
            dropdownBtn = toolbarContainer.querySelector('div[role="menuitem"]') ? null : // sanity check
                          Array.from(toolbarContainer.querySelectorAll('div[role="button"]'))
                            .find(el => el !== masterCheckbox) as HTMLElement;
        }
    }

    let unreadSelected = false;

    if (dropdownBtn) {
        // Try the Dropdown -> "Unread" flow
        simulateClick(dropdownBtn);
        await new Promise(r => setTimeout(r, 200)); // Wait for menu
        
        // Find "Unread" menu item
        // Common logic: role="menuitem", text content "Unread"
        // We also check for "Unread" in other languages or by position (usually 4th) if we wanted to be fancy.
        // For now, English "Unread" is the target.
        const menuItems = Array.from(document.querySelectorAll('div[role="menuitem"]'));
        const unreadItem = menuItems.find(el => el.textContent === 'Unread');
        
        if (unreadItem) {
            simulateClick(unreadItem as HTMLElement);
            console.log('Read All: Selected "Unread" via dropdown.');
            unreadSelected = true;
            // Wait for selection to apply
             await new Promise(r => setTimeout(r, 500));
        } else {
            // Close menu if failed
            simulateClick(dropdownBtn); 
        }
    }

    // 3. Fallback: Click the Master Checkbox (Select All Visible)
    // If we couldn't do the fancy "Unread Only" selection, we just select the current page.
    if (!unreadSelected) {
        console.log('Read All: "Unread" option not found, falling back to Select All Visible.');
        
        if (masterCheckbox.getAttribute('aria-checked') !== 'true' && masterCheckbox.getAttribute('aria-checked') !== 'mixed') {
            simulateClick(masterCheckbox as HTMLElement);
            
            // Wait for verification
            let retries = 0;
            while (retries < 10) {
                await new Promise(r => setTimeout(r, 200));
                const state = masterCheckbox.getAttribute('aria-checked');
                if (state === 'true' || state === 'mixed') break;
                retries++;
            }
        }
    }

    // REMOVED: The "Select all [number] conversations" logic.
    // This was causing the "Action will affect 45,000 conversations" popup.
    // By removing it, we only act on the loaded emails (safe).
  }

  async markAsRead(): Promise<void> {
    // Strategy: Find "Mark as read" button.
    // 1. Try English label
    let markReadBtn = document.querySelector('div[role="button"][aria-label="Mark as read"]');
    
    // 2. Try Tooltip (sometimes differs)
    if (!markReadBtn) {
        markReadBtn = document.querySelector('div[data-tooltip="Mark as read"]');
    }

    // 3. Fallback: Look for the specific Icon (SVG path) if possible, or try the "More" menu.
    // If we can't find the direct button, we try the "More" menu.
    if (!markReadBtn) {
        const moreBtn = document.querySelector('div[role="button"][aria-label="More"]') || 
                        document.querySelector('div[role="button"][data-tooltip="More"]');
                        
        if (moreBtn) {
            simulateClick(moreBtn as HTMLElement);
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // In the menu, find "Mark as read"
            const menuItems = document.querySelectorAll('div[role="menuitem"]');
            // This IS text dependent. 
            const markReadItem = Array.from(menuItems).find(el => 
                el.textContent === 'Mark as read' || 
                el.textContent === 'Mark as Read'
            );
            
            if (markReadItem) {
                simulateClick(markReadItem as HTMLElement);
                return;
            }
        }
    }

    if (markReadBtn) {
        simulateClick(markReadBtn as HTMLElement);
    } else {
        throw new Error('Could not find "Mark as read" button. Is your Gmail in English?');
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
