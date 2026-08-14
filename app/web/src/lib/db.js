import { supabase } from './supabase';
import { genCodes, genOrder } from './codegen';

const SESSION_SELECT = `
  id, product_name, store_name, day, place, slot_labels, label_a, label_b, is_active, created_at,
  participants (
    id, name, creneau, codes, truth_order, created_at,
    submissions ( id, bloc2, bloc3, intensity, description, submitted_at )
  )
`;

function mapSubmission(row) {
  if (!row) return null;
  return {
    id: row.id,
    bloc2: row.bloc2 || [],
    bloc3: row.bloc3 || [],
    intensity: row.intensity,
    description: row.description || '',
    submittedAt: row.submitted_at,
  };
}

function mapParticipant(row) {
  const sub = Array.isArray(row.submissions) ? row.submissions[0] : row.submissions;
  return {
    id: row.id,
    name: row.name,
    creneau: row.creneau,
    codes: row.codes || [],
    truthOrder: row.truth_order || [],
    createdAt: row.created_at,
    submission: mapSubmission(sub),
  };
}

function mapSession(row) {
  return {
    id: row.id,
    productName: row.product_name,
    storeName: row.store_name,
    day: row.day,
    place: row.place,
    slotLabels: row.slot_labels || [],
    labelA: row.label_a || '',
    labelB: row.label_b || '',
    isActive: row.is_active,
    createdAt: row.created_at,
    participants: (row.participants || [])
      .map(mapParticipant)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  };
}

export async function fetchSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select(SESSION_SELECT)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(mapSession);
}

export async function createSession({ productName, storeName, day, place, slotLabels, labelA, labelB }) {
  const insert = { product_name: productName };
  if (storeName !== undefined) insert.store_name = storeName;
  if (day !== undefined) insert.day = day;
  if (place !== undefined) insert.place = place;
  if (slotLabels !== undefined) insert.slot_labels = slotLabels;
  if (labelA !== undefined) insert.label_a = labelA;
  if (labelB !== undefined) insert.label_b = labelB;
  const { data, error } = await supabase.from('sessions').insert(insert).select().single();
  if (error) throw error;
  await setActiveSession(data.id);
  return mapSession({ ...data, participants: [] });
}

export async function updateSession(id, patch) {
  const dbPatch = {};
  if (patch.productName !== undefined) dbPatch.product_name = patch.productName;
  if (patch.storeName !== undefined) dbPatch.store_name = patch.storeName;
  if (patch.day !== undefined) dbPatch.day = patch.day;
  if (patch.place !== undefined) dbPatch.place = patch.place;
  if (patch.slotLabels !== undefined) dbPatch.slot_labels = patch.slotLabels;
  if (patch.labelA !== undefined) dbPatch.label_a = patch.labelA;
  if (patch.labelB !== undefined) dbPatch.label_b = patch.labelB;
  const { error } = await supabase.from('sessions').update(dbPatch).eq('id', id);
  if (error) throw error;
}

export async function deleteSession(id) {
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) throw error;
}

export async function setActiveSession(id) {
  const { error } = await supabase.rpc('set_active_session', { p_session_id: id });
  if (error) throw error;
}

export async function updateParticipant(id, patch) {
  const dbPatch = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.creneau !== undefined) dbPatch.creneau = patch.creneau;
  const { error } = await supabase.from('participants').update(dbPatch).eq('id', id);
  if (error) throw error;
}

export async function registerParticipant(sessionId, { name, creneau }) {
  const { data: existing, error: fetchErr } = await supabase
    .from('participants')
    .select('codes')
    .eq('session_id', sessionId);
  if (fetchErr) throw fetchErr;
  const used = new Set((existing || []).flatMap((p) => p.codes || []));
  const codes = genCodes(used, 5);
  const truthOrder = genOrder();
  const { data, error } = await supabase
    .from('participants')
    .insert({ session_id: sessionId, name, creneau, codes, truth_order: truthOrder })
    .select()
    .single();
  if (error) throw error;
  return mapParticipant({ ...data, submissions: [] });
}

export async function removeParticipant(id) {
  const { error } = await supabase.from('participants').delete().eq('id', id);
  if (error) throw error;
}

export async function submitAnswer(participantId, sessionId, { bloc2, bloc3, intensity, description }) {
  const { error } = await supabase
    .from('submissions')
    .upsert(
      { participant_id: participantId, session_id: sessionId, bloc2, bloc3, intensity, description },
      { onConflict: 'participant_id' },
    );
  if (error) throw error;
}

// Any change to sessions/participants/submissions (from any device) calls
// onChange so callers can refetch. Coarse-grained by design: the dataset for
// one tasting event is small, so a full refetch per change is simple and cheap.
export function subscribeToChanges(onChange) {
  const channel = supabase
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
