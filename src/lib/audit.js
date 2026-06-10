import { supabase } from './supabase.js'

export async function logAudit({ userId, action, entityType, entityId, details }) {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: details ?? null
  })

  if (error) console.error('Audit log failed:', error.message)
}
