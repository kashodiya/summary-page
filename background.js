let isOpen = false;
let startSummaryWhenSidePanelOpens = false;

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
            console.log({ text });
            sendResponse({ text });
          } catch (error) {
            console.error("Error executing script:", error);
            sendResponse({ error: error.message });
          }
        }
        return true;
      });
    } else if (request.action === 'side-panel-opened') {
      console.log('Got message side-panel-opened');
      isOpen = true;

      if(startSummaryWhenSidePanelOpens){
        chrome.runtime.sendMessage({ action: "generate-summary-now" }, async (response) => {
          console.log('Sent message: generate-summary-now');
        });
        startSummaryWhenSidePanelOpens = false;
      }

      return true;
    }

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
);




chrome.commands.onCommand.addListener(function (command, tab) {
  if (command === 'generate-summary') {
    if (!isOpen) {
      console.log('generate-summary command invoked...opening sidepanel', tab);
      startSummaryWhenSidePanelOpens = true;
      chrome.sidePanel.open({ tabId: tab.id });
      isOpen = true;
    } else {
      console.log('Site panel is already open');
      chrome.runtime.sendMessage({ action: "closeSidePanel" }, async (response) => {
        // console.log('Site panel closed.');
        // isOpen = false;
      });
      isOpen = false;
    }
  }
});


