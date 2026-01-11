# Read All - Email Mark as Read Extension

A lightweight Chrome Extension that helps you quickly mark unread emails as read across mainstream email services (Gmail, Outlook, Yahoo) with a single click.

## Features

- **One-Click Mark All Read**: Injects a Floating Action Button (FAB) into your email page.
- **Smart Selection**: Intelligently selects only unread emails to avoid bulk-action warnings on massive inboxes.
- **Auto-Cleanup**: Automatically deselects all conversations after the action is complete.
- **Privacy Focused**: Operates entirely in your browser; no data is sent to external servers.
- **Multi-Service Support**: Works on:
  - Gmail (`mail.google.com`)
  - Outlook (`outlook.live.com`, `outlook.office365.com`)
  - Yahoo Mail (`mail.yahoo.com`)

## Installation Instructions

Since this is a developer version, you must load it as an "Unpacked" extension:

### 1. Build the Extension
If you are working with the source code, ensure you have built the production files:
```bash
npm install
npm run build
```
This will create a `dist/` folder in the project directory.

### 2. Load into Chrome
1.  Open Google Chrome.
2.  In the address bar, type `chrome://extensions/` and press **Enter**.
3.  In the top-right corner, toggle **Developer mode** to **ON**.
4.  Click the **Load unpacked** button that appears in the top-left.
5.  Navigate to and select the **`dist`** folder within this project directory.

## How to Use

1.  Open your preferred email service (e.g., [Gmail](https://mail.google.com)).
2.  Look for the blue circular icon with a double-checkmark (**✓✓**) in the **bottom-right corner** of the page.
3.  Click the **Mark All Read** button.
4.  The button will show "Processing..." while it:
    - Selects unread emails.
    - Marks them as read.
    - Deselects the emails to leave your inbox clean.

## Tech Stack

- **TypeScript**: For robust, type-safe logic.
- **Vite**: Modern frontend tooling for fast builds.
- **CRXJS**: Vite plugin for seamless Chrome Extension development.
- **Shadow DOM**: Used for the UI to prevent style conflicts with email providers.

## Development

To run the extension in development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

Then load the `dist` folder into Chrome as described above. Changes you make to the code will reflect in the browser instantly.
