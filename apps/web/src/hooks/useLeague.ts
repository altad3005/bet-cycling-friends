import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaguesApi } from '../api/leagues'
import { useLeagueStore } from '../stores/league'

export function useLeague() {
  const queryClient = useQueryClient()
  const { activeLeague, setActiveLeague, initFromList } = useLeagueStore()

  const { data: myLeagues, isLoading } = useQuery({
    queryKey: ['my-leagues'],
    queryFn: () => leaguesApi.myLeagues().then((r) => r.data.data.leagues),
  })

  useEffect(() => {
    if (myLeagues) initFromList(myLeagues)
  }, [myLeagues])

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
