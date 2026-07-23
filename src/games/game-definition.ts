import type { LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'

export type GameDefinition = {
  id: string
  path: string
  title: string
  description: string
  Icon: LucideIcon
  Screen: ComponentType
}
