document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_COMMENT = "ALT+P";
  const DEFAULT_UNCOMMENT = "ALT+O";

  const commentShortcut = document.getElementById("commentShortcut");

  const uncommentShortcut = document.getElementById("uncommentShortcut");

  const changeComment = document.getElementById("changeComment");

  const changeUncomment = document.getElementById("changeUncomment");

  const status = document.getElementById("status");

  const modal = document.getElementById("shortcutModal");

  const modalTitle = document.getElementById("modalTitle");

  const pressedShortcut = document.getElementById("pressedShortcut");

  const cancelShortcut = document.getElementById("cancelShortcut");

  let currentComment = DEFAULT_COMMENT;
  let currentUncomment = DEFAULT_UNCOMMENT;

  let changing = null;

  function formatShortcut(shortcut) {
    return shortcut
      .split("+")
      .map((key) => {
        const names = {
          CTRL: "Ctrl",
          ALT: "Alt",
          SHIFT: "Shift",
          META: "Meta",
          SPACE: "Space",
          ENTER: "Enter",
          ESC: "Esc",
          TAB: "Tab",
          BACKSPACE: "Backspace",
          DELETE: "Delete",
          UP: "↑",
          DOWN: "↓",
          LEFT: "←",
          RIGHT: "→",
        };

        return names[key] || key;
      })
      .join(" + ");
  }

  function getKeyName(event) {
    const code = event.code || "";

    if (/^Key[A-Z]$/.test(code)) {
      return code.slice(3);
    }

    if (/^Digit[0-9]$/.test(code)) {
      return code.slice(5);
    }

    const key = (event.key || "").toUpperCase();

    const specialKeys = {
      " ": "SPACE",
      ESCAPE: "ESC",
      ARROWUP: "UP",
      ARROWDOWN: "DOWN",
      ARROWLEFT: "LEFT",
      ARROWRIGHT: "RIGHT",
    };

    return specialKeys[key] || key;
  }

  function getShortcut(event) {
    const parts = [];

    if (event.ctrlKey) parts.push("CTRL");
    if (event.altKey) parts.push("ALT");
    if (event.shiftKey) parts.push("SHIFT");
    if (event.metaKey) parts.push("META");

    const key = getKeyName(event);

    // User only pressed a modifier
    if (
      !key ||
      key === "CONTROL" ||
      key === "ALT" ||
      key === "SHIFT" ||
      key === "META"
    ) {
      return null;
    }

    // Require at least one modifier
    if (parts.length === 0) {
      return null;
    }

    parts.push(key);

    return parts.join("+");
  }

  function render() {
    commentShortcut.textContent = formatShortcut(currentComment);

    uncommentShortcut.textContent = formatShortcut(currentUncomment);
  }

  function openModal(type) {
    changing = type;

    if (type === "comment") {
      modalTitle.textContent = "Change Comment Shortcut";
    } else {
      modalTitle.textContent = "Change Uncomment Shortcut";
    }

    pressedShortcut.textContent = "Press your shortcut...";

    modal.classList.add("show");
  }

  function closeModal() {
    changing = null;

    modal.classList.remove("show");

    pressedShortcut.textContent = "Press your shortcut...";
  }

  async function saveShortcut(shortcut) {
    if (changing === "comment") {
      currentComment = shortcut;

      await chrome.storage.local.set({
        commentShortcut: shortcut,
      });
    }

    if (changing === "uncomment") {
      currentUncomment = shortcut;

      await chrome.storage.local.set({
        uncommentShortcut: shortcut,
      });
    }

    render();

    status.textContent = `${formatShortcut(shortcut)} saved`;

    closeModal();
  }

  changeComment.addEventListener("click", () => {
    openModal("comment");
  });

  changeUncomment.addEventListener("click", () => {
    openModal("uncomment");
  });

  cancelShortcut.addEventListener("click", () => {
    closeModal();
  });

  /*
   * Capture the new shortcut.
   *
   * This listener is attached to the entire popup,
   * so it works while the modal is open.
   */

  document.addEventListener(
    "keydown",
    async (event) => {
      if (!changing) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const shortcut = getShortcut(event);

      if (!shortcut) {
        pressedShortcut.textContent = "Use a modifier + another key";

        return;
      }

      /*
       * Prevent the same shortcut from being
       * assigned to both actions.
       */

      if (changing === "comment" && shortcut === currentUncomment) {
        pressedShortcut.textContent = "Already assigned to Uncomment";

        return;
      }

      if (changing === "uncomment" && shortcut === currentComment) {
        pressedShortcut.textContent = "Already assigned to Comment";

        return;
      }

      pressedShortcut.textContent = formatShortcut(shortcut);

      await saveShortcut(shortcut);
    },
    true,
  );

  /*
   * Load saved shortcuts
   */

  chrome.storage.local.get(
    ["commentShortcut", "uncommentShortcut"],
    (result) => {
      currentComment = result.commentShortcut || DEFAULT_COMMENT;

      currentUncomment = result.uncommentShortcut || DEFAULT_UNCOMMENT;

      render();
    },
  );
});
