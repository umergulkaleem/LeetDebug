(() => {
  const EXTENSION_SOURCE = "leetcode-debug-toggle-extension";
  const PAGE_SOURCE = "leetcode-debug-toggle-page";

  const DEFAULT_COMMENT_SHORTCUT = "ALT+P";
  const DEFAULT_UNCOMMENT_SHORTCUT = "ALT+O";

  let shortcuts = {
    comment: DEFAULT_COMMENT_SHORTCUT,
    uncomment: DEFAULT_UNCOMMENT_SHORTCUT,
  };

  let messageTimer = null;

  function normalizeShortcut(shortcut) {
    if (!shortcut) {
      return "";
    }

    return shortcut
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace("CONTROL", "CTRL")
      .replace("COMMAND", "META")
      .replace("OPTION", "ALT");
  }

  function getEventShortcut(event) {
    const parts = [];

    if (event.ctrlKey) {
      parts.push("CTRL");
    }

    if (event.altKey) {
      parts.push("ALT");
    }

    if (event.shiftKey) {
      parts.push("SHIFT");
    }

    if (event.metaKey) {
      parts.push("META");
    }

    let key = event.key;

    if (!key) {
      return "";
    }

    key = key.toUpperCase();

    const keyMap = {
      " ": "SPACE",
      ESCAPE: "ESC",
      ARROWUP: "UP",
      ARROWDOWN: "DOWN",
      ARROWLEFT: "LEFT",
      ARROWRIGHT: "RIGHT",
      ENTER: "ENTER",
      TAB: "TAB",
      BACKSPACE: "BACKSPACE",
      DELETE: "DELETE",
      INSERT: "INSERT",
      HOME: "HOME",
      END: "END",
      PAGEUP: "PAGEUP",
      PAGEDOWN: "PAGEDOWN",
    };

    if (keyMap[key]) {
      key = keyMap[key];
    }

    if (
      key === "CONTROL" ||
      key === "ALT" ||
      key === "SHIFT" ||
      key === "META"
    ) {
      return "";
    }

    parts.push(key);

    return parts.join("+");
  }

  function loadShortcuts() {
    chrome.storage.local.get(
      ["commentShortcut", "uncommentShortcut"],
      (result) => {
        shortcuts.comment = normalizeShortcut(
          result.commentShortcut || DEFAULT_COMMENT_SHORTCUT,
        );

        shortcuts.uncomment = normalizeShortcut(
          result.uncommentShortcut || DEFAULT_UNCOMMENT_SHORTCUT,
        );
      },
    );
  }

  loadShortcuts();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes.commentShortcut) {
      shortcuts.comment = normalizeShortcut(
        changes.commentShortcut.newValue || DEFAULT_COMMENT_SHORTCUT,
      );
    }

    if (changes.uncommentShortcut) {
      shortcuts.uncomment = normalizeShortcut(
        changes.uncommentShortcut.newValue || DEFAULT_UNCOMMENT_SHORTCUT,
      );
    }
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.repeat) {
        return;
      }

      const pressedShortcut = getEventShortcut(event);

      if (!pressedShortcut) {
        return;
      }

      let action = null;

      if (shortcuts.comment && pressedShortcut === shortcuts.comment) {
        action = "comment-debug-statements";
      }

      if (shortcuts.uncomment && pressedShortcut === shortcuts.uncomment) {
        action = "uncomment-debug-statements";
      }

      if (!action) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      chrome.runtime.sendMessage({
        action: action,
      });
    },
    true,
  );

  function showMessage(message, type = "normal") {
    const oldMessage = document.getElementById("leetcode-debug-toggle-message");

    if (oldMessage) {
      oldMessage.remove();
    }

    if (messageTimer) {
      clearTimeout(messageTimer);
    }

    const notification = document.createElement("div");

    notification.id = "leetcode-debug-toggle-message";

    notification.textContent = message;

    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.right = "20px";
    notification.style.zIndex = "2147483647";
    notification.style.padding = "12px 18px";
    notification.style.borderRadius = "8px";
    notification.style.background = type === "error" ? "#b91c1c" : "#1f2937";
    notification.style.color = "#ffffff";
    notification.style.fontSize = "14px";
    notification.style.fontFamily = "Arial, sans-serif";
    notification.style.fontWeight = "500";
    notification.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
    notification.style.pointerEvents = "none";

    document.body.appendChild(notification);

    messageTimer = setTimeout(() => {
      notification.remove();
      messageTimer = null;
    }, 2500);
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) {
      return;
    }

    if (!event.data) {
      return;
    }

    if (event.data.source !== PAGE_SOURCE) {
      return;
    }

    const result = event.data.result;

    if (!result) {
      showMessage("No response from editor.", "error");
      return;
    }

    if (!result.success) {
      showMessage(result.message || "Could not modify the editor.", "error");
      return;
    }

    if (result.action === "comment") {
      showMessage(
        `Commented ${result.count} debug statement${
          result.count === 1 ? "" : "s"
        }`,
      );
      return;
    }

    if (result.action === "uncomment") {
      showMessage(
        `Uncommented ${result.count} debug statement${
          result.count === 1 ? "" : "s"
        }`,
      );
      return;
    }

    if (result.action === "none") {
      showMessage(result.message || "No matching debug statements found.");
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (!message) {
      return;
    }

    if (
      message.action !== "comment-debug-statements" &&
      message.action !== "uncomment-debug-statements"
    ) {
      return;
    }

    window.postMessage(
      {
        source: EXTENSION_SOURCE,
        action: message.action,
      },
      "*",
    );
  });
})();
