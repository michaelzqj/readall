export interface IEmailProvider {
  /**
   * The display name of the provider (e.g., "Gmail").
   */
  name: string;

  /**
   * Checks if the provider matches the current URL.
   * @param location The window.location object.
   */
  isApplicable(location: Location): boolean;

  /**
   * Checks if the main email list DOM is fully loaded and interactive.
   * This is crucial for SPAs where the URL changes but content loads later.
   */
  isReady(): Promise<boolean>;

  /**
   * Performs the "Select All" action.
   * Should handle both the "select visible" checkbox and the "Select all conversations" link if available.
   */
  selectAll(): Promise<void>;

  /**
   * Triggers the "Mark as Read" action.
   */
  markAsRead(): Promise<void>;

  /**
   * Deselects any currently selected emails.
   */
  deselectAll(): Promise<void>;
}
