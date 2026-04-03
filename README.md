# 👻 Ghost Typer

**A completely invisible Chrome extension that types code like a real human.**

Ghost Typer takes any code you paste and types it out character-by-character into any text field on any website — with realistic speed variations, natural thinking pauses, human-like typos (that it corrects!), and zero detection footprint. No toolbar icon, no popup, no trace.

---

## ✨ Features

### 🎯 Human-Like Typing Engine
- **WPM Speed Control** — Set your exact words-per-minute (10–100). Default is 35 WPM, which matches a typical student's typing speed.
- **Natural Speed Variance** — Every keystroke has a ±40% random delay variation, so no two characters are typed at the exact same speed.
- **Nearby-Key Typos** — When a typo happens, it hits a key *next to* the correct one on the keyboard (e.g., typing `s` instead of `d`), just like a real finger slip. Then it backspaces and corrects itself.
- **Thinking Pauses** — Random mid-typing pauses that simulate the user stopping to think, read, or look at reference material.
- **Line Break Delay** — Configurable pause when moving to a new line, like a person scanning down to the next line of code.
- **Post-Statement Pauses** — Extra micro-delays after semicolons, braces, and brackets, simulating end-of-statement thinking.

### ⚡ Advanced Behavior
- **Burst Typing** — Common keywords like `const`, `return`, `function`, `for`, `if` are typed faster (because a real person has typed them thousands of times). Uncommon symbols are typed slower.
- **Warmup Effect** — Typing starts slower for the first ~15% of the code and gradually reaches full speed, mimicking a person getting into the flow.

### 🔒 Completely Invisible
- **No toolbar icon** — Nothing visible in the browser chrome.
- **No popup window** — The settings panel is injected directly into the page.
- **Shadow DOM isolation** — The settings panel lives inside a closed Shadow DOM. Page JavaScript, anti-cheat scripts, and even browser DevTools inspectors on the page **cannot detect or access it**.
- **No DOM footprint** — When the panel is closed and typing is finished, there is literally zero trace left in the page.
- **Triggered by keyboard shortcut only** — `Alt + G` toggles the panel. No clicks on any extension icon needed.

### 🛑 Stop Controls
- **Stop Button** — Reopen the panel with `Alt + G` while typing is active to reveal the stop button.
- **Emergency Stop** — Press `Esc` at any time on the page to instantly halt typing.

---

## 📦 Installation

### Step 1: Download
Make sure you have the `human_typer_extension` folder with these files:
```
human_typer_extension/
├── manifest.json
├── background.js
├── content.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Step 2: Load into Chrome
1. Open Google Chrome.
2. Type `chrome://extensions/` into the address bar and press Enter.
3. In the **top-right corner**, toggle **"Developer mode"** to **ON**.
4. Click the **"Load unpacked"** button that appears in the top-left.
5. Navigate to the `human_typer_extension` folder and click **Select Folder**.
6. The extension is now installed. There will be **no visible icon** in your toolbar — that's by design.

### Step 3: Verify
Press `Alt + G` on any webpage. A dark floating panel should slide in at the top-right of the page. If it does, you're all set!

---

## 🚀 How to Use

### Quick Start
1. **Open any webpage** with a text field (Google Docs, an online IDE, a coding platform, a textarea, etc.).
2. Press **`Alt + G`** to open the Ghost Typer panel.
3. **Paste your code** into the text area.
4. Adjust settings if you want (or leave defaults — they're already tuned to be realistic).
5. Click **▶ Start Typing**.
6. The panel disappears. A floating countdown banner appears: **"Click the text box now! Starting in 3..."**
7. **Click inside the text field** where you want the code typed.
8. Watch the code type itself out naturally!

### Settings Guide

| Setting | What It Controls | Recommended |
|---|---|---|
| **Speed (WPM)** | How fast the typing is. 10 = very slow beginner, 100 = fast typist. | **30–45 WPM** for realistic student speed |
| **Typos** | How often a wrong key is hit and then corrected. | **Low** or **Rare** |
| **Thinking Pauses** | Random pauses mid-typing to look natural. | **Natural** |
| **Line Break Delay** | How long to pause when moving to a new line. | **Natural** |
| **Burst Typing** | Common words typed faster, symbols typed slower. | **ON** |
| **Warmup** | Start slow, get faster gradually. | **ON** |

### Stopping Mid-Type
- Press **`Esc`** anywhere on the page — typing stops immediately.
- Or press **`Alt + G`** to reopen the panel and click the red **■ Stop** button.

---

## 🔧 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt + G` | Toggle the Ghost Typer panel |
| `Esc` | Emergency stop typing |

> **Tip:** You can customize the `Alt + G` shortcut in Chrome. Go to `chrome://extensions/shortcuts` and change it to whatever key combo you prefer.

---

## 🌐 Compatibility

Ghost Typer works on:
- ✅ Standard `<textarea>` and `<input>` fields
- ✅ `contenteditable` elements
- ✅ Google Docs
- ✅ Online IDEs (CodePen, Replit, JSFiddle, etc.)
- ✅ Monaco Editor (VS Code Web)
- ✅ CodeMirror-based editors
- ✅ LeetCode, HackerRank, and similar platforms

> **Note:** The extension cannot run on `chrome://` or `edge://` system pages. It works on all regular websites.

---

## ❓ Troubleshooting

**Panel doesn't appear when I press Alt+G**
- Make sure you're on a regular webpage (not `chrome://extensions` or similar).
- Refresh the page with `F5` and try again.
- Check `chrome://extensions/shortcuts` to confirm the shortcut is set.

**Typing doesn't start / types in the wrong place**
- After clicking Start, you get a 3-second countdown — use that time to **click directly into the text field** where you want the code typed.
- Some editors require you to click inside the editing area to give it focus.

**Extension disappeared after Chrome update**
- Go to `chrome://extensions/`, re-enable Developer Mode, and re-load the unpacked folder.

---

*Built for learning. Type it, read it, understand it.* 👻
