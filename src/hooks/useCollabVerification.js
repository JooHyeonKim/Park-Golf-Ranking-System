/**
 * 두 제출의 점수를 비교하는 순수 함수 모듈
 */

/**
 * 두 제출 비교
 * @param {Object} sub1 - { scores: { [slot]: { A: number[], B: number[], ... } } }
 * @param {Object} sub2 - 동일 구조
 * @param {string} deviceId1 - 첫 번째 제출자 기기 ID
 * @param {string} deviceId2 - 두 번째 제출자 기기 ID
 * @param {number} holeCount - 18 또는 36
 * @returns {{ isMatch: boolean, discrepancies: Array|null }}
 */
export function compareSubmissions(sub1, sub2, deviceId1, deviceId2, holeCount) {
  const discrepancies = [];
  const courses = holeCount === 18 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];

  // 모든 slot을 합집합으로 비교
  const allSlots = new Set([
    ...Object.keys(sub1.scores),
    ...Object.keys(sub2.scores),
  ]);

  for (const slot of allSlots) {
    const scores1 = sub1.scores[slot];
    const scores2 = sub2.scores[slot];

    // 한쪽에만 있는 slot은 모든 홀이 불일치
    if (!scores1 || !scores2) {
      for (const course of courses) {
        for (let hole = 0; hole < 9; hole++) {
          discrepancies.push({
            playerSlot: parseInt(slot),
            course,
            hole: hole + 1,
            values: {
              [deviceId1]: scores1?.[course]?.[hole] ?? null,
              [deviceId2]: scores2?.[course]?.[hole] ?? null,
            },
          });
        }
      }
      continue;
    }

    for (const course of courses) {
      const arr1 = scores1[course] || [];
      const arr2 = scores2[course] || [];

      for (let hole = 0; hole < 9; hole++) {
        // null과 undefined를 동일하게 취급
        const v1 = arr1[hole] ?? null;
        const v2 = arr2[hole] ?? null;
        if (v1 !== v2) {
          discrepancies.push({
            playerSlot: parseInt(slot),
            course,
            hole: hole + 1,
            values: {
              [deviceId1]: v1,
              [deviceId2]: v2,
            },
          });
        }
      }
    }
  }

  return {
    isMatch: discrepancies.length === 0,
    discrepancies: discrepancies.length > 0 ? discrepancies : null,
  };
}

/**
 * 검증 통과한 제출에서 확정 점수 추출
 * (두 제출이 동일하므로 첫 번째 것을 사용)
 * @param {Object} submission - { scores: { ... } }
 * @returns {Object} verifiedScores
 */
export function extractVerifiedScores(submission) {
  return { ...submission.scores };
}

/**
 * 조 문서에서 2개 이상 제출이 있는지 확인하고 검증 수행
 * @param {Object} groupData - Firestore group 문서 데이터
 * @param {number} holeCount
 * @returns {{ shouldVerify: boolean, result?: { isMatch, discrepancies, verifiedScores } }}
 */
export function checkAndVerify(groupData, holeCount) {
  const submissions = groupData.submissions || {};
  const deviceIds = Object.keys(submissions);

  if (deviceIds.length < 2) {
    return { shouldVerify: false };
  }

  // 이미 검증됐으면 스킵
  if (groupData.verificationStatus === 'verified') {
    return { shouldVerify: false };
  }

  const [id1, id2] = deviceIds;
  const sub1 = submissions[id1];
  const sub2 = submissions[id2];

  const comparison = compareSubmissions(sub1, sub2, id1, id2, holeCount);

  return {
    shouldVerify: true,
    result: {
      isMatch: comparison.isMatch,
      discrepancies: comparison.discrepancies,
      verifiedScores: comparison.isMatch ? extractVerifiedScores(sub1) : null,
    },
  };
}
