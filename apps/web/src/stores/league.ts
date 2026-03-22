import { create } from 'zustand'
import type { League } from '../api/leagues'

const STORAGE_KEY = 'bcf-active-league'

interface LeagueState {
  activeLeague: League | null
  setActiveLeague: (league: League) => void
  initFromList: (leagues: League[]) => void
  reset: () => void
}

export const useLeagueStore = create<LeagueState>((set, get) => ({
  activeLeague: null,
  setActiveLeague: (league) => {
    localStorage.setItem(STORAGE_KEY, league.id)
    set({ activeLeague: league })
  },
  initFromList: (leagues) => {
    if (leagues.length === 0) return
    const current = get().activeLeague
    // Keep current if it's still in the list
    if (current && leagues.find((l) => l.id === current.id)) return
    const savedId = localStorage.getItem(STORAGE_KEY)
    const saved = savedId ? leagues.find((l) => l.id === savedId) : null
    set({ activeLeague: saved ?? leagues[0] })
  },
  reset: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ activeLeague: null })
  },
}))
