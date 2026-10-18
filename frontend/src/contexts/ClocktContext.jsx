import { useEffect, useMemo, useState } from 'react'
import { mockConversations, mockTips } from '../data/mockDashboard.js'
import { ClocktContext } from './clocktContext.js'

const STORAGE_KEY = 'clockt:workspace'

function createInitialData() {
  return {
    tips: mockTips.map((tip) => ({ ...tip })),
    conversations: mockConversations.map((conversation) => ({ ...conversation })),
    settings: {
      sensitivity: 55,
      maxRecommendations: 6,
      autoClean: true,
      workRole: '',
      workStyle: '',
      goals: [],
    },
    profile: { fullName: 'Alex Morgan', email: '' },
  }
}

function isWorkspaceData(value) {
  return value &&
    Array.isArray(value.tips) &&
    Array.isArray(value.conversations) &&
    value.settings &&
    value.profile
}

function pruneExpiredTips(data, force = false, now = Date.now()) {
  if (!force && !data.settings.autoClean) return data
  const tips = data.tips.filter((tip) => !tip.expiresAt || new Date(tip.expiresAt).getTime() > now)
  if (tips.length === data.tips.length) return data
  return {
    ...data,
    tips,
  }
}

function loadInitialWorkspace() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return { workspace: createInitialData(), error: '' }
    const parsed = JSON.parse(saved)
    if (!isWorkspaceData(parsed)) {
      throw new Error('Saved workspace data has an unexpected format.')
    }
    const defaults = createInitialData()
    return {
      workspace: {
        ...defaults,
        ...parsed,
        settings: { ...defaults.settings, ...parsed.settings },
        profile: { ...defaults.profile, ...parsed.profile },
      },
      error: '',
    }
  } catch (error) {
    return { workspace: createInitialData(), error: `Could not load saved workspace data: ${error.message}` }
  }
}

export function ClocktProvider({ children }) {
  const [initial] = useState(loadInitialWorkspace)
  const [workspace, setWorkspace] = useState(initial.workspace)
  const [storageError, setStorageError] = useState(initial.error)
  const [clock, setClock] = useState(0)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
      queueMicrotask(() => setStorageError(''))
    } catch (error) {
      queueMicrotask(() => setStorageError(`Could not save workspace changes: ${error.message}`))
    }
  }, [workspace])

  useEffect(() => {
    const refreshClock = () => {
      const now = Date.now()
      setClock(now)
      if (workspace.settings.autoClean) {
        setWorkspace((current) => pruneExpiredTips(current, false, now))
      }
    }
    const initialTimer = window.setTimeout(refreshClock, 0)
    const interval = window.setInterval(refreshClock, 60_000)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(interval)
    }
  }, [workspace.settings.autoClean])

  const actions = useMemo(() => ({
    updateSettings(patch) {
      setWorkspace((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
    },
    updateProfile(profile) {
      setWorkspace((current) => ({ ...current, profile: { ...current.profile, ...profile } }))
    },
    engageTip(id) {
      const now = new Date().toISOString()
      setWorkspace((current) => {
        const tip = current.tips.find((item) => item.id === id)
        if (!tip) return current
        const conversationId = tip.conversationId ?? `conversation-${id}`
        const conversation = {
          id: conversationId,
          title: tip.title,
          application: tip.application,
          lastMessage: 'Let’s explore this time-saving idea.',
          lastEngaged: now,
          messageCount: 1,
        }
        const previousConversation = current.conversations.find((item) => item.id === conversationId)
        return {
          ...current,
          tips: current.tips.map((item) => item.id === id
            ? { ...item, status: item.status === 'accepted' ? 'accepted' : 'interacted', interactedAt: item.interactedAt ?? now, expiresAt: item.status === 'accepted' ? null : (item.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()), conversationId }
            : item),
          conversations: [
            { ...conversation, ...(previousConversation ?? {}), lastEngaged: now, messageCount: (previousConversation?.messageCount ?? 0) + 1 },
            ...current.conversations.filter((item) => item.id !== conversationId),
          ],
        }
      })
    },
    resolveTip(id, resolution) {
      const now = new Date().toISOString()
      setWorkspace((current) => ({
        ...current,
        tips: current.tips.map((tip) => tip.id === id
          ? {
              ...tip,
              status: resolution,
              interactedAt: now,
              expiresAt: resolution === 'accepted' ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }
          : tip),
      }))
    },
    engageConversation(id) {
      const now = new Date().toISOString()
      setWorkspace((current) => ({
        ...current,
        conversations: current.conversations
          .map((conversation) => conversation.id === id ? { ...conversation, lastEngaged: now } : conversation)
          .sort((a, b) => new Date(b.lastEngaged).getTime() - new Date(a.lastEngaged).getTime()),
      }))
    },
    clearHistory() {
      const now = Date.now()
      setWorkspace((current) => ({
        ...current,
        tips: current.tips.filter((tip) =>
          tip.status === 'new' ||
          (tip.status === 'interacted' && tip.expiresAt && new Date(tip.expiresAt).getTime() > now)),
        conversations: [],
      }))
    },
    cleanExpired() {
      setWorkspace((current) => pruneExpiredTips(current, true, Date.now()))
    },
    getStorageBytes() {
      return new Blob([JSON.stringify(workspace)]).size
    },
  }), [workspace])

  const value = useMemo(() => ({ workspace, storageError, clock, ...actions }), [actions, clock, storageError, workspace])

  return <ClocktContext.Provider value={value}>{children}</ClocktContext.Provider>
}
