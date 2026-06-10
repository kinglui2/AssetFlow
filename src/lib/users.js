import { supabase } from './supabase.js'

export async function fetchUsers() {
  return supabase
    .from('profiles')
    .select('id, full_name, email, role, department, is_active, created_at')
    .order('full_name')
}

export async function updateUserProfile(userId, updates) {
  return supabase.from('profiles').update(updates).eq('id', userId).select().single()
}

export async function createUserAccount({ email, password, fullName, role, department }) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { email, password, full_name: fullName, role, department }
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}
