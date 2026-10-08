(() => {
  if (window.__leetcodeDebugToggleInitialized) {
    return;
  }

  window.__leetcodeDebugToggleInitialized = true;

  const EXTENSION_SOURCE = "leetcode-debug-toggle-extension";
  const PAGE_SOURCE = "leetcode-debug-toggle-page";

  let operationInProgress = false;

  /* ---------- LANGUAGE DETECTION ---------- */

  function detectLanguage(model) {
    let language = "";

    if (model && typeof model.getLanguageId === "function") {
      language = model.getLanguageId().toLowerCase();
    }

    if (language.includes("python")) return "python";
    if (language.includes("javascript")) return "javascript";
    if (language.includes("typescript")) return "typescript";
    if (language.includes("java")) return "java";
    if (language.includes("cpp") || language.includes("c++")) return "cpp";
    if (language.includes("csharp") || language.includes("c#")) return "csharp";

    // A language id exists but is not supported: never guess.
    if (language) return "unknown";

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
    if (/\b(std::)?cout\s*<</.test(code)) return "cpp";
    if (/\bConsole\.(WriteLine|Write|Error|Debug)\s*\(/.test(code)) {
      return "csharp";
    }

    return "unknown";
  }

  /* ---------- DEBUG DETECTION ---------- */

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

  /* ---------- COMMENT HANDLING ---------- */

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

    return isDebugLine(uncommentLine(line, language), language);
  }

  /* ---------- SAFETY CHECKS ---------- */

  function stripStrings(text) {
    return text.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
  }

  function stripTrailingComment(text, language) {
    const prefix = getCommentPrefix(language);
    const index = text.indexOf(prefix);
    return index === -1 ? text : text.slice(0, index);
  }

  // False when the statement continues on the next line.
  function isCompleteStatement(line, language) {
    const text = stripTrailingComment(stripStrings(line), language).trim();

    if (language === "cpp" || language === "c++") {
      return text.endsWith(";");
    }

    let depth = 0;

    for (const ch of text) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
    }

    return depth === 0;
  }

  function isCommentOnly(line, language) {
    return line.trim().startsWith(getCommentPrefix(language));
  }

  function indentOf(line) {
    return (line.match(/^\s*/)?.[0] || "").length;
  }

  // True when commenting this line would leave a block empty (Python)
  // or turn the next statement into the body (C-style braceless if/for/else).
  function isSoleBody(lines, index, language) {
    let prev = index - 1;

    while (
      prev >= 0 &&
      (lines[prev].trim() === "" || isCommentOnly(lines[prev], language))
    ) {
      prev--;
    }

    if (prev < 0) {
      return false;
    }

    const prevText = lines[prev].trim();

    if (language === "python") {
      if (!prevText.endsWith(":")) {
        return false;
      }

      let next = index + 1;

      while (
        next < lines.length &&
        (lines[next].trim() === "" || isCommentOnly(lines[next], language))
      ) {
        next++;
      }

      if (next >= lines.length) {
        return true;
      }

      return indentOf(lines[next]) < indentOf(lines[index]);
    }

    if (prevText.endsWith("{") || prevText.endsWith(";")) {
      return false;
    }

    return prevText.endsWith(")") || prevText.endsWith("else");
  }

  /* ---------- COMMENT / UNCOMMENT ---------- */

  function commentDebugStatements(lines, language) {
    const output = lines.slice();
    let count = 0;
    let skipped = 0;

    for (let i = 0; i < output.length; i++) {
      if (!isDebugLine(output[i], language)) {
        continue;
      }

      if (
        !isCompleteStatement(output[i], language) ||
        isSoleBody(output, i, language)
      ) {
        skipped++;
        continue;
      }

      output[i] = commentLine(output[i], language);
      count++;
    }

    return { count, skipped, lines: output };
  }

  function uncommentDebugStatements(lines, language) {
    const output = lines.slice();
    let count = 0;
    let skipped = 0;

    for (let i = 0; i < output.length; i++) {
      if (!isCommentedDebugLine(output[i], language)) {
        continue;
      }

      const restored = uncommentLine(output[i], language);

      if (!isCompleteStatement(restored, language)) {
        skipped++;
        continue;
      }

      output[i] = restored;
      count++;
    }

    return { count, skipped, lines: output };
  }

  /* ---------- EDITOR ---------- */

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

  // Edits only the lines that changed, so cursor and folds are not reset.
  function applyLineEdits(editor, oldLines, newLines, editId) {
    const edits = [];

    for (let i = 0; i < oldLines.length; i++) {
      if (oldLines[i] !== newLines[i]) {
        edits.push({
          range: new window.monaco.Range(
            i + 1,
            1,
            i + 1,
            oldLines[i].length + 1,
          ),
          text: newLines[i],
        });
      }
    }

    editor.executeEdits(editId, edits);
  }

  function sendResult(result) {
    window.postMessage(
      {
        source: PAGE_SOURCE,
        result,
      },
      window.location.origin,
    );
  }

  /* ---------- MAIN OPERATION ---------- */

  function performOperation(action) {
    if (operationInProgress) {
      return;
    }

    operationInProgress = true;

    try {
      const editor = findEditor();

      if (!editor) {
        sendResult({ success: false, message: "LeetCode editor not found." });
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

      const language = detectLanguage(model);

      if (language === "unknown") {
        sendResult({
          success: false,
          message:
            "Language not supported. Add it at github.com/umergulkaleem/LeetDebug",
        });
        return;
      }

      const oldLines = model.getLinesContent();
      const isComment = action === "comment-debug-statements";

      const result = isComment
        ? commentDebugStatements(oldLines, language)
        : uncommentDebugStatements(oldLines, language);

      if (result.count === 0) {
        let message = isComment
          ? "No active debug statements found."
          : "No commented debug statements found.";

        if (result.skipped > 0) {
          message += ` Skipped ${result.skipped} unsafe line${
            result.skipped === 1 ? "" : "s"
          }.`;
        }

        sendResult({
          success: true,
          action: "none",
          count: 0,
          skipped: result.skipped,
          message,
        });
        return;
      }

      applyLineEdits(
        editor,
        oldLines,
        result.lines,
        isComment ? "leetcode-debug-comment" : "leetcode-debug-uncomment",
      );

      sendResult({
        success: true,
        action: isComment ? "comment" : "uncomment",
        count: result.count,
        skipped: result.skipped,
        language,
      });
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

  /* ---------- RECEIVE COMMAND ---------- */

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (!event.data) return;
    if (event.data.source !== EXTENSION_SOURCE) return;

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
