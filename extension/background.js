// background.js


// Inject content.js automatically when a YouTube page is opened
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.includes('youtube.com/watch')) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
        });
        console.log("🚀 Content script injected on YouTube page!");
    }
});






