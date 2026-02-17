import { describe, it, expect } from 'vitest'
import { scoreLeadByRules } from './leadScoringEngine'

describe('leadScoringEngine', () => {
  it('scores hot for high bill homeowner with cash', () => {
    const out = scoreLeadByRules({
      monthlyElectricBill: 250,
      homeOwner: true,
      propertyType: 'residential',
      financingReady: 'cash',
      appointmentScheduled: true,
      engagementActivity: 5,
      creditRange: 'excellent',
    })
    expect(out.score).toBe('hot')
    expect(out.nextAction).toBe('schedule_site_survey')
  })

  it('scores cold for low bill renter unknown financing', () => {
    const out = scoreLeadByRules({
      monthlyElectricBill: 30,
      homeOwner: false,
      propertyType: 'residential',
      financingReady: 'unknown',
      appointmentScheduled: false,
      engagementActivity: 0,
    })
    expect(out.score).toBe('cold')
    expect(out.nextAction).toBe('nurture_campaign')
  })
})
