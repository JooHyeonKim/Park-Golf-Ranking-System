// I, O, 0, 1 제외 (혼동 방지)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateTournamentCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
