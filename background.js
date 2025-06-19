chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    // Keep the message channel open by returning true
    if (request.action === "getText") {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length > 0) {
          const tabId = tabs[0].id; // Ensure you get the tab ID
          console.log("Current Tab ID:", tabId);
          console.log("Received getText action");
          try {
            const injection = await chrome.scripting.executeScript({
              target: { tabId },
              files: ['scripts/extract-content.js']
            });
            const text = injection[0].result;
            console.log({text});
            sendResponse({text});
          } catch (error) {
            console.error("Error executing script:", error);
            sendResponse({ error: error.message });
          }
        }
      });
    }

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
);

