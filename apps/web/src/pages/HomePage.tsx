import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaguesApi, type League } from '../api/leagues'
import { standingsApi } from '../api/standings'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'

export default function HomePage() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [leagueName, setLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [activeLeague, setActiveLeague] = useState<League | null>(null)

  const { data: myLeagues, isLoading: loadingLeagues } = useQuery({
    queryKey: ['my-leagues'],
    queryFn: () => leaguesApi.myLeagues().then((r) => r.data.data.leagues),
  })

  const { data: leagueStandings } = useQuery({
    queryKey: ['standings', 'league', activeLeague?.id],
    queryFn: () => standingsApi.league(activeLeague!.id).then((r) => r.data.data.standings),
    enabled: !!activeLeague,
  })

  const { data: globalStandings } = useQuery({
    queryKey: ['standings', 'global'],
    queryFn: () => standingsApi.global().then((r) => r.data.data.standings),
  })

  const createMutation = useMutation({
    mutationFn: () => leaguesApi.create(leagueName),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-leagues'] })
      setActiveLeague(res.data.data.league)
      setLeagueName('')
      setShowCreate(false)
    },
  })

  const joinMutation = useMutation({
    mutationFn: () => leaguesApi.join(joinCode),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-leagues'] })
      setActiveLeague(res.data.data.league)
      setJoinCode('')
      setShowJoin(false)
    },
  })

  async function handleLogout() {
    await authApi.logout().catch(() => {})
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-blue-600">BetCycling</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.pseudo}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-700">
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => { setShowCreate(!showCreate); setShowJoin(false) }}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            + Créer une ligue
          </button>
          <button
            onClick={() => { setShowJoin(!showJoin); setShowCreate(false) }}
            className="border border-blue-600 text-blue-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-50"
          >
            Rejoindre une ligue
          </button>
        </div>

        {showCreate && (
          <div className="bg-white rounded-xl shadow p-4 flex gap-3">
            <input
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              placeholder="Nom de la ligue"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => createMutation.mutate()}
              disabled={!leagueName || createMutation.isPending}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Créer
            </button>
          </div>
        )}

        {showJoin && (
          <div className="bg-white rounded-xl shadow p-4 space-y-2">
            <div className="flex gap-3">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Code d'invitation (ex: A1B2C3D4)"
                className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => joinMutation.mutate()}
                disabled={!joinCode || joinMutation.isPending}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Rejoindre
              </button>
            </div>
            {joinMutation.isError && (
              <p className="text-red-500 text-sm">Code invalide ou ligue introuvable.</p>
            )}
          </div>
        )}

        {/* Mes ligues */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">Mes ligues</h2>
          {loadingLeagues ? (
            <p className="text-gray-400 text-sm">Chargement…</p>
          ) : myLeagues && myLeagues.length > 0 ? (
            <ul className="space-y-2">
              {myLeagues.map((league) => (
                <li key={league.id}>
                  <button
                    onClick={() => setActiveLeague(activeLeague?.id === league.id ? null : league)}
                    className={`w-full text-left rounded-lg px-4 py-3 border transition-colors ${
                      activeLeague?.id === league.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{league.name}</span>
                        <span className="ml-2 text-xs text-gray-400">#{league.season}</span>
                        {league.isAdmin && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 rounded px-1.5 py-0.5">
                            admin
                          </span>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{league.memberCount} membre{league.memberCount > 1 ? 's' : ''}</div>
                        <div className="text-xs font-mono text-gray-300">{league.code}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">
              Tu n'as pas encore de ligue. Crée-en une ou rejoins-en une avec un code.
            </p>
          )}
        </div>

        {/* Classement de la ligue sélectionnée */}
        {activeLeague && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4">Classement — {activeLeague.name}</h2>
            {leagueStandings && leagueStandings.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b">
                    <th className="pb-2 w-8">#</th>
                    <th className="pb-2">Joueur</th>
                    <th className="pb-2 text-right">Points</th>
                    <th className="pb-2 text-right">Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {leagueStandings.map((row) => (
                    <tr key={row.userId} className="border-b last:border-0">
                      <td className="py-2 text-gray-400">{row.rank}</td>
                      <td className="py-2 font-medium">{row.pseudo}</td>
                      <td className="py-2 text-right font-mono">{row.totalPoints}</td>
                      <td className="py-2 text-right text-gray-500">{row.racesPlayed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400 text-sm">Aucun résultat pour l'instant.</p>
            )}
          </div>
        )}

        {/* Classement mondial */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">Classement mondial</h2>
          {globalStandings && globalStandings.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="pb-2 w-8">#</th>
                  <th className="pb-2">Joueur</th>
                  <th className="pb-2 text-right">%</th>
                  <th className="pb-2 text-right">Courses</th>
                </tr>
              </thead>
              <tbody>
                {globalStandings.map((row) => (
                  <tr key={row.userId} className="border-b last:border-0">
                    <td className="py-2 text-gray-400">{row.rank}</td>
                    <td className="py-2 font-medium">{row.pseudo}</td>
                    <td className="py-2 text-right font-mono">{row.percentage}%</td>
                    <td className="py-2 text-right text-gray-500">{row.racesPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-sm">Aucun résultat pour l'instant.</p>
          )}
        </div>
      </main>
    </div>
  )
}
