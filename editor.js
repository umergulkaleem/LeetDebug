(() => {
  /*
   * Prevent duplicate initialization.
   */
  if (window.__leetcodeDebugToggleInitialized) {
    return;
  }

  window.__leetcodeDebugToggleInitialized = true;

  const EXTENSION_SOURCE = "leetcode-debug-toggle-extension";

  const PAGE_SOURCE = "leetcode-debug-toggle-page";

  let operationInProgress = false;

  /*
   * ==========================================
   * LANGUAGE DETECTION
   * ==========================================
   */

  function detectLanguage(model) {
    let language = "";

    if (model && typeof model.getLanguageId === "function") {
      language = model.getLanguageId().toLowerCase();
    }

    if (language.includes("python")) {
      return "python";
    }

    if (language.includes("javascript")) {
      return "javascript";
    }

    if (language.includes("typescript")) {
      return "typescript";
    }

    if (language.includes("java")) {
      return "java";
    }

    if (language.includes("cpp") || language.includes("c++")) {
      return "cpp";
    }

    if (language.includes("csharp") || language.includes("c#")) {
      return "csharp";
    }

    const code =
      model && typeof model.getValue === "function" ? model.getValue() : "";

    if (/\bdef\s+\w+\s*\(/.test(code) || /\bprint\s*\(/.test(code)) {
      return "python";
    }

    if (/console\.(log|debug|info|warn|error)\s*\(/.test(code)) {
      return "javascript";
    }

    if (/System\.(out|err)\.(println|print|printf)\s*\(/.test(code)) {
      return "java";
    }

    if (/\b(std::)?cout\s*<</.test(code)) {
      return "cpp";
    }

    if (/\bConsole\.(WriteLine|Write|Error|Debug)\s*\(/.test(code)) {
      return "csharp";
    }

    return "unknown";
  }

  /*
   * ==========================================
   * DEBUG DETECTION
   * ==========================================
   */

  function isPythonDebug(line) {
    return /^\s*print\s*\(/.test(line);
  }

  function isJavaScriptDebug(line) {
    return /^\s*console\.(log|debug|info|warn|error)\s*\(/.test(line);
  }

  function isJavaDebug(line) {
    return /^\s*(System\.out|System\.err)\.(println|print|printf)\s*\(/.test(
      line,
    );
  }

  function isCppDebug(line) {
    return /^\s*(std::)?cout\s*<</.test(line);
  }

  function isCSharpDebug(line) {
    return /^\s*Console\.(WriteLine|Write|Error|Debug)\s*\(/.test(line);
  }

  function isDebugLine(line, language) {
    switch (language) {
      case "python":
        return isPythonDebug(line);

      case "javascript":
      case "typescript":
        return isJavaScriptDebug(line);

      case "java":
        return isJavaDebug(line);

      case "cpp":
      case "c++":
        return isCppDebug(line);

      case "csharp":
      case "c#":
        return isCSharpDebug(line);

      default:
        return false;
    }
  }

  /*
   * ==========================================
   * COMMENT HANDLING
   * ==========================================
   */

  function getCommentPrefix(language) {
    return language === "python" ? "#" : "//";
  }

  function commentLine(line, language) {
    const indentation = line.match(/^\s*/)?.[0] || "";

    const content = line.slice(indentation.length);

    return indentation + getCommentPrefix(language) + " " + content;
  }

  function uncommentLine(line, language) {
    const indentation = line.match(/^\s*/)?.[0] || "";

    const content = line.slice(indentation.length);

    const prefix = getCommentPrefix(language);

    if (content.startsWith(prefix + " ")) {
      return indentation + content.slice(prefix.length + 1);
    }

    if (content.startsWith(prefix)) {
      return indentation + content.slice(prefix.length);
    }

    return line;
  }

  function isCommentedDebugLine(line, language) {
    const indentation = line.match(/^\s*/)?.[0] || "";

    const content = line.slice(indentation.length);

    const prefix = getCommentPrefix(language);

    if (!content.startsWith(prefix)) {
      return false;
    }

    const uncommented = uncommentLine(line, language);

    return isDebugLine(uncommented, language);
  }

  /*
   * ==========================================
   * COMMENT
   * ==========================================
   */

  function commentDebugStatements(code, language) {
    const lines = code.split("\n");

    let count = 0;

    for (let i = 0; i < lines.length; i++) {
      if (isDebugLine(lines[i], language)) {
        lines[i] = commentLine(lines[i], language);

        count++;
      }
    }

    return {
      changed: count > 0,
      count,
      code: lines.join("\n"),
    };
  }

  /*
   * ==========================================
   * UNCOMMENT
   * ==========================================
   */

  function uncommentDebugStatements(code, language) {
    const lines = code.split("\n");

    let count = 0;

    for (let i = 0; i < lines.length; i++) {
      if (isCommentedDebugLine(lines[i], language)) {
        lines[i] = uncommentLine(lines[i], language);

        count++;
      }
    }

    return {
      changed: count > 0,
      count,
      code: lines.join("\n"),
    };
  }

  /*
   * ==========================================
   * FIND EDITOR
   * ==========================================
   */

  function findEditor() {
    if (!window.monaco || !window.monaco.editor) {
      return null;
    }

    if (typeof window.monaco.editor.getEditors !== "function") {
      return null;
    }

    const editors = window.monaco.editor.getEditors();

    if (!editors || editors.length === 0) {
      return null;
    }

    for (const editor of editors) {
      if (typeof editor.hasTextFocus === "function" && editor.hasTextFocus()) {
        return editor;
      }
    }

    return editors[0];
  }

  /*
   * ==========================================
   * RESULT
   * ==========================================
   */

  function sendResult(result) {
    window.postMessage(
      {
        source: PAGE_SOURCE,
        result,
      },
      "*",
    );
  }

  /*
   * ==========================================
   * MAIN OPERATION
   * ==========================================
   */

  function performOperation(action) {
    if (operationInProgress) {
      return;
    }

    operationInProgress = true;

    try {
      const editor = findEditor();

      if (!editor) {
        sendResult({
          success: false,
          message: "LeetCode editor not found.",
        });

        return;
      }

      const model = editor.getModel();

      if (!model) {
        sendResult({
          success: false,
          message: "Could not access the LeetCode code model.",
        });

        return;
      }

      const code = model.getValue();

      const language = detectLanguage(model);

      if (language === "unknown") {
        sendResult({
          success: false,
          message: "Could not determine the programming language.",
        });

        return;
      }

      let result;

      /*
       * ======================================
       * COMMENT
       * ======================================
       */

      if (action === "comment-debug-statements") {
        result = commentDebugStatements(code, language);

        if (!result.changed) {
          sendResult({
            success: true,
            action: "none",
            count: 0,
            message: "No active debug statements found.",
          });

          return;
        }

        editor.executeEdits("leetcode-debug-comment", [
          {
            range: model.getFullModelRange(),
            text: result.code,
          },
        ]);

        sendResult({
          success: true,
          action: "comment",
          count: result.count,
          language,
        });

        return;
      }

      /*
       * ======================================
       * UNCOMMENT
       * ======================================
       */

      if (action === "uncomment-debug-statements") {
        result = uncommentDebugStatements(code, language);

        if (!result.changed) {
          sendResult({
            success: true,
            action: "none",
            count: 0,
            message: "No commented debug statements found.",
          });

          return;
        }

        editor.executeEdits("leetcode-debug-uncomment", [
          {
            range: model.getFullModelRange(),
            text: result.code,
          },
        ]);

        sendResult({
          success: true,
          action: "uncomment",
          count: result.count,
          language,
        });

        return;
      }
    } catch (error) {
      console.error("[LeetCode Debug Toggle]", error);

      sendResult({
        success: false,
        message: "Error while modifying the editor: " + error.message,
      });
    } finally {
      setTimeout(() => {
        operationInProgress = false;
      }, 100);
    }
  }

  /*
   * ==========================================
   * RECEIVE COMMAND
   * ==========================================
   */

  window.addEventListener("message", (event) => {
    if (event.source !== window) {
      return;
    }

    if (!event.data) {
      return;
    }

    if (event.data.source !== EXTENSION_SOURCE) {
      return;
    }

    if (
      event.data.action !== "comment-debug-statements" &&
      event.data.action !== "uncomment-debug-statements"
    ) {
      return;
    }

    setTimeout(() => {
      performOperation(event.data.action);
    }, 25);
  });
})();
