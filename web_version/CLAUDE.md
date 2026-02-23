# CLAUDE.md
<!-- Created: 2026-02-03 -->

This file provides guidance to Claude Code (claude.ai/code) when working with the **Web Version** of the park golf PWA.

## Overview

Web version is a **PWA (Progressive Web App)** that runs in browsers and can be installed on devices. It works fully offline with localStorage persistence.

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

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- vite-plugin-pwa (Workbox)

## Architecture

### Project Structure

```
src/
├── App.jsx                              # Root component, handles screen routing
├── components/
│   ├── tournament/
│   │   └── TournamentList.jsx           # Tournament list screen
│   ├── score/
│   │   └── ScoreTable.jsx               # Score input screen
│   ├── summary/
│   │   ├── SummaryPage.jsx              # Summary/ranking page with tabs
│   │   └── tabs/
│   │       ├── OverviewTab.jsx          # 전체 현황 tab
│   │       ├── IndividualTab.jsx        # 개인전 tab
│   │       ├── EncouragementTab.jsx     # 장려상 tab
│   │       └── TeamTab.jsx             # 단체전 tab
│   └── club/
│       ├── ClubManagement.jsx           # Club list & management screen
│       └── ClubMemberList.jsx           # Club member list screen
├── hooks/
│   ├── useTournaments.js                # Tournament CRUD operations
│   ├── useRanking.js                    # Ranking calculation hook
│   ├── useClubs.js                      # Club CRUD operations (IndexedDB)
│   └── useMembers.js                    # Member CRUD operations (IndexedDB)
└── utils/
    ├── data.js                          # Data initialization, localStorage I/O
    ├── db.js                            # IndexedDB setup (clubs, members)
    └── ranking.js                       # Ranking calculation functions
```

### Data Persistence

- **Tournaments**: localStorage (`parkgolf-tournaments`, `parkgolf-current-tournament`)
- **Clubs & Members**: IndexedDB (`parkgolf-db`)
- **No external API calls** - all data is local

### PWA Configuration

PWA settings are in `vite.config.js` using `vite-plugin-pwa` with Workbox for offline caching.

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
