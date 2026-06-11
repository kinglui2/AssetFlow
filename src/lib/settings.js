import { supabase } from './supabase.js'

export const defaultAppSettings = {
  company_name: 'Mirema School',
  company_tagline: 'ICT Asset Inventory',
  company_email: '',
  company_phone: '',
  company_address: '',
  notify_new_borrow_requests: true,
  notify_overdue_returns: true,
  notify_assignment_changes: false,
  notification_email: '',
  default_borrow_days: 7,
  require_return_date: false,
  asset_tag_prefix: 'ICT',
  allow_staff_requests: true
}

export async function fetchAppSettings() {
  const { data, error } = await supabase.from('app_settings').select('*').eq('singleton', true).maybeSingle()
  if (error) return { data: null, error }
  return { data: data ?? defaultAppSettings, error: null }
}

export async function updateAppSettings(updates, userId) {
  const { data: existing, error: fetchError } = await fetchAppSettings()
  if (fetchError) return { data: null, error: fetchError }

  if (!existing?.id) {
    return supabase
      .from('app_settings')
      .insert({ singleton: true, ...defaultAppSettings, ...updates, updated_by: userId })
      .select()
      .single()
  }

  return supabase
    .from('app_settings')
    .update({ ...updates, updated_by: userId })
    .eq('id', existing.id)
    .select()
    .single()
}

export async function updateOwnProfile(userId, updates) {
  return supabase.from('profiles').update(updates).eq('id', userId).select().single()
}

export async function fetchCategories() {
  return supabase.from('categories').select('*').order('name')
}

export async function saveCategory({ id, name, description }) {
  const payload = { name: name.trim(), description: description.trim() || null }
  if (id) return supabase.from('categories').update(payload).eq('id', id).select().single()
  return supabase.from('categories').insert(payload).select().single()
}

export async function deleteCategory(id) {
  return supabase.from('categories').delete().eq('id', id)
}

export async function updatePassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword })
}
