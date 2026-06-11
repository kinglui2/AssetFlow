import { supabase } from './supabase.js'

export const REQUEST_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled'
}

export async function fetchBorrowRequests({ requesterOnly = false, status = '' } = {}) {
  let query = supabase.from('borrow_requests_detail').select('*').order('created_at', { ascending: false })

  if (requesterOnly) {
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id
    if (userId) query = query.eq('requester_id', userId)
  }

  if (status) query = query.eq('status', status)

  return query
}

export async function createBorrowRequest(payload) {
  return supabase.from('borrow_requests').insert(payload).select().single()
}

export async function cancelBorrowRequest(id) {
  return supabase.from('borrow_requests').update({ status: REQUEST_STATUS.cancelled }).eq('id', id).select().single()
}

export async function reviewBorrowRequest(id, updates) {
  return supabase.from('borrow_requests').update(updates).eq('id', id).select().single()
}

export async function approveAndIssue({ request, equipmentId, reviewerId, expectedReturnAt }) {
  const payload = {
    equipment_id: equipmentId,
    issuance_type: 'temporary',
    borrower_name: request.requester_name,
    borrower_department: request.requester_department || 'General',
    borrower_contact: null,
    purpose: request.purpose,
    expected_return_at: expectedReturnAt,
    issued_by: reviewerId
  }

  const { data: borrowing, error: borrowError } = await supabase
    .from('borrowing_records')
    .insert(payload)
    .select()
    .single()

  if (borrowError) throw borrowError

  const { data: updatedRequest, error: requestError } = await reviewBorrowRequest(request.id, {
    status: REQUEST_STATUS.approved,
    reviewer_id: reviewerId,
    reviewed_at: new Date().toISOString(),
    borrowing_record_id: borrowing.id,
    review_notes: null
  })

  if (requestError) throw requestError

  return { borrowing, request: updatedRequest }
}

export async function rejectBorrowRequest({ id, reviewerId, reviewNotes }) {
  return reviewBorrowRequest(id, {
    status: REQUEST_STATUS.rejected,
    reviewer_id: reviewerId,
    reviewed_at: new Date().toISOString(),
    review_notes: reviewNotes
  })
}
