import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateTournamentCode } from './tournamentCode';

// ============================================================
// 대회 (Tournament) 관련
// ============================================================

/**
 * 협동 대회 생성
 * @param {Object} config - { name, date, holeCount, leaderDeviceId }
 * @returns {Object} - { id, code } 생성된 문서 ID와 대회 코드
 */
export async function createCollabTournament({ name, date, holeCount, leaderDeviceId }) {
  // 고유 코드 생성 (중복 시 재생성)
  let code;
  let attempts = 0;
  while (attempts < 10) {
    code = generateTournamentCode();
    const existing = await findTournamentByCode(code);
    if (!existing) break;
    attempts++;
  }

  const tournamentData = {
    code,
    name,
    date,
    holeCount,
    status: 'setup',
    leaderDeviceId,
    createdAt: serverTimestamp(),
    parA: Array(9).fill(4),
    parB: Array(9).fill(4),
    parC: holeCount === 36 ? Array(9).fill(4) : null,
    parD: holeCount === 36 ? Array(9).fill(4) : null,
    clubs: [],
  };

  const docRef = await addDoc(collection(db, 'tournaments'), tournamentData);
  return { id: docRef.id, code };
}

/**
 * 대회 코드로 대회 찾기
 * @param {string} code - 6자리 대회 코드
 * @returns {Object|null} - { id, ...data } 또는 null
 */
export async function findTournamentByCode(code) {
  const q = query(
    collection(db, 'tournaments'),
    where('code', '==', code.toUpperCase())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * 대회 문서 가져오기
 * @param {string} tournamentId - Firestore 문서 ID
 * @returns {Object|null}
 */
export async function getTournament(tournamentId) {
  const docSnap = await getDoc(doc(db, 'tournaments', tournamentId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * 대회 필드 업데이트
 * @param {string} tournamentId
 * @param {Object} updates - 업데이트할 필드들
 */
export async function updateTournamentField(tournamentId, updates) {
  await updateDoc(doc(db, 'tournaments', tournamentId), updates);
}

/**
 * 대회 상태를 'active'로 변경
 * @param {string} tournamentId
 */
export async function activateTournament(tournamentId) {
  await updateDoc(doc(db, 'tournaments', tournamentId), { status: 'active' });
}

/**
 * 대회 상태를 'completed'로 변경
 * @param {string} tournamentId
 */
export async function completeTournament(tournamentId) {
  await updateDoc(doc(db, 'tournaments', tournamentId), { status: 'completed' });
}

// ============================================================
// 조 (Group) 관련
// ============================================================

/**
 * 조 초기화 (대회 생성 시 호출)
 * 기존 ScoreTable의 createInitialPlayers()와 동일한 구조
 * @param {string} tournamentId
 * @param {number} holeCount - 18 또는 36
 */
export async function initializeGroups(tournamentId, holeCount) {
  const courses = holeCount === 18 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
  let groupNumber = 1;

  for (const course of courses) {
    for (let i = 1; i <= 9; i++) {
      const courseName = `${course}-${i}`;
      const groupData = {
        groupNumber,
        course: courseName,
        players: [
          { slot: 0, name: '', gender: '', club: '', course: courseName },
          { slot: 1, name: '', gender: '', club: '', course: courseName },
          { slot: 2, name: '', gender: '', club: '', course: courseName },
          { slot: 3, name: '', gender: '', club: '', course: courseName },
        ],
        submissions: {},
        verificationStatus: 'pending',
        verifiedScores: null,
        discrepancies: null,
      };

      await setDoc(
        doc(db, 'tournaments', tournamentId, 'groups', String(groupNumber)),
        groupData
      );
      groupNumber++;
    }
  }
}

/**
 * 특정 조의 선수 목록 업데이트
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {Array} players - [{ slot, name, gender, club, course }, ...]
 */
export async function updateGroupPlayers(tournamentId, groupNumber, players) {
  await updateDoc(
    doc(db, 'tournaments', tournamentId, 'groups', String(groupNumber)),
    { players }
  );
}

/**
 * 특정 조에 추가 선수 삽입
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {string} baseCourse - 기본 코스명 (예: "A-1")
 */
export async function addPlayerToGroup(tournamentId, groupNumber, baseCourse) {
  const groupRef = doc(db, 'tournaments', tournamentId, 'groups', String(groupNumber));
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) return;

  const data = groupSnap.data();
  const players = [...data.players];
  if (players.length >= 8) return; // 최대 8명

  const newSlot = players.length;
  players.push({
    slot: newSlot,
    name: '',
    gender: '',
    club: '',
    course: `${baseCourse}-1`,
  });

  await updateDoc(groupRef, { players });
}

/**
 * 특정 조에서 추가 선수 제거
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {number} slotIndex - 제거할 선수의 slot
 */
export async function removePlayerFromGroup(tournamentId, groupNumber, slotIndex) {
  const groupRef = doc(db, 'tournaments', tournamentId, 'groups', String(groupNumber));
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) return;

  const data = groupSnap.data();
  // 기본 4명(slot 0~3)은 제거 불가
  if (slotIndex < 4) return;

  const players = data.players.filter(p => p.slot !== slotIndex);
  // slot 번호 재정렬
  const reindexed = players.map((p, idx) => ({ ...p, slot: idx }));

  await updateDoc(groupRef, { players: reindexed });
}

/**
 * 모든 조 데이터 가져오기
 * @param {string} tournamentId
 * @returns {Array} - 조 데이터 배열
 */
export async function getAllGroups(tournamentId) {
  const snapshot = await getDocs(
    collection(db, 'tournaments', tournamentId, 'groups')
  );
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.groupNumber - b.groupNumber);
}

/**
 * 특정 조 데이터 가져오기
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @returns {Object|null}
 */
export async function getGroup(tournamentId, groupNumber) {
  const docSnap = await getDoc(
    doc(db, 'tournaments', tournamentId, 'groups', String(groupNumber))
  );
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

// ============================================================
// 제출 (Submission) 관련
// ============================================================

/**
 * 점수 제출
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {string} deviceId - 기기 UUID
 * @param {string} nickname - 참여자 닉네임
 * @param {Object} scores - { [slotIndex]: { A: number[], B: number[], C?: number[], D?: number[] } }
 */
export async function submitGroupScores(tournamentId, groupNumber, deviceId, nickname, scores) {
  const groupRef = doc(db, 'tournaments', tournamentId, 'groups', String(groupNumber));

  await updateDoc(groupRef, {
    [`submissions.${deviceId}`]: {
      nickname,
      submittedAt: serverTimestamp(),
      scores,
    },
  });
}

/**
 * 검증 결과 기록 - 승인
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {Object} verifiedScores - 승인된 점수 데이터
 */
export async function setGroupVerified(tournamentId, groupNumber, verifiedScores) {
  const groupRef = doc(db, 'tournaments', tournamentId, 'groups', String(groupNumber));
  await updateDoc(groupRef, {
    verificationStatus: 'verified',
    verifiedScores,
    discrepancies: null,
  });
}

/**
 * 검증 결과 기록 - 충돌
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {Array} discrepancies - 불일치 목록
 */
export async function setGroupConflict(tournamentId, groupNumber, discrepancies) {
  const groupRef = doc(db, 'tournaments', tournamentId, 'groups', String(groupNumber));
  await updateDoc(groupRef, {
    verificationStatus: 'conflict',
    verifiedScores: null,
    discrepancies,
  });
}

/**
 * 충돌 후 제출 초기화 (재입력용)
 * @param {string} tournamentId
 * @param {number} groupNumber
 */
export async function resetGroupSubmissions(tournamentId, groupNumber) {
  const groupRef = doc(db, 'tournaments', tournamentId, 'groups', String(groupNumber));
  await updateDoc(groupRef, {
    submissions: {},
    verificationStatus: 'pending',
    verifiedScores: null,
    discrepancies: null,
  });
}

// ============================================================
// 실시간 리스너 (onSnapshot)
// ============================================================

/**
 * 대회 문서 실시간 감시
 * @param {string} tournamentId
 * @param {Function} callback - (tournamentData) => void
 * @returns {Function} unsubscribe
 */
export function listenToTournament(tournamentId, callback, onError) {
  return onSnapshot(
    doc(db, 'tournaments', tournamentId),
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      }
    },
    (err) => {
      console.error('Tournament listener error:', err);
      onError?.(err);
    }
  );
}

/**
 * 전체 조 실시간 감시
 * @param {string} tournamentId
 * @param {Function} callback - (groups[]) => void
 * @param {Function} [onError]
 * @returns {Function} unsubscribe
 */
export function listenToGroups(tournamentId, callback, onError) {
  return onSnapshot(
    collection(db, 'tournaments', tournamentId, 'groups'),
    (snapshot) => {
      const groups = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.groupNumber - b.groupNumber);
      callback(groups);
    },
    (err) => {
      console.error('Groups listener error:', err);
      onError?.(err);
    }
  );
}

/**
 * 특정 조 실시간 감시
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {Function} callback - (groupData) => void
 * @param {Function} [onError]
 * @returns {Function} unsubscribe
 */
export function listenToGroup(tournamentId, groupNumber, callback, onError) {
  return onSnapshot(
    doc(db, 'tournaments', tournamentId, 'groups', String(groupNumber)),
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      }
    },
    (err) => {
      console.error('Group listener error:', err);
      onError?.(err);
    }
  );
}
