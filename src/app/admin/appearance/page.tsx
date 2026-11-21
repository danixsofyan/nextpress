import { getAppearance } from '@/lib/themes'
import { AppearanceClient } from './appearance-client'

export default async function AppearancePage() {
  return <AppearanceClient initialData={await getAppearance()} />
}
