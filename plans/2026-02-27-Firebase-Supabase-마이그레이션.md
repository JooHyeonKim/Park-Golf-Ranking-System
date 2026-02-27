# Firebase → Supabase 마이그레이션 계획

## Context

협동입력모드(collab)에서 Firebase Firestore를 사용 중이며, 이를 Supabase로 전환한다.
Firebase는 Firestore만 사용 중 (Auth, Storage 미사용). 인증 없이 device ID 기반으로 동작.

## 변경 대상 파일

### 핵심 파일 (새로 작성/교체)
| 파일 | 작업 |
|------|------|
| `src/utils/firebase.js` → `src/utils/supabase.js` | Supabase 클라이언트 초기화 |
| `src/utils/firestoreOps.js` → `src/utils/supabaseOps.js` | 전체 CRUD + 실시간 리스너 재작성 (378줄) |
| `.env.example` | Firebase 변수 → Supabase 변수 |
| `package.json` | firebase 제거, @supabase/supabase-js 추가 |

### import 경로만 변경 (6개 파일)
- `src/hooks/useCollabTournament.js` — `firestoreOps` → `supabaseOps`
- `src/hooks/useCollabParticipant.js` — `firestoreOps` → `supabaseOps`
- `src/components/collab/CollabLeaderAction.jsx` — `firestoreOps` → `supabaseOps`
- `src/components/collab/CollabLeaderDashboard.jsx` — `firestoreOps` → `supabaseOps`
- `src/components/collab/CollabGroupSelect.jsx` — `firestoreOps` → `supabaseOps`
- `src/components/collab/CollabScoreCard.jsx` — `firestoreOps` → `supabaseOps`
- `src/components/collab/CollabSubmissionStatus.jsx` — `firestoreOps` → `supabaseOps`

### 변경 불필요
- `src/hooks/useCollabVerification.js` — 순수 로직, Firebase 미사용
- `src/components/collab/CollabModeSelect.jsx`, `CollabRoleSelect.jsx`, `CollabJoinScreen.jsx`, `CollabLeaderSetup.jsx` — 직접 import 없음
- `src/App.jsx`, 비-collab 파일들 전부

## Supabase 테이블 스키마

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- tournaments 테이블
CREATE TABLE tournaments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             VARCHAR(6) NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  date             VARCHAR(10) NOT NULL,
  hole_count       SMALLINT NOT NULL CHECK (hole_count IN (18, 36)),
  status           VARCHAR(20) NOT NULL DEFAULT 'setup'
                   CHECK (status IN ('setup', 'active', 'completed')),
  leader_device_id TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  par_a            JSONB NOT NULL DEFAULT '[4,4,4,4,4,4,4,4,4]'::JSONB,
  par_b            JSONB NOT NULL DEFAULT '[4,4,4,4,4,4,4,4,4]'::JSONB,
  par_c            JSONB DEFAULT NULL,
  par_d            JSONB DEFAULT NULL,
  clubs            JSONB NOT NULL DEFAULT '[]'::JSONB
);

-- groups 테이블
CREATE TABLE groups (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id        UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  group_number         INTEGER NOT NULL,
  course               TEXT NOT NULL,
  players              JSONB NOT NULL DEFAULT '[]'::JSONB,
  submissions          JSONB NOT NULL DEFAULT '{}'::JSONB,
  verification_status  VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (verification_status IN ('pending', 'verified', 'conflict')),
  verified_scores      JSONB DEFAULT NULL,
  discrepancies        JSONB DEFAULT NULL,
  UNIQUE (tournament_id, group_number)
);

CREATE INDEX idx_groups_tournament_id ON groups (tournament_id);
```

```sql
-- RLS 정책 (인증 없이 anon key 접근 허용)
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_tournaments" ON tournaments FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_tournaments" ON tournaments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_tournaments" ON tournaments FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_select_groups" ON groups FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_groups" ON groups FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_groups" ON groups FOR UPDATE TO anon USING (true) WITH CHECK (true);
```

```sql
-- 동시 점수 제출 시 race condition 방지용 RPC 함수
CREATE OR REPLACE FUNCTION merge_submission(
  p_tournament_id UUID,
  p_group_number INTEGER,
  p_device_id TEXT,
  p_submission JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE groups
  SET submissions = submissions || jsonb_build_object(p_device_id, p_submission)
  WHERE tournament_id = p_tournament_id
    AND group_number = p_group_number;
END;
$$ LANGUAGE plpgsql;
```

## 실시간 리스너 전환 방식

Firestore `onSnapshot` → Supabase Realtime `postgres_changes`

**핵심 차이:** Supabase Realtime은 초기 데이터를 자동으로 보내지 않음 → 각 리스너에서 **초기 fetch + 구독** 패턴 적용

| 함수 | 구독 대상 | 필터 |
|------|----------|------|
| `listenToTournament` | tournaments / UPDATE | `id=eq.{id}` |
| `listenToGroups` | groups / INSERT,UPDATE | `tournament_id=eq.{id}` |
| `listenToGroup` | groups / UPDATE | `tournament_id=eq.{id}` + JS에서 group_number 체크 |

모든 리스너는 기존과 동일하게 **unsubscribe 함수 반환**.

## 구현 순서

### Phase 1: Supabase 프로젝트 설정
1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor에서 위 스키마 실행
3. Database > Replication에서 `tournaments`, `groups` 테이블 Realtime 활성화
4. Project Settings에서 URL, anon key 확인

### Phase 2: 패키지 교체
1. `npm uninstall firebase && npm install @supabase/supabase-js`
2. `.env` 파일에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정
3. `.env.example` 업데이트

### Phase 3: 핵심 파일 작성
1. `src/utils/supabase.js` 생성 (Supabase 클라이언트)
2. `src/utils/supabaseOps.js` 생성 (동일한 함수명/시그니처로 전체 재작성)

### Phase 4: import 경로 변경 (7개 파일)
- 모든 `firestoreOps` import를 `supabaseOps`로 변경

### Phase 5: 정리
1. `src/utils/firebase.js` 삭제
2. `src/utils/firestoreOps.js` 삭제
3. `npm run build`로 빌드 확인

## 검증 방법
1. `npm run dev`로 개발 서버 실행
2. 협동입력모드 전체 플로우 테스트:
   - 팀장: 대회 생성 → 파 설정 → 클럽/선수 등록 → 활성화
   - 참여자: 코드 입력으로 참가 → 조 선택 → 점수 입력 → 제출
   - 실시간: 브라우저 2개 탭에서 실시간 업데이트 확인
   - 검증: 2명 제출 후 자동 검증 (일치/불일치) 확인
3. `npm run build` 성공 확인
