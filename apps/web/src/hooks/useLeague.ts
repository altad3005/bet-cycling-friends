import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaguesApi, type League } from '../api/leagues'

const STORAGE_KEY = 'bcf-active-league'

export function useLeague() {
  const queryClient = useQueryClient()
  const [activeLeague, setActiveLeagueState] = useState<League | null>(null)

  const { data: myLeagues, isLoading } = useQuery({
    queryKey: ['my-leagues'],
    queryFn: () => leaguesApi.myLeagues().then((r) => r.data.data.leagues),
  })

  useEffect(() => {
    if (!myLeagues || myLeagues.length === 0) return
    const savedId = localStorage.getItem(STORAGE_KEY)
    const saved = savedId ? myLeagues.find((l) => l.id === savedId) : null
    setActiveLeagueState(saved ?? myLeagues[0])
  }, [myLeagues])

  function setActiveLeague(league: League) {
    localStorage.setItem(STORAGE_KEY, league.id)
    setActiveLeagueState(league)
  }

  const createMutation = useMutation({
    mutationFn: (name: string) => leaguesApi.create(name),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-leagues'] })
      setActiveLeague(res.data.data.league)
    },
  })

  const joinMutation = useMutation({
    mutationFn: (code: string) => leaguesApi.join(code),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-leagues'] })
      setActiveLeague(res.data.data.league)
    },
  })

  return { activeLeague, setActiveLeague, myLeagues, isLoading, createMutation, joinMutation }
}
