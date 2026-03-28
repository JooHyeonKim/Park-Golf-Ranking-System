import { supabase } from './supabase';

// ============================================================
// 대회 (user_tournaments)
// ============================================================

export async function loadTournaments() {
  const { data, error } = await supabase
    .from('user_tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // DB 컬럼명 → 클라이언트 camelCase 변환
  return (data || []).map(row => ({
    id: Number(row.id),
    name: row.name,
    date: row.date,
    holeCount: row.hole_count,
    groupCount: row.group_count,
    clubType: row.club_type,
    players: row.players || [],
    createdAt: Number(row.created_at),
  }));
}

export async function saveTournament(tournament) {
  const { error } = await supabase
    .from('user_tournaments')
    .upsert({
      id: tournament.id,
      user_id: (await supabase.auth.getUser()).data.user.id,
      name: tournament.name,
      date: tournament.date,
      hole_count: tournament.holeCount,
      group_count: tournament.groupCount,
      club_type: tournament.clubType || 'club',
      players: tournament.players || [],
      created_at: tournament.createdAt || tournament.id,
    }, { onConflict: 'id' });

  if (error) throw error;
}

export async function deleteTournament(tournamentId) {
  const { error } = await supabase
    .from('user_tournaments')
    .delete()
    .eq('id', tournamentId);

  if (error) throw error;
}

// ============================================================
// 클럽 (user_clubs)
// ============================================================

export async function loadClubs() {
  const { data, error } = await supabase
    .from('user_clubs')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addClub(name) {
  const userId = (await supabase.auth.getUser()).data.user.id;
  const { data, error } = await supabase
    .from('user_clubs')
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return null; // unique violation
    throw error;
  }
  return data;
}

export async function updateClub(id, newName) {
  const { error } = await supabase
    .from('user_clubs')
    .update({ name: newName })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') return false;
    throw error;
  }
  return true;
}

export async function deleteClub(id) {
  const { error } = await supabase
    .from('user_clubs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// 소속 (user_affiliations)
// ============================================================

export async function loadAffiliations() {
  const { data, error } = await supabase
    .from('user_affiliations')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addAffiliation(name) {
  const userId = (await supabase.auth.getUser()).data.user.id;
  const { data, error } = await supabase
    .from('user_affiliations')
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return null;
    throw error;
  }
  return data;
}

export async function updateAffiliation(id, newName) {
  const { error } = await supabase
    .from('user_affiliations')
    .update({ name: newName })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') return false;
    throw error;
  }
  return true;
}

export async function deleteAffiliation(id) {
  const { error } = await supabase
    .from('user_affiliations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// 회원 (user_members)
// ============================================================

export async function loadMembers() {
  const { data, error } = await supabase
    .from('user_members')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    gender: row.gender,
    club: row.club,
    birthDate: row.birth_date,
  }));
}

export async function addMember(name, gender, club, birthDate = '') {
  const userId = (await supabase.auth.getUser()).data.user.id;
  const { data, error } = await supabase
    .from('user_members')
    .insert({ user_id: userId, name, gender, club, birth_date: birthDate })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    gender: data.gender,
    club: data.club,
    birthDate: data.birth_date,
  };
}

export async function updateMember(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.club !== undefined) dbUpdates.club = updates.club;
  if (updates.birthDate !== undefined) dbUpdates.birth_date = updates.birthDate;

  const { error } = await supabase
    .from('user_members')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteMember(id) {
  const { error } = await supabase
    .from('user_members')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateMembersClub(oldClub, newClub) {
  const { error } = await supabase
    .from('user_members')
    .update({ club: newClub })
    .eq('club', oldClub);

  if (error) throw error;
}
