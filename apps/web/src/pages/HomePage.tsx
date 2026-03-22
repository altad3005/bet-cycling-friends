import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RaceStatus } from '@bcf/shared'
import { standingsApi } from '../api/standings'
import { racesApi } from '../api/races'
import { useAuthStore } from '../stores/auth'
import { useLeague } from '../hooks/useLeague'
import AppShell from '../components/AppShell'
import NoLeagueState from '../components/dashboard/NoLeagueState'
import NextRaceBanner from '../components/dashboard/NextRaceBanner'
import StatGrid from '../components/dashboard/StatGrid'
import LeagueStandingsPanel from '../components/dashboard/LeagueStandingsPanel'
import UpcomingRacesPanel from '../components/dashboard/UpcomingRacesPanel'
import Top4Panel from '../components/dashboard/Top4Panel'
import './HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { activeLeague, myLeagues, isLoading } = useLeague()
  const [codeCopied, setCodeCopied] = useState(false)

  const { data: leagueStandings = [] } = useQuery({
    queryKey: ['standings', 'league', activeLeague?.id],
    queryFn: () => standingsApi.league(activeLeague!.id).then((r) => r.data.data.standings),
    enabled: !!activeLeague,
  })

  const { data: leagueRaces = [] } = useQuery({
    queryKey: ['races', 'league', activeLeague?.id],
    queryFn: () => racesApi.leagueRaces(activeLeague!.id).then((r) => r.data.data.races),
    enabled: !!activeLeague,
  })

  if (isLoading) return null

  if (!myLeagues || myLeagues.length === 0) {
    return (
      <AppShell activePage="dashboard" pageTitle="Dashboard">
        <NoLeagueState />
      </AppShell>
    )
  }

  // activeLeague est défini via useEffect — peut être null un render après myLeagues
  if (!activeLeague) return null

  const myStanding     = leagueStandings.find((s) => s.userId === user?.id)
  const leaderStanding = leagueStandings[0]
  const nextRace       = leagueRaces.find((r) => r.status === RaceStatus.LIVE)
                      ?? leagueRaces.find((r) => r.status === RaceStatus.UPCOMING)

  function copyCode() {
    navigator.clipboard.writeText(activeLeague!.code).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 1500)
    })
  }

  const leagueCodeBtn = (
    <div
      className={`league-code${codeCopied ? ' copied' : ''}`}
      onClick={copyCode}
      title="Cliquer pour copier"
    >
      {codeCopied ? 'Copié ✓' : `CODE : ${activeLeague.code}`}
    </div>
  )

  return (
    <AppShell activePage="dashboard" pageTitle="Dashboard" topbarRight={leagueCodeBtn}>

      {nextRace && (
        <NextRaceBanner race={nextRace} onNavigate={() => navigate('/bets')} />
      )}

      <StatGrid
        myStanding={myStanding}
        leaderStanding={leaderStanding}
        memberCount={activeLeague.memberCount ?? 0}
        userId={user?.id ?? ''}
      />

      <div className="two-col">
        <LeagueStandingsPanel
          standings={leagueStandings}
          userId={user?.id ?? ''}
          season={activeLeague.season}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <UpcomingRacesPanel races={leagueRaces} />
          {leagueStandings.some((s) => s.racesPlayed > 0) && (
            <Top4Panel standings={leagueStandings} userId={user?.id ?? ''} />
          )}
        </div>
      </div>

    </AppShell>
  )
}
