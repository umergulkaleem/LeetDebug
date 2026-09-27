# LeetDebug

A Chrome extension that comments and uncomments debug statements in the LeetCode editor with a single keyboard shortcut.

If this saves you time, consider giving it a star. It helps others find it.
## Supported Languages

- Python
- JavaScript
- Java
- C++
- C#

## Installation

1. Clone the repository
```bash
git clone https://github.com/umergulkaleem/LeetDebug.git
```

2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer Mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the cloned `LeetDebug` folder
6. Open LeetCode and click the extension icon to configure your shortcuts

## Usage

Open any LeetCode problem, add your debug statements, then:

- Press **Alt+P** to comment all debug statements
- Press **Alt+O** to uncomment them all back

Both shortcuts are fully configurable from the extension popup.

## Supported Debug Statements

| Language | Statement | Commented |
|----------|-----------|-----------|
| Python | `print(nums)` | `# print(nums)` |
| JavaScript | `console.log(nums)` | `// console.log(nums)` |
| Java | `System.out.println(nums)` | `// System.out.println(nums)` |
| C++ | `cout << nums << endl` | `// cout << nums << endl` |
| C# | `Console.WriteLine(nums)` | `// Console.WriteLine(nums)` |

## Changing Keyboard Shortcuts

1. Click the extension icon
2. Click **Change Comment Shortcut** or **Change Uncomment Shortcut**
3. Press your desired key combination
4. It saves automatically

Note: Comment and Uncomment shortcuts must be different.

## Contributing

Want to add support for a new language? Fork the repo, add your language pattern and open a PR. Contributions are welcome.

## How It Works

LeetDebug hooks into the LeetCode editor and detects debug statements on each line. When triggered, it adds or removes the appropriate comment prefix while preserving the original indentation.
