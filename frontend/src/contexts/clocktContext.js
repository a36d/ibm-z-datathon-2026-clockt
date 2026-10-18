import { createContext, useContext } from 'react'

export const ClocktContext = createContext(null)

export function useClockt() {
  const context = useContext(ClocktContext)
  if (!context) throw new Error('useClockt must be used within ClocktProvider.')
  return context
}
