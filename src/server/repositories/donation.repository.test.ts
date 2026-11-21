import { describe, expect, it } from 'vitest'
import { donationStatus } from './donation.repository'

describe('donationStatus', () => {
  it('maps SumoPod events and statuses', () => {
    expect(donationStatus('payment.success', 'PAID')).toBe('completed')
    expect(donationStatus(undefined, 'completed')).toBe('completed')
    expect(donationStatus('payment.expired')).toBe('expired')
    expect(donationStatus('payment.failed', 'FAILED')).toBe('failed')
    expect(donationStatus('payment.created', 'pending')).toBeNull()
  })
})
