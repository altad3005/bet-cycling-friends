import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RaceStatus } from '@bcf/shared'
import { racesApi } from '../api/races'
import { betsApi } from '../api/bets'
import { standingsApi } from '../api/standings'
import { useLeague } from '../hooks/useLeague'
import { useAuthStore } from '../stores/auth'
import AppShell from '../components/AppShell'
import BetModal from '../components/betting/BetModal'
import RaceHero from '../components/race/RaceHero'
import RaceLeagueStandings from '../components/race/RaceLeagueStandings'
import RaceGtStages from '../components/race/RaceGtStages'
import RaceStartlist from '../components/race/RaceStartlist'
import './RacePage.css'

export default function RacePage() {
  const { raceId } = useParams<{ raceId: string }>()
  const user = useAuthStore((s) => s.user)
  const { activeLeague } = useLeague()
  const [betOpen, setBetOpen] = useState(false)

  const { data: races } = useQuery({
    queryKey: ['races', 'league', activeLeague?.id],
    queryFn: () => racesApi.leagueRaces(activeLeague!.id).then((r) => r.data.data.races),
    enabled: !!activeLeague,
  })
  const race = races?.find((r) => r.id === raceId)

  const { data: myBet } = useQuery({
    queryKey: ['bet', raceId],
    queryFn: () => betsApi.myBet(raceId!).then((r) => r.data.data.bet),
    enabled: !!raceId,
  })

  const { data: startlist } = useQuery({
    queryKey: ['startlist', raceId],
    queryFn: () => racesApi.startlist(raceId!).then((r) => r.data.data.riders),
    enabled: !!raceId,
  })

  const { data: raceStandings } = useQuery({
    queryKey: ['standings', 'race', activeLeague?.id, raceId],
    queryFn: () => standingsApi.race(activeLeague!.id, raceId!).then((r) => r.data.data.standings),
    enabled: !!activeLeague && !!raceId && race?.status !== RaceStatus.UPCOMING,
  })

  const { data: leagueBetsData } = useQuery({
    queryKey: ['bets', 'league', activeLeague?.id, raceId],
    queryFn: () => betsApi.leagueBets(activeLeague!.id, raceId!).then((r) => r.data.data),
    enabled: !!activeLeague && !!raceId,
  })

  const { data: stagesData } = useQuery({
    queryKey: ['stages', raceId],
    queryFn: () => racesApi.stages(raceId!).then((r) => r.data.data),
    enabled: !!raceId && !!race?.isGrandTour,
  })

  const { data: raceResults } = useQuery({
    queryKey: ['results', raceId],
    queryFn: () => racesApi.results(raceId!).then((r) => r.data.data.results),
    enabled: !!raceId && race?.resultsFinal === true,
  })

  if (!race) return null

  return (
    <>
      <AppShell activePage="calendar" pageTitle={race.name}>
        <RaceHero race={race} myBet={myBet} onBetClick={() => setBetOpen(true)} />
        <div className="race-body">
          <RaceLeagueStandings
            race={race}
            userId={user?.id}
            myBet={myBet}
            raceStandings={raceStandings}
            leagueBetsData={leagueBetsData}
            raceResults={raceResults}
          />
          {race.isGrandTour && stagesData && stagesData.stages.length > 0 && (
            <RaceGtStages raceId={raceId!} stages={stagesData.stages} gcSynced={stagesData.gcSynced} />
          )}
          {startlist && startlist.length > 0 && (
            <RaceStartlist startlist={startlist} />
          )}
        </div>
      </AppShell>
      {betOpen && <BetModal race={race} onClose={() => setBetOpen(false)} />}
    </>
  )
}
