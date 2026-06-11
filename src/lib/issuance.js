export const ISSUANCE_TYPES = {
  temporary: 'temporary',
  assignment: 'assignment'
}

export const issuanceTypeLabels = {
  temporary: 'Temporary borrow',
  assignment: 'Staff assignment'
}

export const RETURN_REASONS = [
  { value: 'employment_ended', label: 'Employment ended' },
  { value: 'damaged', label: 'Damaged / faulty' },
  { value: 'transfer', label: 'Staff transfer' },
  { value: 'replacement', label: 'Equipment replacement' },
  { value: 'other', label: 'Other' }
]

export function returnReasonLabel(value) {
  return RETURN_REASONS.find((r) => r.value === value)?.label ?? value ?? '—'
}

export function formatExpectedReturn(row) {
  if (row.issuance_type === ISSUANCE_TYPES.assignment) return 'Ongoing'
  if (!row.expected_return_at) return 'Not set'
  return new Date(row.expected_return_at).toLocaleString()
}

export function isAssignment(row) {
  return row?.issuance_type === ISSUANCE_TYPES.assignment
}
