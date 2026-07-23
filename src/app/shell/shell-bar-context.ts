import { createContext, useContext, type ReactNode } from 'react'

export type ShellBarOverride = {
  leading: ReactNode
  trailing: ReactNode
}

export const ShellBarContext = createContext<
  ((override: ShellBarOverride | null) => void) | undefined
>(undefined)

export function useShellBar() {
  const setShellBar = useContext(ShellBarContext)
  if (!setShellBar) throw new Error('useShellBar must be used inside AppShell')
  return setShellBar
}
