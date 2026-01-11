import { GmailProvider } from '../providers/gmail';
import { OutlookProvider } from '../providers/outlook';
import { YahooProvider } from '../providers/yahoo';
import { FloatingButton } from '../ui/FloatingButton';

const providers = [
  new GmailProvider(),
  new OutlookProvider(),
  new YahooProvider(),
];

async function init() {
  const matchingProvider = providers.find(p => p.isApplicable(window.location));

  if (!matchingProvider) {
    console.log('Read All Extension: No matching provider found for this page.');
    return;
  }

  console.log(`Read All Extension: Initializing for ${matchingProvider.name}...`);

  try {
    const isReady = await matchingProvider.isReady();
    if (!isReady) {
      console.log('Read All Extension: Timeout waiting for provider to be ready.');
      return;
    }
  } catch (e) {
    console.error('Read All Extension: Error during initialization', e);
    return;
  }

  const handleClick = async () => {
    try {
      button.setLoading(true);
      
      console.log('Read All Extension: Selecting all...');
      await matchingProvider.selectAll();
      
      // Small pause to let UI react to selection
      await new Promise(r => setTimeout(r, 500));
      
      console.log('Read All Extension: Marking as read...');
      await matchingProvider.markAsRead();
      
      // Small pause to let UI react to mark as read
      await new Promise(r => setTimeout(r, 2000));
      
      console.log('Read All Extension: Deselecting all...');
      await matchingProvider.deselectAll();
      
      console.log('Read All Extension: Done!');
    } catch (error) {
      console.error('Read All Extension: Error executing action', error);
      alert('Read All Failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      button.setLoading(false);
    }
  };

  const button = new FloatingButton(handleClick);
  button.mount();
  console.log('Read All Extension: Button mounted.');
}

// Start initialization
// We use a slight delay or check to ensure we don't run before the document body is available
if (document.body) {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
