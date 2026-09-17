chrome.runtime.onMessage.addListener((message, sender) => {
  if (
    !message ||
    (message.action !== "comment-debug-statements" &&
      message.action !== "uncomment-debug-statements")
  ) {
    return;
  }

  const tabId = sender.tab?.id;

  if (!tabId) {
    return;
  }

  const url = sender.tab.url || "";

  if (!url.startsWith("https://leetcode.com/")) {
    return;
  }

  chrome.scripting
    .executeScript({
      target: {
        tabId: tabId,
      },
      world: "MAIN",
      files: ["editor.js"],
    })
    .then(() => {
      return chrome.tabs.sendMessage(tabId, {
        action: message.action,
      });
    })
    .catch((error) => {
      console.error("LeetCode Debug Toggle error:", error);
    });
});
