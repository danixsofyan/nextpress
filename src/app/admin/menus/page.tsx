import { asJson } from '@/lib/as-json'
import { db } from '@/lib/db'
import { MenuRepository } from '@/server'
import { MenusClient } from './menus-client'

export default async function MenusPage() {
  return <MenusClient initialMenus={asJson(await new MenuRepository(db).findMany())} />
}
