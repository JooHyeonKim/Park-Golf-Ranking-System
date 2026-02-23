// IndexedDB 유틸리티 - 클럽 및 회원 데이터 관리

const DB_NAME = 'parkgolf-db';
const DB_VERSION = 1;

const DEFAULT_CLUBS = [
  '방배', '양재', '잠원', '반포', '서리풀',
  '서래', '우면', '서초', '내곡', '청계',
  '이수', '매헌', '향목'
];

/**
 * IndexedDB 열기 (최초 실행 시 스키마 생성)
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // clubs 스토어
      if (!db.objectStoreNames.contains('clubs')) {
        const clubStore = db.createObjectStore('clubs', { keyPath: 'id', autoIncrement: true });
        clubStore.createIndex('name', 'name', { unique: true });
      }

      // members 스토어
      if (!db.objectStoreNames.contains('members')) {
        const memberStore = db.createObjectStore('members', { keyPath: 'id', autoIncrement: true });
        memberStore.createIndex('name', 'name', { unique: false });
        memberStore.createIndex('club', 'club', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 트랜잭션 헬퍼
 */
function withTransaction(db, storeNames, mode, callback) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    const result = callback(tx);

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================================
// 마이그레이션
// ============================================================

/**
 * localStorage → IndexedDB 마이그레이션 (최초 1회)
 */
export async function migrateFromLocalStorage() {
  const db = await openDB();
  try {
    // 이미 클럽 데이터가 있으면 스킵
    const existingClubs = await new Promise((resolve, reject) => {
      const tx = db.transaction('clubs', 'readonly');
      const store = tx.objectStore('clubs');
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (existingClubs > 0) return;

    // localStorage에서 클럽 데이터 읽기
    let clubNames = DEFAULT_CLUBS;
    try {
      const data = localStorage.getItem('parkgolf-clubs');
      if (data) {
        clubNames = JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to read localStorage clubs:', e);
    }

    // IndexedDB에 삽입
    await withTransaction(db, 'clubs', 'readwrite', (tx) => {
      const store = tx.objectStore('clubs');
      for (const name of clubNames) {
        store.add({ name });
      }
    });

    // 마이그레이션 완료 후 localStorage 키 삭제
    localStorage.removeItem('parkgolf-clubs');
  } finally {
    db.close();
  }
}

// ============================================================
// Club CRUD
// ============================================================

/**
 * 모든 클럽 조회
 */
export async function getAllClubs() {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('clubs', 'readonly');
      const store = tx.objectStore('clubs');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/**
 * 클럽 추가
 * @returns {Promise<Object|null>} 추가된 클럽 또는 중복 시 null
 */
export async function addClubToDB(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('clubs', 'readwrite');
      const store = tx.objectStore('clubs');
      const request = store.add({ name: trimmed });
      request.onsuccess = () => resolve({ id: request.result, name: trimmed });
      request.onerror = () => {
        // unique 제약 위반 (중복)
        tx.abort();
        resolve(null);
      };
    });
  } finally {
    db.close();
  }
}

/**
 * 클럽명 수정
 * @returns {Promise<boolean>} 성공 여부
 */
export async function updateClubInDB(id, newName) {
  const trimmed = newName.trim();
  if (!trimmed) return false;

  const db = await openDB();
  try {
    // 중복 체크
    const existing = await new Promise((resolve, reject) => {
      const tx = db.transaction('clubs', 'readonly');
      const store = tx.objectStore('clubs');
      const index = store.index('name');
      const request = index.get(trimmed);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (existing && existing.id !== id) return false;

    await new Promise((resolve, reject) => {
      const tx = db.transaction('clubs', 'readwrite');
      const store = tx.objectStore('clubs');
      const request = store.put({ id, name: trimmed });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return true;
  } finally {
    db.close();
  }
}

/**
 * 클럽 삭제
 */
export async function deleteClubFromDB(id) {
  const db = await openDB();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('clubs', 'readwrite');
      const store = tx.objectStore('clubs');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

// ============================================================
// Member CRUD
// ============================================================

/**
 * 모든 회원 조회
 */
export async function getAllMembers() {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('members', 'readonly');
      const store = tx.objectStore('members');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/**
 * 클럽별 회원 조회
 */
export async function getMembersByClubFromDB(clubName) {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('members', 'readonly');
      const store = tx.objectStore('members');
      const index = store.index('club');
      const request = index.getAll(clubName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/**
 * 이름으로 회원 검색 (정확 매칭)
 */
export async function searchMembersByName(name) {
  const trimmed = name.trim();
  if (!trimmed) return [];

  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('members', 'readonly');
      const store = tx.objectStore('members');
      const index = store.index('name');
      const request = index.getAll(trimmed);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/**
 * 회원 추가
 */
export async function addMemberToDB(name, gender, club, birthDate = '') {
  const trimmed = name.trim();
  if (!trimmed || !gender || !club) return null;

  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('members', 'readwrite');
      const store = tx.objectStore('members');
      const member = { name: trimmed, gender, club, birthDate: birthDate || '' };
      const request = store.add(member);
      request.onsuccess = () => resolve({ ...member, id: request.result });
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/**
 * 회원 수정
 */
export async function updateMemberInDB(id, updates) {
  const db = await openDB();
  try {
    // 기존 데이터 읽기
    const existing = await new Promise((resolve, reject) => {
      const tx = db.transaction('members', 'readonly');
      const store = tx.objectStore('members');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!existing) return;

    const updated = { ...existing, ...updates };

    await new Promise((resolve, reject) => {
      const tx = db.transaction('members', 'readwrite');
      const store = tx.objectStore('members');
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/**
 * 회원 삭제
 */
export async function deleteMemberFromDB(id) {
  const db = await openDB();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('members', 'readwrite');
      const store = tx.objectStore('members');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/**
 * 클럽명 변경 시 소속 회원의 club 필드 일괄 업데이트
 */
export async function updateMembersClubInDB(oldClubName, newClubName) {
  const db = await openDB();
  try {
    const members = await new Promise((resolve, reject) => {
      const tx = db.transaction('members', 'readonly');
      const store = tx.objectStore('members');
      const index = store.index('club');
      const request = index.getAll(oldClubName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (members.length === 0) return;

    await withTransaction(db, 'members', 'readwrite', (tx) => {
      const store = tx.objectStore('members');
      for (const member of members) {
        store.put({ ...member, club: newClubName });
      }
    });
  } finally {
    db.close();
  }
}
