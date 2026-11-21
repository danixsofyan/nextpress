import { expect, test } from 'vitest'
import { donationOrderId, parseDonationAmount, parseDonor } from './donation-input'

const form = (entries: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) f.set(k, v)
  return f
}

test('parses preset and custom donation amounts within limits', () => {
  expect(parseDonationAmount(form({ amount: '25000' }))).toBe(25000)
  expect(parseDonationAmount(form({ amount: '25000', custom: '75000' }))).toBe(75000)
  expect(parseDonationAmount(form({ amount: '25000', custom: '' }))).toBe(25000)
  expect(parseDonationAmount(form({ amount: '999' }))).toBeNull()
  expect(parseDonationAmount(form({ custom: '1e6' }))).toBeNull()
  expect(parseDonationAmount(form({ custom: '-5000' }))).toBeNull()
  expect(parseDonationAmount(form({ custom: '1000000000' }))).toBeNull()
  expect(parseDonationAmount(form({}))).toBeNull()
})

test('builds a prefixed, unique-looking order id', () => {
  expect(donationOrderId(0, 'abcdef12-0000-0000-0000-000000000000')).toBe('NPD-0-ABCDEF12')
})

test('requires a donor name and trims the optional message', () => {
  expect(parseDonor(form({ name: '  Budi  ', message: ' Semangat! ' }))).toEqual({
    donorName: 'Budi',
    message: 'Semangat!',
  })
  expect(parseDonor(form({ name: 'Ani' }))).toEqual({ donorName: 'Ani', message: null })
  expect(parseDonor(form({ name: '   ' }))).toBeNull()
  expect(parseDonor(form({ message: 'hi' }))).toBeNull()
  expect(parseDonor(form({ name: 'a\u0000b'.padEnd(200, 'x') }))!.donorName).toHaveLength(80)
})
