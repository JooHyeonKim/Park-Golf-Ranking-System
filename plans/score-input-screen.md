# 파크골프 점수 입력 화면 - 상세 설계 문서

## 문서 개요

본 문서는 파크골프 대회 관리 시스템의 **점수 입력 화면**에 대한 상세 설계 및 구현 계획을 담고 있습니다.

- **작성일**: 2026-02-01
- **대상**: 점수 입력 화면 기능 구체화 및 보완
- **참조**: [CLAUDE.md](../../../Downloads/park-golf-pwa/CLAUDE.md)

---

## 1. 화면 개요

### 1.1 목적
- 144명의 선수에 대한 36홀 점수 입력 및 관리
- 실시간 순위 계산 및 표시
- 정렬 기능을 통한 다양한 뷰 제공

### 1.2 핵심 기능
- ✓ 선수별 4개 코스(A, B, C, D) 점수 입력
- ✓ 자동 합계 계산 (A+B, C+D, 36홀 합계)
- ✓ 실시간 순위 계산 (동점자 처리 포함)
- ✓ 정렬 전환 (순위순 ↔ 조순)
- ◯ 상세 점수 입력 모달 (향후 구현)

---

## 2. UI/UX 구성

### 2.1 화면 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│ ← [뒤로가기]  [대회명-날짜]  [등수계산] [순위순|조순] ◀─ 헤더
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 조 │ 코스│ 성명 │ 클럽 │ A │ B │A+B│ C │ D │C+D│합계│순위│ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 1 │A-1 │[입력]│[입력]│[3]│[4]│ 7 │[3]│[5]│ 8 │ 15│ - │ │
│ │ 1 │A-1 │[입력]│[입력]│[3]│[4]│ 7 │[4]│[3]│ 7 │ 14│ - │ │
│ │ 2 │A-2 │[입력]│[입력]│[4]│[5]│ 9 │[3]│[4]│ 7 │ 16│ - │ │
│ │...                                                      │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
      ↑ 144행 × 12열 테이블 (스크롤 가능)
      ↑ 조: 1~36 숫자, 코스: A-1~D-9 문자열
      ↑ 순위: "-" (미계산 상태, "등수 계산하기" 버튼 클릭 필요)

[등수 계산하기 버튼 클릭 후]
┌──────────────────────────────────────────────────────────────┐
│ ← [뒤로가기]  [대회명-날짜]  [등수계산] [순위순|조순] ◀─ 헤더
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 조 │ 코스│ 성명 │ 클럽 │ A │ B │A+B│ C │ D │C+D│합계│순위│ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 1 │A-1 │[입력]│[입력]│[3]│[4]│ 7 │[3]│[5]│ 8 │ 15│ 2 │ │
│ │ 1 │A-1 │[입력]│[입력]│[3]│[4]│ 7 │[4]│[3]│ 7 │ 14│ 1 │ │
│ │ 2 │A-2 │[입력]│[입력]│[4]│[5]│ 9 │[3]│[4]│ 7 │ 16│ 3 │ │
│ │...                                                      │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
      ↑ 순위 계산 완료! (조순 정렬 유지)
      ↑ 점수 수정 시 순위가 다시 "-"로 초기화됨
```

### 2.2 헤더 구성 요소

#### 뒤로가기 버튼
- 위치: 좌측 상단
- 아이콘: `←` 화살표
- 액션: 대회 목록 화면으로 이동
- 스타일: `hover:bg-green-700` 효과

#### 대회 정보 표시
- 위치: 중앙
- 내용: `{대회명} - {날짜}`
- 예시: "2026 봄 대회 - 2026-03-15"
- 스타일: 굵은 글씨 (`font-bold`)

#### 등수 계산하기 버튼 (신규)
- 위치: 우측 (정렬 버튼 왼쪽)
- 텍스트: "등수 계산하기"
- 배경색: `bg-blue-600 hover:bg-blue-700`
- 액션: 순위 계산 및 표시
- 동작:
  1. 클릭 시 `isRankingCalculated = true`
  2. 순위 열에 순위 표시 (1, 2, 3, ...)
  3. 정렬은 변경하지 않음 (현재 정렬 유지)

#### 정렬 토글 버튼
- 위치: 우측 상단
- 상태: `순위순` ↔ `조순`
- 배경색: 활성 상태 `bg-green-600`
- 액션: `sortBy` 상태 전환
- 참고: 순위가 미계산 상태에서도 버튼은 작동하지만, 순위순 정렬 시 순위 "-"로 표시됨

---

### 2.3 점수 입력 표 (12개 열)

| # | 열 이름 | 너비 | 타입 | 색상 | 비고 |
|---|---------|------|------|------|------|
| 1 | 조 | 60px | 읽기전용 | 회색 (`bg-gray-100`) | 1 ~ 36 (조 번호) |
| 2 | 코스 | 60px | 읽기전용 | 회색 | A-1 ~ D-9 (코스명) |
| 3 | 성명 | 100px | 입력 | 회색 | `<input type="text">` |
| 4 | 클럽 | 100px | 입력 | 회색 | `<input type="text">` |
| 5 | A코스 | 60px | 입력 | 하늘색 (`bg-sky-100`) | `1-12` |
| 6 | B코스 | 60px | 입력 | 하늘색 | `1-12` |
| 7 | A+B | 60px | 계산값 | 하늘색 | `scoreA + scoreB` |
| 8 | C코스 | 60px | 입력 | 연두색 (`bg-lime-100`) | `1-12` |
| 9 | D코스 | 60px | 입력 | 연두색 | `1-12` |
| 10 | C+D | 60px | 계산값 | 연두색 | `scoreC + scoreD` |
| 11 | 36홀 합계 | 80px | 계산값 | 노란색 (`bg-yellow-100`) | `A+B+C+D` |
| 12 | 순위 | 60px | 계산값 | 빨간색 (`text-red-600`) | 1위부터 |

#### 색상 체계 의미
- **회색**: 선수 기본 정보 (조 번호, 코스명, 이름, 클럽)
- **하늘색**: 전반 18홀 (A코스 + B코스)
- **연두색**: 후반 18홀 (C코스 + D코스)
- **노란색**: 총합계 (36홀)
- **빨간색**: 순위 (강조 표시)

#### 조 번호와 코스명의 관계
- **조 번호**: 1 ~ 36 (숫자, `group` 필드)
- **코스명**: A-1 ~ D-9 (문자열, `course` 필드)
- **매핑**: 1조=A-1, 2조=A-2, 3조=A-3, ..., 9조=A-9, 10조=B-1, ..., 36조=D-9

---

### 2.4 입력 필드 사양

#### 점수 입력 필드 (`<input type="number">`)
```jsx
<input
  type="number"
  min="1"
  max="12"
  className="w-full px-2 py-1 text-center border rounded"
  onChange={handleScoreChange}
/>
```

**특징:**
- 1-12 범위 제한 (파크골프 점수 범위)
- 숫자 키패드 지원 (모바일)
- 빈 값 허용 (미참가 선수)
- 실시간 저장 (`onChange` 즉시 실행)

#### 텍스트 입력 필드 (`<input type="text">`)
```jsx
<input
  type="text"
  placeholder="성명 입력"
  className="w-full px-2 py-1 border rounded"
  onChange={handleInputChange}
/>
```

**특징:**
- 자유 텍스트 입력
- placeholder로 입력 안내
- 자동 저장

---

## 3. 데이터 구조

### 3.1 Player 객체

```javascript
{
  // 기본 정보 (localStorage 저장)
  id: number,              // 1-144 (고유 식별자)
  group: number,           // 조 번호 (1 ~ 36)
  course: string,          // 코스명 ("A-1" ~ "D-9", 36개)
  name: string,            // 선수 성명 (사용자 입력)
  club: string,            // 소속 클럽 (사용자 입력)
  scoreA: number | null,   // A코스 점수 (1-12 또는 null)
  scoreB: number | null,   // B코스 점수
  scoreC: number | null,   // C코스 점수
  scoreD: number | null,   // D코스 점수

  // 상세 점수 (향후 구현)
  detailScores: {
    A1: number | null,
    A2: number | null,
    // ... A9, B1-B9, C1-C9, D1-D9
  } | null,

  // 런타임 계산값 (UI에서만 사용, 저장 안 함)
  ab: number | null,       // A+B 합계
  cd: number | null,       // C+D 합계
  total: number | null,    // 36홀 합계
  rank: number | null      // 순위 (1위부터)
}
```

**중요한 구조적 특징:**
- `group` 필드: **조 번호**를 저장 (1, 2, 3, ..., 36, 숫자 타입)
- `course` 필드: **코스명**을 저장 ("A-1", "A-2", ..., "D-9", 문자열 타입)
- 조 번호와 코스명의 매핑: 1조=A-1, 2조=A-2, ..., 36조=D-9

**데이터 구조 특징:**
- 각 코스(A-1 ~ D-9)마다 4명의 선수
- 같은 조(같은 course) 내 4명은 id로만 구분
- 출발 코스 정보는 별도로 저장하지 않음

### 3.2 조 구성

**총 144명 = 36개 조 × 4명**

| 조 번호 | 코스명 | 선수 수 | 출발 코스 |
|---------|--------|---------|-----------|
| 1 | A-1 | 4명 | A, B, C, D |
| 2 | A-2 | 4명 | A, B, C, D |
| ... | ... | ... | ... |
| 9 | A-9 | 4명 | A, B, C, D |
| 10 | B-1 | 4명 | A, B, C, D |
| ... | ... | ... | ... |
| 18 | B-9 | 4명 | A, B, C, D |
| 19 | C-1 | 4명 | A, B, C, D |
| ... | ... | ... | ... |
| 27 | C-9 | 4명 | A, B, C, D |
| 28 | D-1 | 4명 | A, B, C, D |
| ... | ... | ... | ... |
| 36 | D-9 | 4명 | A, B, C, D |

**각 조의 4명 구성:**
- 같은 조(같은 group, 같은 course)에 4명의 선수
- 4명은 id로만 구분 (연속된 id)
- 출발 위치 정보는 별도로 저장하지 않음

**예시: 1조 (A-1 코스)**
```javascript
{ id: 1, group: 1, course: "A-1", ... }  // 1조 1번 선수
{ id: 2, group: 1, course: "A-1", ... }  // 1조 2번 선수
{ id: 3, group: 1, course: "A-1", ... }  // 1조 3번 선수
{ id: 4, group: 1, course: "A-1", ... }  // 1조 4번 선수
```

**예시: 2조 (A-2 코스)**
```javascript
{ id: 5, group: 2, course: "A-2", ... }  // 2조 1번 선수
{ id: 6, group: 2, course: "A-2", ... }  // 2조 2번 선수
{ id: 7, group: 2, course: "A-2", ... }  // 2조 3번 선수
{ id: 8, group: 2, course: "A-2", ... }  // 2조 4번 선수
```

---

## 4. 기능 명세

### 4.1 점수 입력

#### 입력 흐름
```
사용자 입력 (점수 필드)
  ↓
handleScoreChange() 이벤트 핸들러
  ↓
setIsRankingCalculated(false)  // 순위 초기화
  ↓
onUpdatePlayer(tournamentId, playerId, updates) 콜백
  ↓
useTournaments.updatePlayer() 훅
  ↓
localStorage 자동 저장
  ↓
상태 업데이트 (tournaments)
  ↓
ScoreTable 재렌더링
  ↓
순위 열에 "-" 표시 (isRankingCalculated = false)
```

#### 등수 계산 흐름
```
"등수 계산하기" 버튼 클릭
  ↓
handleCalculateRanking() 이벤트 핸들러
  ↓
setIsRankingCalculated(true)
  ↓
ScoreTable 재렌더링
  ↓
useRanking() 순위 계산 (useMemo)
  ↓
UI 업데이트 (순위 표시)
  ↓
정렬은 변경하지 않음 (현재 sortBy 유지)
```

#### 검증 규칙
1. **점수 범위**: 1-12 (파크골프 표준)
2. **빈 값 허용**: 미참가 선수는 null로 저장
3. **즉시 저장**: 입력 즉시 localStorage에 반영
4. **타입 변환**: `parseInt()` 또는 `null`

---

### 4.2 자동 계산

#### 계산 필드

**A+B (전반 18홀 합계)**
```javascript
calculateAB(player) {
  if (player.scoreA === null || player.scoreB === null) return null;
  return player.scoreA + player.scoreB;
}
```

**C+D (후반 18홀 합계)**
```javascript
calculateCD(player) {
  if (player.scoreC === null || player.scoreD === null) return null;
  return player.scoreC + player.scoreD;
}
```

**36홀 합계 (Total)**
```javascript
calculateTotal(player) {
  const scores = [player.scoreA, player.scoreB, player.scoreC, player.scoreD];
  if (scores.some(s => s === null)) return null;
  return scores.reduce((sum, score) => sum + score, 0);
}
```

#### 계산 타이밍
- 입력 즉시 (onChange)
- useMemo 최적화로 불필요한 재계산 방지
- 렌더링 시점에 실시간 계산

---

### 4.3 순위 계산 로직

#### 구현 파일
- **`src/utils/ranking.js`**: 순위 계산 알고리즘 (183줄)
- **`src/hooks/useRanking.js`**: React Hook으로 래핑 (75줄)

#### 순위 결정 기준 (우선순위 순)

**1차: 36홀 합계** (오름차순)
```javascript
// 점수가 낮을수록 높은 순위
if (totalA !== totalB) {
  return totalA - totalB;  // 오름차순
}
```

**2차: 동점자 처리** (코스별 비교)
```javascript
// D → C → B → A 순서로 비교 (역순)
if (playerA.scoreD !== playerB.scoreD) {
  return playerA.scoreD - playerB.scoreD;
}
if (playerA.scoreC !== playerB.scoreC) {
  return playerA.scoreC - playerB.scoreC;
}
if (playerA.scoreB !== playerB.scoreB) {
  return playerA.scoreB - playerB.scoreB;
}
if (playerA.scoreA !== playerB.scoreA) {
  return playerA.scoreA - playerB.scoreA;
}
```

**3차: 상세 점수 비교** (홀별, 향후 구현)
```javascript
// D9 → D8 → ... → C1 → ... → A1 순서로 비교
compareDetailScores(playerA, playerB) {
  const courses = ['D', 'C', 'B', 'A'];
  for (const course of courses) {
    for (let hole = 9; hole >= 1; hole--) {
      const scoreA = playerA.detailScores?.[`${course}${hole}`];
      const scoreB = playerB.detailScores?.[`${course}${hole}`];
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
    }
  }
  return 0;  // 완전 동점
}
```

#### 동순위 처리
- 완전히 같은 점수일 경우 같은 순위 부여
- 다음 순위는 건너뜀 (예: 1위, 1위, 3위)

---

### 4.4 정렬 기능

#### 정렬 모드

**순위순 정렬**
```javascript
sortBy: 'rank'
  ↓
players.sort((a, b) => {
  // 점수 미입력 선수는 맨 아래
  if (a.total === null) return 1;
  if (b.total === null) return -1;
  // 순위 기준 정렬
  return a.rank - b.rank;
})
```

**조순 정렬**
```javascript
sortBy: 'group'
  ↓
players.sort((a, b) => {
  // 조 번호 기준 정렬 (1 → 2 → ... → 36)
  if (a.group !== b.group) {
    return a.group - b.group;  // 숫자 비교
  }
  // 같은 조 내에서 id 순서로 정렬
  return a.id - b.id;
})
```

**UI 표시:**
```javascript
// 렌더링 시
<td>{player.group}</td>    // 조 번호 (1-36, 이미 숫자)
<td>{player.course}</td>   // 코스명 (A-1, A-2, ..., D-9)
```

#### 토글 UI
```jsx
<button
  onClick={() => setSortBy('rank')}
  className={`px-3 py-1 rounded ${sortBy === 'rank' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
>
  순위순
</button>
<button
  onClick={() => setSortBy('group')}
  className={`px-3 py-1 rounded ${sortBy === 'group' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
>
  조순
</button>
```

**정렬 효과:**
- **순위순**: 1위, 2위, 3위... 순서로 표시 (점수 낮은 순)
- **조순**: 1조(A-1), 2조(A-2), 3조(A-3)... 36조(D-9) 순서로 표시

---

## 5. 컴포넌트 구조

### 5.1 파일 구성

```
src/
├── components/
│   └── score/
│       └── ScoreTable.jsx          # 점수 입력 표 (200줄)
│           ├── Header               # 헤더 (뒤로가기, 대회명, 정렬)
│           ├── Table                # 테이블 구조
│           │   ├── TableHeader     # 12개 열 헤더
│           │   └── TableBody       # 144개 행
│           │       └── ScoreRow    # 각 선수 행 (12개 셀)
│           └── Event Handlers      # 입력 이벤트 처리
│
├── hooks/
│   ├── useRanking.js               # 순위 계산 훅 (75줄)
│   └── useTournaments.js           # 상태 관리 훅 (116줄)
│
└── utils/
    ├── ranking.js                  # 순위 알고리즘 (183줄)
    └── data.js                     # 데이터 CRUD (165줄)
```

### 5.2 컴포넌트 계층

```
App.jsx (라우터)
  ↓
ScoreTable.jsx (점수 입력 화면)
  ├── props.tournament (대회 정보)
  ├── props.onBack (뒤로가기)
  ├── props.onUpdatePlayer (점수 업데이트)
  └── useRanking(players, sortBy)
      ↓
      ranked & sorted players 배열
```

### 5.3 주요 Props 인터페이스

```typescript
// ScoreTable.jsx
interface ScoreTableProps {
  tournament: Tournament;              // 현재 대회
  onBack: () => void;                  // 뒤로가기 콜백
  onUpdatePlayer: (                    // 점수 업데이트 콜백
    tournamentId: number,
    playerId: number,
    updates: Partial<Player>
  ) => void;
}
```

---

## 6. 상태 관리

### 6.1 로컬 상태 (ScoreTable.jsx)

```javascript
// 정렬 모드
const [sortBy, setSortBy] = useState('group');  // 초기값: 조순

// 순위 계산 여부
const [isRankingCalculated, setIsRankingCalculated] = useState(false);

// 순위 계산 (메모이제이션)
// isRankingCalculated가 true일 때만 순위 계산
const rankedPlayers = useRanking(tournament.players, sortBy, isRankingCalculated);
```

### 6.2 전역 상태 (useTournaments.js)

```javascript
// 모든 대회 목록
const [tournaments, setTournaments] = useState([]);

// 현재 선택된 대회
const [currentTournament, setCurrentTournament] = useState(null);

// 업데이트 함수
const updatePlayer = (tournamentId, playerId, updates) => {
  // 1. 상태 업데이트
  setTournaments(prev => /* ... */);

  // 2. localStorage 저장
  saveTournaments(updatedTournaments);
};
```

### 6.3 localStorage 구조

```javascript
// 키: "parkgolf-tournaments"
{
  tournaments: [
    {
      id: 1704067200000,
      name: "2026 봄 대회",
      date: "2026-03-15",
      createdAt: 1704067200000,
      players: [ /* 144개 Player 객체 */ ]
    },
    // ... 다른 대회들
  ]
}

// 키: "parkgolf-current-tournament"
1704067200000  // 현재 선택된 대회 ID
```

---

## 7. 성능 최적화

### 7.1 메모이제이션

**useRanking.js (수정됨)**
```javascript
export function useRanking(players, sortBy, isRankingCalculated) {
  return useMemo(() => {
    // 순위 계산 (isRankingCalculated가 true일 때만)
    const ranked = isRankingCalculated
      ? calculateRankings(players)
      : players.map(p => ({ ...p, rank: null }));  // 순위 미계산

    // 정렬 (비용이 큰 작업)
    return sortPlayers(ranked, sortBy);
  }, [players, sortBy, isRankingCalculated]);
}
```

**효과:**
- 불필요한 재계산 방지
- **"등수 계산하기" 버튼 클릭 시에만 순위 계산**
- 입력 시 순위 재계산 안 함 (표 순서 유지)
- UI 반응성 향상

### 7.2 입력 최적화

**디바운싱 없음 (즉시 저장)**
- localStorage 쓰기는 매우 빠름 (~1ms)
- 사용자 경험 우선 (입력 즉시 반영)
- 네트워크 요청 없음

### 7.3 렌더링 최적화

**가능한 개선 사항 (향후):**
- `React.memo`로 ScoreRow 메모이제이션
- 가상 스크롤 (react-window) 도입
- 144행 → 보이는 행만 렌더링

---

## 8. 향후 개선 사항

### 8.1 상세 점수 입력 모달 (우선순위: 높음)

**필요성:**
- 코스별 점수까지 동점일 경우 홀별 비교 필요
- 현재는 `detailScores: null`로 비어 있음

**UI 설계:**
- 코스 탭 순서: D → C → B → A (동점자 비교 순서와 일치)
- 초기 선택 탭: D코스
- 홀 표시 순서: 9번홀 → 1번홀 (내림차순, 동점자 비교 순서와 일치)

```
┌─────────────────────────────────┐
│     홀별 상세 점수 입력          │
├─────────────────────────────────┤
│ [D코스] [C코스] [B코스] [A코스]  │
├─────────────────────────────────┤
│ 홀  PAR  타수                    │
│  9    4   [  ]                   │
│  8    3   [  ]                   │
│  7    4   [  ]                   │
│  ...                             │
│  1    3   [  ]                   │
│                                  │
│ D코스 합계: --                   │
│         [저장]  [취소]            │
└─────────────────────────────────┘
```

**컴포넌트:**
- `src/components/score/DetailScoreModal.jsx` (신규 생성)

**트리거:**
- 순위 셀 클릭 시 모달 열기
- 또는 "상세 입력" 버튼 추가

**데이터 구조:**
```javascript
detailScores: {
  A1: 3, A2: 4, A3: 3, ..., A9: 4,
  B1: 3, B2: 4, ..., B9: 4,
  C1: 4, C2: 3, ..., C9: 3,
  D1: 5, D2: 3, ..., D9: 4
}
```

---

### 8.2 ScoreRow 컴포넌트 분리 (우선순위: 중간)

**현재 상황:**
- ScoreTable.jsx 내에서 인라인 렌더링 (200줄)

**개선 방향:**
```jsx
// src/components/score/ScoreRow.jsx (신규)
export function ScoreRow({ player, onUpdate }) {
  return (
    <tr>
      <td>{player.group}</td>
      <td>{player.course}</td>
      {/* ... 12개 셀 */}
    </tr>
  );
}
```

**효과:**
- 코드 가독성 향상
- React.memo로 성능 최적화 가능

---

### 8.3 입력 검증 강화 (우선순위: 낮음)

**현재 상황:**
- `min="1" max="12"` HTML 속성만 사용
- 브라우저에서 강제하지 않을 수 있음

**개선 방향:**
```javascript
handleScoreChange(playerId, field, value) {
  const score = parseInt(value);

  // 검증
  if (isNaN(score) || score < 1 || score > 12) {
    alert('점수는 1-12 사이여야 합니다.');
    return;
  }

  onUpdatePlayer(tournamentId, playerId, { [field]: score });
}
```

**추가 검증:**
- 음수 방지
- 소수점 방지
- 범위 외 값 거부

---

### 8.4 데이터 내보내기/가져오기 (우선순위: 높음)

**CLAUDE.md 요구사항:**
> 정기적으로 "데이터 내보내기" 기능 사용
> JSON 파일을 안전한 곳에 백업

**기능 명세:**

**내보내기 버튼**
```jsx
<button onClick={handleExport}>
  데이터 내보내기
</button>
```

**구현:**
```javascript
function handleExport() {
  const data = JSON.stringify(tournaments, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `parkgolf-backup-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}
```

**가져오기:**
```javascript
function handleImport(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    setTournaments(data);
    saveTournaments(data);
  };
  reader.readAsText(file);
}
```

---

### 8.5 반응형 UI 개선 (우선순위: 중간)

**현재 상황:**
- Tailwind CSS로 기본 반응형 지원
- 모바일에서 12개 열이 좁을 수 있음

**개선 방향:**

**데스크톱 (>= 1024px)**
- 12개 열 전부 표시

**태블릿 (768px ~ 1023px)**
- 중요 열만 표시: 조, 성명, A, B, C, D, 36홀 합계, 순위
- A+B, C+D 열 숨기기

**모바일 (< 768px)**
- 카드 레이아웃으로 전환
- 아코디언 형식으로 접기/펼치기

---

## 9. 에러 처리 및 예외 상황

### 9.1 예외 상황

**미참가 선수 (점수 미입력)**
```javascript
// scoreA, scoreB, scoreC, scoreD 중 하나라도 null
player.total === null
  ↓
// 순위 계산에서 제외
// 정렬 시 맨 아래 배치
```

**부분 입력 (일부만 입력)**
```javascript
// scoreA: 3, scoreB: 4, scoreC: null, scoreD: null
calculateTotal(player) === null  // null 반환
  ↓
A+B는 7로 표시 (부분합 허용)
36홀 합계는 '-' 표시 (계산 불가)
```

**잘못된 입력 범위**
```javascript
// 1 미만 또는 12 초과
handleScoreChange(playerId, 'scoreA', 15) {
  // HTML min/max로 방지
  // 또는 JavaScript 검증 추가 (향후)
}
```

---

### 9.2 에러 경계 (Error Boundary)

**현재 상황:**
- Error Boundary 없음

**개선 방향:**
```jsx
// src/components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>오류가 발생했습니다. 새로고침해주세요.</div>;
    }
    return this.props.children;
  }
}

// App.jsx
<ErrorBoundary>
  <ScoreTable ... />
</ErrorBoundary>
```

---

## 10. 테스트 시나리오

### 10.1 등수 계산 버튼 테스트

**시나리오 1: 등수 계산하기 버튼 동작**
1. 여러 선수 점수 입력
2. 순위 열 확인 → "-" 표시
3. "등수 계산하기" 버튼 클릭
4. 순위 열 확인 → 순위 숫자 표시 (1, 2, 3, ...)
5. 표 순서 확인

**예상 결과:**
- ✓ 버튼 클릭 전: 순위 "-"
- ✓ 버튼 클릭 후: 순위 계산됨
- ✓ 조순 정렬 유지 (표 순서 변경 없음)

---

**시나리오 2: 점수 수정 시 순위 초기화**
1. 점수 입력 후 "등수 계산하기" 클릭 (순위 표시됨)
2. 특정 선수의 점수 수정
3. 순위 열 확인 → "-"로 초기화됨
4. "등수 계산하기" 버튼 다시 클릭
5. 순위 재계산됨

**예상 결과:**
- ✓ 점수 수정 시 순위 즉시 초기화
- ✓ 다시 버튼 클릭하면 순위 재계산
- ✓ 조순 정렬 유지

---

### 10.2 기본 입력 테스트

**시나리오 1: 정상 입력 (순위 계산 포함)**
1. ScoreTable 화면 진입
2. A-1조 1번 선수 선택
3. 성명 입력: "홍길동"
4. 클럽 입력: "서울CC"
5. A코스: 3, B코스: 4, C코스: 3, D코스: 5 입력
6. 확인: A+B=7, C+D=8, 36홀 합계=15 표시, **순위="-"**
7. "등수 계산하기" 버튼 클릭
8. 순위 확인: 1위로 표시

**예상 결과:**
- ✓ 모든 합계 자동 계산
- ✓ 버튼 클릭 전에는 순위 "-" 표시
- ✓ 버튼 클릭 후 순위 1위로 표시
- ✓ localStorage 저장 확인
- ✓ 조순 정렬 유지 (표 순서 변경 없음)

---

**시나리오 2: 부분 입력**
1. A-2조 1번 선수 선택
2. 성명: "김철수", A코스: 3, B코스: 4만 입력
3. C코스, D코스는 비워둠
4. "등수 계산하기" 버튼 클릭

**예상 결과:**
- ✓ A+B=7 표시
- ✓ C+D='-' 표시 (null)
- ✓ 36홀 합계='-' 표시 (null)
- ✓ 순위='-' 표시 (36홀 합계가 없어서 순위 계산 불가)
- ✓ 조순 정렬에서는 위치 변경 없음

---

### 10.3 순위 계산 테스트

**시나리오 3: 동점자 처리**
1. 선수 1: scoreA=3, scoreB=4, scoreC=3, scoreD=5 (합계=15)
2. 선수 2: scoreA=3, scoreB=4, scoreC=4, scoreD=4 (합계=15)
3. 순위 확인

**예상 결과:**
- ✓ 선수 1 순위 > 선수 2 순위 (D코스 5 > 4)

---

**시나리오 4: 완전 동점**
1. 선수 1: scoreA=3, scoreB=4, scoreC=3, scoreD=5 (합계=15)
2. 선수 2: scoreA=3, scoreB=4, scoreC=3, scoreD=5 (합계=15)
3. 순위 확인

**예상 결과:**
- ✓ 둘 다 같은 순위 (예: 1위, 1위)
- ✓ 다음 선수는 3위로 표시

---

### 10.4 정렬 테스트

**시나리오 5: 순위순 → 조순 전환**
1. 여러 선수 점수 입력 (무작위 순위)
2. 정렬 버튼 클릭 (순위순 → 조순)
3. 표 확인

**예상 결과:**
- ✓ 1조(A-1)부터 36조(D-9)까지 순서대로 표시
- ✓ 조 번호가 1, 1, 1, 1, 2, 2, 2, 2, ... 36, 36, 36, 36 순서로 표시
- ✓ 코스명이 A-1, A-1, A-1, A-1, A-2, A-2, ... D-9, D-9 순서로 표시
- ✓ 각 조 내에서 출발점별 정렬 (A → B → C → D)

---

**시나리오 6: 조순 → 순위순 전환**
1. 조순 상태에서 정렬 버튼 클릭
2. 표 확인

**예상 결과:**
- ✓ 1위부터 꼴등까지 순서대로 표시
- ✓ 미입력 선수는 맨 아래
- ✓ 조 번호가 뒤섞여 표시 (예: 5, 12, 3, 28, ...)
- ✓ 코스명도 뒤섞여 표시 (예: A-5, B-3, A-3, D-1, ...)

---

### 10.5 오프라인 테스트

**시나리오 7: 네트워크 끊김**
1. 점수 입력 중 네트워크 차단 (개발자 도구)
2. 계속 입력
3. 뒤로가기 후 다시 진입

**예상 결과:**
- ✓ 네트워크 없이도 정상 작동
- ✓ 입력 데이터 유지
- ✓ localStorage에 저장됨

---

### 10.6 성능 테스트

**시나리오 8: 대량 입력**
1. 144명 모두 점수 입력
2. 정렬 전환 반복 (순위순 ↔ 조순)

**예상 결과:**
- ✓ 정렬 전환 시 지연 없음 (<100ms)
- ✓ useMemo로 최적화 확인
- ✓ 메모리 누수 없음

---

## 11. 핵심 파일 경로

### 11.1 컴포넌트
- [src/components/score/ScoreTable.jsx](../../../Downloads/park-golf-pwa/src/components/score/ScoreTable.jsx) - 점수 입력 표 (200줄)
- [src/components/tournament/TournamentList.jsx](../../../Downloads/park-golf-pwa/src/components/tournament/TournamentList.jsx) - 대회 목록

### 11.2 Hooks
- [src/hooks/useRanking.js](../../../Downloads/park-golf-pwa/src/hooks/useRanking.js) - 순위 계산 훅 (75줄)
- [src/hooks/useTournaments.js](../../../Downloads/park-golf-pwa/src/hooks/useTournaments.js) - 상태 관리 훅 (116줄)

### 11.3 Utils
- [src/utils/ranking.js](../../../Downloads/park-golf-pwa/src/utils/ranking.js) - 순위 알고리즘 (183줄)
- [src/utils/data.js](../../../Downloads/park-golf-pwa/src/utils/data.js) - 데이터 CRUD (165줄)

### 11.4 메인
- [src/App.jsx](../../../Downloads/park-golf-pwa/src/App.jsx) - 라우팅 (70줄)

---

## 12. 구현 검증 체크리스트

### 12.1 현재 구현 완료 (✓)

- [x] 144명 선수 데이터 구조
- [x] 36개 조 자동 생성 (1조=A-1, 2조=A-2, ..., 36조=D-9)
- [x] 4개 출발 코스 시스템 (A, B, C, D) - 내부 데이터
- [x] 점수 입력 UI (12개 열)
- [x] 색상 구분 (회색, 하늘색, 연두색, 노란색, 빨간색)
- [x] 자동 합계 계산 (A+B, C+D, 36홀)
- [x] 순위 계산 (1차: 36홀 합계)
- [x] 동점자 처리 (2차: 코스별 비교 D→C→B→A)
- [x] 정렬 기능 (순위순 ↔ 조순)
- [x] localStorage 자동 저장
- [x] 반응형 UI (Tailwind CSS)
- [x] 오프라인 작동 (PWA)

### 12.2 즉시 구현 필요 (🔴 우선순위 높음)

- [ ] **데이터 구조 수정** (data.js)
  - [ ] `group` 필드를 숫자(1~36)로 변경
  - [ ] `course` 필드를 코스명("A-1"~"D-9")으로 변경
  - [ ] createInitialPlayers() 함수 수정
- [ ] **"등수 계산하기" 버튼 추가** (UX 개선)
  - [ ] 헤더에 버튼 추가
  - [ ] `isRankingCalculated` 상태 관리
  - [ ] 점수 입력 시 순위 초기화
  - [ ] useRanking 훅 수정 (조건부 순위 계산)
- [ ] **UI 표시 수정** (ScoreTable.jsx)
  - [ ] 조 열에 player.group 직접 표시 (이미 숫자)
  - [ ] 코스 열에 player.course 직접 표시 (이미 A-1 형태)
  - [ ] 정렬 로직 수정 (group이 숫자이므로 숫자 비교)

### 12.3 향후 구현 필요 (◯)

- [ ] 상세 점수 입력 모달 (DetailScoreModal.jsx)
- [ ] 3차 동점자 처리 (홀별 상세 비교 D9→...→A1)
- [ ] ScoreRow 컴포넌트 분리
- [ ] 데이터 내보내기/가져오기 기능
- [ ] 입력 검증 강화 (JavaScript)
- [ ] Error Boundary 추가
- [ ] 가상 스크롤 (react-window)
- [ ] 모바일 카드 레이아웃

---

## 13. 참고 자료

### 13.1 관련 문서
- [CLAUDE.md](../../../Downloads/park-golf-pwa/CLAUDE.md) - 프로젝트 전체 기술 문서
- [README.md](../../../Downloads/park-golf-pwa/README.md) - 프로젝트 설명

### 13.2 기술 스택 문서
- React 18: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Vite: https://vitejs.dev
- PWA: https://web.dev/progressive-web-apps

---

## 14. CLAUDE.md 수정 사항

plan mode 종료 후 [CLAUDE.md](../../../Downloads/park-golf-pwa/CLAUDE.md) 파일에 다음 내용을 반영해야 합니다:

### 14.1 점수 입력 화면 섹션 수정

**위치**: [CLAUDE.md:125-147](../../../Downloads/park-golf-pwa/CLAUDE.md#L125-L147)

**수정 전:**
```markdown
### 2. 점수 입력 화면

**헤더:**
- 뒤로 가기 버튼
- 대회명 및 날짜 표시
- 정렬 토글: 순위순 / 조순

**점수 입력 표:**
| 조 | 코스 | 성명 | 클럽 | A코스 | B코스 | A+B | C코스 | D코스 | C+D | 36홀 합계 | 순위 |
|----|------|------|------|-------|-------|-----|-------|-------|-----|-----------|------|

**색상 구분:**
- 회색: 조, 코스, 성명, 클럽, 순위
- 하늘색: A코스, B코스, A+B
- 연두색: C코스, D코스, C+D
- 노란색: 36홀 합계

**자동 계산:**
- A+B = A코스 + B코스
- C+D = C코스 + D코스
- 36홀 합계 = A + B + C + D
- 순위 = 36홀 합계 기준 (낮을수록 높은 순위)
```

**수정 후:**
```markdown
### 2. 점수 입력 화면

**헤더:**
- 뒤로 가기 버튼
- 대회명 및 날짜 표시
- **등수 계산하기 버튼** (신규)
- 정렬 토글: 순위순 / 조순

**점수 입력 표:**
| 조 | 코스 | 성명 | 클럽 | A코스 | B코스 | A+B | C코스 | D코스 | C+D | 36홀 합계 | 순위 |
|----|------|------|------|-------|-------|-----|-------|-------|-----|-----------|------|
| 1  | A-1  | ... | ... | ...   | ...   | ... | ...   | ...   | ... | ...       | -    |

**조 / 코스 구조:**
- **조**: 1 ~ 36 (숫자)
- **코스**: A-1 ~ D-9 (문자열)
- **매핑**: A-1=1조, A-2=2조, ..., D-9=36조

**색상 구분:**
- 회색: 조, 코스, 성명, 클럽
- 하늘색: A코스, B코스, A+B
- 연두색: C코스, D코스, C+D
- 노란색: 36홀 합계
- 빨간색: 순위 (등수 계산 후)

**자동 계산:**
- A+B = A코스 + B코스
- C+D = C코스 + D코스
- 36홀 합계 = A + B + C + D

**순위 계산:**
- 초기 상태: 순위 "-" 표시
- "등수 계산하기" 버튼 클릭 → 순위 계산 및 표시
- 점수 수정 시 → 순위 초기화 ("-"), 다시 버튼 클릭 필요
- 정렬은 조순 유지 (입력 중 표 순서 변경 방지)
```

### 14.2 데이터 구조 섹션 수정

**위치**: [CLAUDE.md:63-79](../../../Downloads/park-golf-pwa/CLAUDE.md#L63-L79)

**수정 후:**
```markdown
### Player (선수)
```javascript
{
  id: number,
  group: number,          // 조 번호 (1 ~ 36)
  course: string,         // 코스명 (A-1 ~ D-9)
  name: string,           // 성명
  club: string,           // 클럽
  scoreA: number | null,  // A코스 점수
  scoreB: number | null,  // B코스 점수
  scoreC: number | null,  // C코스 점수
  scoreD: number | null,  // D코스 점수
  detailScores: {         // 상세 점수 (동점자용, 향후 구현)
    A1-A9, B1-B9, C1-C9, D1-D9: number | null
  } | null
}
```

**중요:**
- `group` 필드: **조 번호**를 저장합니다 (1, 2, 3, ..., 36, 숫자 타입)
- `course` 필드: **코스명**을 저장합니다 (A-1, A-2, ..., D-9, 문자열 타입)
- 매핑: 1조=A-1, 2조=A-2, ..., 36조=D-9
```

### 14.3 사용 방법 섹션 수정

**위치**: [CLAUDE.md:205-224](../../../Downloads/park-golf-pwa/CLAUDE.md#L205-L224)

**수정 전:**
```markdown
### 2. 점수 입력

**조 구성:**
- A-1 ~ D-9까지 36개 조가 자동 생성됨
- 각 조마다 4명씩 (총 144명)

**선수 정보 입력:**
1. 성명 칸에 이름 입력
2. 클럽 칸에 소속 클럽 입력

**점수 입력:**
1. A코스, B코스, C코스, D코스 점수 입력
2. A+B, C+D, 36홀 합계 자동 계산
3. 순위 자동 업데이트 (빨간색 숫자)

**입력 팁:**
- 점수는 1-12 범위로 입력
- 빈 칸은 미입력 상태 (참가하지 않은 선수)
- 입력 즉시 자동 저장됨
```

**수정 후:**
```markdown
### 2. 점수 입력

**조 구성:**
- 1조(A-1) ~ 36조(D-9)까지 36개 조가 자동 생성됨
- 각 조마다 4명씩 (총 144명)

**선수 정보 입력:**
1. 성명 칸에 이름 입력
2. 클럽 칸에 소속 클럽 입력

**점수 입력:**
1. A코스, B코스, C코스, D코스 점수 입력
2. A+B, C+D, 36홀 합계 자동 계산
3. 순위는 "-"로 표시 (미계산)

**등수 계산:**
1. "등수 계산하기" 버튼 클릭
2. 순위가 계산되어 표시됨 (빨간색 숫자)
3. 점수 수정 시 순위가 다시 "-"로 초기화
4. 다시 버튼을 클릭하여 순위 재계산

**입력 팁:**
- 점수는 1-12 범위로 입력
- 빈 칸은 미입력 상태 (참가하지 않은 선수)
- 입력 즉시 자동 저장됨
- 입력 중에는 표 순서가 변경되지 않음 (조순 유지)
```

---

## 15. 문서 히스토리

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2026-02-01 | 1.0 | 초안 작성 | Claude |
| 2026-02-01 | 1.1 | 조/코스 구조 수정, 등수 계산 버튼 추가 | Claude |

---

**문서 끝**
