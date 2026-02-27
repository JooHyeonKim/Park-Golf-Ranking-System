import { supabase } from './supabase';
import { generateTournamentCode } from './tournamentCode';

// ============================================================
// 컬럼명 매핑 (camelCase ↔ snake_case)
// ============================================================

const toSnakeCase = {
  holeCount: 'hole_count',
  leaderDeviceId: 'leader_device_id',
  createdAt: 'created_at',
  parA: 'par_a',
  parB: 'par_b',
  parC: 'par_c',
  parD: 'par_d',
  groupNumber: 'group_number',
  tournamentId: 'tournament_id',
  verificationStatus: 'verification_status',
  verifiedScores: 'verified_scores',
};

function mapUpdatesToSnake(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCase[key] || key] = value;
  }
  return result;
}

function mapTournamentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    date: row.date,
    holeCount: row.hole_count,
    status: row.status,
    leaderDeviceId: row.leader_device_id,
    createdAt: row.created_at,
    parA: row.par_a,
    parB: row.par_b,
    parC: row.par_c,
    parD: row.par_d,
    clubs: row.clubs,
  };
}

function mapGroupRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    groupNumber: row.group_number,
    course: row.course,
    players: row.players,
    submissions: row.submissions,
    verificationStatus: row.verification_status,
    verifiedScores: row.verified_scores,
    discrepancies: row.discrepancies,
  };
}

// ============================================================
// 대회 (Tournament) 관련
// ============================================================

/**
 * 협동 대회 생성
 * @param {Object} config - { name, date, holeCount, leaderDeviceId }
 * @returns {Object} - { id, code } 생성된 문서 ID와 대회 코드
 */
export async function createCollabTournament({ name, date, holeCount, leaderDeviceId }) {
  let code;
  let attempts = 0;
  while (attempts < 10) {
    code = generateTournamentCode();
    const existing = await findTournamentByCode(code);
    if (!existing) break;
    attempts++;
  }

  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      code,
      name,
      date,
      hole_count: holeCount,
      status: 'setup',
      leader_device_id: leaderDeviceId,
      par_a: Array(9).fill(4),
      par_b: Array(9).fill(4),
      par_c: holeCount === 36 ? Array(9).fill(4) : null,
      par_d: holeCount === 36 ? Array(9).fill(4) : null,
      clubs: [],
    })
    .select()
    .single();

  if (error) throw error;
  return { id: data.id, code };
}

/**
 * 대회 코드로 대회 찾기
 * @param {string} code - 6자리 대회 코드
 * @returns {Object|null} - { id, ...data } 또는 null
 */
export async function findTournamentByCode(code) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return mapTournamentRow(data);
}

/**
 * 대회 문서 가져오기
 * @param {string} tournamentId
 * @returns {Object|null}
 */
export async function getTournament(tournamentId) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .maybeSingle();

  if (error) throw error;
  return mapTournamentRow(data);
}

/**
 * 대회 필드 업데이트
 * @param {string} tournamentId
 * @param {Object} updates - 업데이트할 필드들
 */
export async function updateTournamentField(tournamentId, updates) {
  const { error } = await supabase
    .from('tournaments')
    .update(mapUpdatesToSnake(updates))
    .eq('id', tournamentId);

  if (error) throw error;
}

/**
 * 대회 상태를 'active'로 변경
 * @param {string} tournamentId
 */
export async function activateTournament(tournamentId) {
  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'active' })
    .eq('id', tournamentId);

  if (error) throw error;
}

/**
 * 대회 상태를 'completed'로 변경
 * @param {string} tournamentId
 */
export async function completeTournament(tournamentId) {
  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'completed' })
    .eq('id', tournamentId);

  if (error) throw error;
}

// ============================================================
// 조 (Group) 관련
// ============================================================

/**
 * 조 초기화 (대회 생성 시 호출)
 * @param {string} tournamentId
 * @param {number} holeCount - 18 또는 36
 */
export async function initializeGroups(tournamentId, holeCount) {
  const courses = holeCount === 18 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
  let groupNumber = 1;
  const rows = [];

  for (const course of courses) {
    for (let i = 1; i <= 9; i++) {
      const courseName = `${course}-${i}`;
      rows.push({
        tournament_id: tournamentId,
        group_number: groupNumber,
        course: courseName,
        players: [
          { slot: 0, name: '', gender: '', club: '', course: courseName },
          { slot: 1, name: '', gender: '', club: '', course: courseName },
          { slot: 2, name: '', gender: '', club: '', course: courseName },
          { slot: 3, name: '', gender: '', club: '', course: courseName },
        ],
        submissions: {},
        verification_status: 'pending',
        verified_scores: null,
        discrepancies: null,
      });
      groupNumber++;
    }
  }

  const { error } = await supabase.from('groups').insert(rows);
  if (error) throw error;
}

/**
 * 특정 조의 선수 목록 업데이트
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {Array} players
 */
export async function updateGroupPlayers(tournamentId, groupNumber, players) {
  const { error } = await supabase
    .from('groups')
    .update({ players })
    .eq('tournament_id', tournamentId)
    .eq('group_number', groupNumber);

  if (error) throw error;
}

/**
 * 특정 조에 추가 선수 삽입
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {string} baseCourse
 */
export async function addPlayerToGroup(tournamentId, groupNumber, baseCourse) {
  const { data, error: fetchError } = await supabase
    .from('groups')
    .select('players')
    .eq('tournament_id', tournamentId)
    .eq('group_number', groupNumber)
    .single();

  if (fetchError) throw fetchError;
  if (!data) return;

  const players = [...data.players];
  if (players.length >= 8) return;

  const newSlot = players.length;
  players.push({
    slot: newSlot,
    name: '',
    gender: '',
    club: '',
    course: `${baseCourse}-1`,
  });

  const { error } = await supabase
    .from('groups')
    .update({ players })
    .eq('tournament_id', tournamentId)
    .eq('group_number', groupNumber);

  if (error) throw error;
}

/**
 * 특정 조에서 추가 선수 제거
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {number} slotIndex
 */
export async function removePlayerFromGroup(tournamentId, groupNumber, slotIndex) {
  if (slotIndex < 4) return;

  const { data, error: fetchError } = await supabase
    .from('groups')
    .select('players')
    .eq('tournament_id', tournamentId)
    .eq('group_number', groupNumber)
    .single();

  if (fetchError) throw fetchError;
  if (!data) return;

  const players = data.players.filter(p => p.slot !== slotIndex);
  const reindexed = players.map((p, idx) => ({ ...p, slot: idx }));

  const { error } = await supabase
    .from('groups')
    .update({ players: reindexed })
    .eq('tournament_id', tournamentId)
    .eq('group_number', groupNumber);

  if (error) throw error;
}

/**
 * 모든 조 데이터 가져오기
 * @param {string} tournamentId
 * @returns {Array}
 */
export async function getAllGroups(tournamentId) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('group_number');

  if (error) throw error;
  return (data || []).map(mapGroupRow);
}

/**
 * 특정 조 데이터 가져오기
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @returns {Object|null}
 */
export async function getGroup(tournamentId, groupNumber) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('group_number', groupNumber)
    .maybeSingle();

  if (error) throw error;
  return mapGroupRow(data);
}

// ============================================================
// 제출 (Submission) 관련
// ============================================================

/**
 * 점수 제출 (RPC로 atomic merge)
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {string} deviceId
 * @param {string} nickname
 * @param {Object} scores
 */
export async function submitGroupScores(tournamentId, groupNumber, deviceId, nickname, scores) {
  const submission = {
    nickname,
    submittedAt: new Date().toISOString(),
    scores,
  };

  const { error } = await supabase.rpc('merge_submission', {
    p_tournament_id: tournamentId,
    p_group_number: groupNumber,
    p_device_id: deviceId,
    p_submission: submission,
  });

  if (error) throw error;
}

/**
 * 검증 결과 기록 - 승인
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {Object} verifiedScores
 */
export async function setGroupVerified(tournamentId, groupNumber, verifiedScores) {
  const { error } = await supabase
    .from('groups')
    .update({
      verification_status: 'verified',
      verified_scores: verifiedScores,
      discrepancies: null,
    })
    .eq('tournament_id', tournamentId)
    .eq('group_number', groupNumber);

  if (error) throw error;
}

/**
 * 검증 결과 기록 - 충돌
 * @param {string} tournamentId
 * @param {number} groupNumber
 * @param {Array} discrepancies
 */
export async function setGroupConflict(tournamentId, groupNumber, discrepancies) {
  const { error } = await supabase
    .from('groups')
    .update({
      verification_status: 'conflict',
      verified_scores: null,
      discrepancies,
    })
    .eq('tournament_id', tournamentId)
    .eq('group_number', groupNumber);

  if (error) throw error;
}

/**
 * 충돌 후 제출 초기화 (재입력용)
 * @param {string} tournamentId
 * @param {number} groupNumber
 */
export async function resetGroupSubmissions(tournamentId, groupNumber) {
  const { error } = await supabase
    .from('groups')
    .update({
      submissions: {},
      verification_status: 'pending',
      verified_scores: null,
      discrepancies: null,
    })
    .eq('tournament_id', tournamentId)
    .eq('group_number', groupNumber);

  if (error) throw error;
}

// ============================================================
// 실시간 리스너 (Supabase Realtime)
// ============================================================

/**
 * 대회 문서 실시간 감시
 * @param {string} tournamentId
 * @param {Function} callback - (tournamentData) => void
 * @param {Function} [onError]
 * @returns {Function} unsubscribe
 */
export function listenToTournament(tournamentId, callback, onError) {
  // 초기 데이터 fetch
  supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error('Tournament initial fetch error:', error);
        onError?.(error);
        return;
      }
      if (data) callback(mapTournamentRow(data));
    });

  // 실시간 구독
  const channel = supabase
    .channel(`tournament-${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tournaments',
        filter: `id=eq.${tournamentId}`,
      },
      (payload) => {
        callback(mapTournamentRow(payload.new));
      }
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Tournament listener error:', err);
        onError?.(err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 전체 조 실시간 감시
 * @param {string} tournamentId
 * @param {Function} callback - (groups[]) => void
 * @param {Function} [onError]
 * @returns {Function} unsubscribe
 */
export function listenToGroups(tournamentId, callback, onError) {
  // 메모리 내 그룹 맵 (group_number → row)
  let groupsMap = {};

  function emitSorted() {
    const groups = Object.values(groupsMap)
      .map(mapGroupRow)
      .sort((a, b) => a.groupNumber - b.groupNumber);
    callback(groups);
  }

  // 초기 데이터 fetch
  supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('group_number')
    .then(({ data, error }) => {
      if (error) {
        console.error('Groups initial fetch error:', error);
        onError?.(error);
        return;
      }
      groupsMap = {};
      (data || []).forEach(row => {
        groupsMap[row.group_number] = row;
      });
      emitSorted();
    });

  // 실시간 구독
  const channel = supabase
    .channel(`groups-${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'groups',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          delete groupsMap[payload.old.group_number];
        } else {
          groupsMap[payload.new.group_number] = payload.new;
        }
        emitSorted();
      }
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Groups listener error:', err);
        onError?.(err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
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
  // 초기 데이터 fetch
  supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('group_number', groupNumber)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error('Group initial fetch error:', error);
        onError?.(error);
        return;
      }
      if (data) callback(mapGroupRow(data));
    });

  // 실시간 구독 (tournament_id로 필터 후 JS에서 group_number 체크)
  const channel = supabase
    .channel(`group-${tournamentId}-${groupNumber}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'groups',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      (payload) => {
        if (payload.new.group_number === groupNumber) {
          callback(mapGroupRow(payload.new));
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Group listener error:', err);
        onError?.(err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
