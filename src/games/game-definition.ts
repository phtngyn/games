import type { ComponentType } from 'react'

export type GameDefinition = {
  id: string
  path: string
  title: string
  description: string
  Icon: ComponentType<{ className?: string }>
  Screen: ComponentType
}
