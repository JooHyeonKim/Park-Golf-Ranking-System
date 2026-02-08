# CLAUDE.md
<!-- Created: 2026-02-03 -->

This file provides guidance to Claude Code (claude.ai/code) when working with the **Desktop Version** of the park golf application.

## Overview

Desktop version is a native desktop application using **Electron** (or **Tauri** as alternative). It provides enhanced features like file system access, native menus, and better offline capabilities.

## Development Commands

```bash
npm install           # Install dependencies
npm run dev           # Start development with hot reload
npm run build         # Build for production
npm run package       # Package as desktop app
npm run package:win   # Package for Windows
npm run package:mac   # Package for macOS
```

## Plan Mode

Plan documents should be saved to the `plans/` folder with the following naming format:
```
plans/YYYY-MM-DD-기능내용.md
```

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- Electron (or Tauri)
- electron-builder (packaging)

## Architecture

### Project Structure

```
src/
├── main/                                # Electron main process
│   ├── main.js                          # Main process entry
│   └── preload.js                       # Preload script for IPC
├── renderer/                            # React app (renderer process)
│   ├── App.jsx
│   ├── components/
│   ├── hooks/
│   └── utils/
└── shared/                              # Shared code between processes
    └── constants.js
```

### Data Persistence

- **Primary**: Local file system (JSON files)
- **Fallback**: localStorage (for compatibility)
- **Data location**: User's app data directory

### Desktop-Specific Features

- Native file dialogs for import/export
- Auto-update functionality
- System tray integration
- Keyboard shortcuts
- Native menus

## Key Data Structures

**Tournament**
```javascript
{ id, name, date, createdAt, players: Player[] }
```

**Player** (144 players per tournament: 36 groups × 4 players)
```javascript
{
  id: number,
  group: number,          // 조 번호 (1-36)
  course: string,         // 코스명 (A-1 ~ D-9)
  name, gender, club: string,
  scoreA, scoreB, scoreC, scoreD: number | null,
  detailScores: Object | null  // For tiebreakers
}
```

## Ranking Rules

1. **Primary**: Lower 36-hole total wins
2. **Tiebreaker**: Compare course scores in order D → C → B → A (lower wins)
3. **Final tiebreaker**: Compare hole-by-hole D9 → D8 → ... → A1

## IPC Communication

Desktop version uses IPC (Inter-Process Communication) between main and renderer:

```javascript
// Renderer → Main
ipcRenderer.invoke('save-file', data)
ipcRenderer.invoke('open-file')

// Main → Renderer
mainWindow.webContents.send('file-opened', content)
```
