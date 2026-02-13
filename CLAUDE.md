# CLAUDE.md
<!-- Created: 2026-02-03 -->

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Rules

- 모든 질문에 대한 대답은 이 CLAUDE.md 파일을 참고한다
- 없는 말 지어내지 않는다
- 오류 있는 상태로 대답하지 않는다
- 모르면 모른다고 말한다
- 코드 수정 전 반드시 해당 파일을 먼저 읽는다

## Project Versions

This project is split into two versions:

| Version | Folder | Description |
|---------|--------|-------------|
| Web | `web_version/` | PWA for browsers, installable on devices |
| Desktop | `desktop_version/` | Native desktop app (Electron/Tauri) |

Each folder has its own CLAUDE.md with version-specific instructions.

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start development server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
```

## Plan Mode

Plan documents should be saved to the `plans/` folder with the following naming format:
```
plans/YYYY-MM-DD-기능내용.md
```

Example:
```
plans/2026-02-03-사용자인증.md
plans/2026-02-03-데이터내보내기.md
```

## Architecture Overview

This is a **PWA (Progressive Web App)** for managing park golf tournaments. It works fully offline with localStorage persistence.

### Project Structure

```
src/
├── App.jsx                              # Root component, handles screen routing
├── components/
│   ├── tournament/
│   │   └── TournamentList.jsx           # Tournament list screen
│   └── score/
│       └── ScoreTable.jsx               # Score input screen
├── hooks/
│   ├── useTournaments.js                # Tournament CRUD operations
│   └── useRanking.js                    # Ranking calculation hook
└── utils/
    ├── data.js                          # Data initialization, localStorage I/O
    └── ranking.js                       # Ranking calculation functions
```

### Data Flow

- **State Management**: React hooks (`useTournaments`) manage all tournament data
- **Persistence**: localStorage with keys `parkgolf-tournaments` and `parkgolf-current-tournament`
- **No external API calls** - all data is local

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- vite-plugin-pwa (Workbox)
