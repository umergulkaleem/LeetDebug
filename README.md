# LeetCode Debug Toggle

A Chrome extension that lets you comment and uncomment debug statements in the LeetCode code editor using configurable keyboard shortcuts.

## Supported Languages

- Python
- JavaScript
- Java
- C++
- C#

## Supported Debug Statements

### Python

```python
print(nums)
```

becomes:

```python
# print(nums)
```

### JavaScript

```javascript
console.log(nums);
```

becomes:

```javascript
// console.log(nums);
```

### Java

```java
System.out.println(nums);
```

becomes:

```java
// System.out.println(nums);
```

### C++

```cpp
cout << nums << endl;
```

becomes:

```cpp
// cout << nums << endl;
```

### C#

```csharp
Console.WriteLine(nums);
```

becomes:

```csharp
// Console.WriteLine(nums);
```

## Default Keyboard Shortcuts

The extension provides two separate shortcuts:

- **Comment:** `Alt + P`
- **Uncomment:** `Alt + O`

Both shortcuts can be changed independently from the extension popup.

## Changing Keyboard Shortcuts

1. Click the **LeetCode Debug Toggle** extension icon.
2. Under **Comment Shortcut**, click **Change Comment Shortcut**.
3. Press the new keyboard shortcut.
4. The new shortcut is saved automatically.

To change the uncomment shortcut:

1. Click the **LeetCode Debug Toggle** extension icon.
2. Under **Uncomment Shortcut**, click **Change Uncomment Shortcut**.
3. Press the new keyboard shortcut.
4. The new shortcut is saved automatically.

The Comment and Uncomment shortcuts must be different.

## Installation

1. Create a folder named `leetcode-debug-toggle`.

2. Put these files inside it:
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `editor.js`
   - `popup.html`
   - `popup.js`

3. Open Chrome.

4. Go to:

   `chrome://extensions/`

5. Enable **Developer mode**.

6. Click **Load unpacked**.

7. Select the `leetcode-debug-toggle` folder.

8. Open LeetCode.

9. Click the extension icon to configure your shortcuts.

## Usage

1. Open a LeetCode problem.
2. Open the code editor.
3. Add some debug statements.
4. Press your configured **Comment** shortcut.
5. Matching debug statements are commented.
6. Press your configured **Uncomment** shortcut to restore them.

## Example

Before:

```python
class Solution:
    def twoSum(self, nums, target):
        print(nums)
        for i in range(len(nums)):
            print(i)
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
```

After pressing the Comment shortcut:

```python
class Solution:
    def twoSum(self, nums, target):
        # print(nums)
        for i in range(len(nums)):
            # print(i)
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
```

Pressing the Uncomment shortcut restores the debug statements:

```python
class Solution:
    def twoSum(self, nums, target):
        print(nums)
        for i in range(len(nums)):
            print(i)
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
```

## How It Works

The extension detects supported debug statements in the active LeetCode editor and modifies only matching lines.

The extension preserves the indentation of the original code while adding or removing the appropriate comment prefix:

- Python: `#`
- JavaScript: `//`
- Java: `//`
- C++: `//`
- C#: `//`

The extension uses the LeetCode editor's underlying Monaco editor to modify the code directly.
