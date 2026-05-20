import { useState } from 'react'
import type { StartlistRider } from '../../api/races'

interface Props {
  startlist: StartlistRider[]
}

export default function RaceStartlist({ startlist }: Props) {
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()
  const filtered = q
    ? startlist.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.teamName ?? '').toLowerCase().includes(q)
      )
    : startlist

  const byTeam = filtered.reduce<Record<string, StartlistRider[]>>((acc, rider) => {
    const team = rider.teamName?.replace(/\s*\(.*?\)\s*$/, '') ?? 'Sans équipe'
    if (!acc[team]) acc[team] = []
    acc[team].push(rider)
    return acc
  }, {})
  const teams = Object.entries(byTeam)

  return (
    <section className="race-section">
      <div className="race-section-title">
        Startlist{' '}
        <span className="race-section-badge">
          {startlist.length} coureurs
          {Object.keys(byTeam).length > 1 ? ` · ${Object.keys(byTeam).length} équipes` : ''}
        </span>
      </div>
      <input
        className="startlist-search"
        type="text"
        placeholder="Rechercher un coureur ou une équipe…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {teams.length === 0 ? (
        <div className="race-empty">Aucun résultat pour "{search}".</div>
      ) : (
        <div className="startlist-teams">
          {teams.map(([team, riders]) => (
            <div key={team} className="startlist-team">
              <div className="startlist-team-name">{team}</div>
              <div className="startlist-team-riders">
                {riders.map((rider) => (
                  <div key={rider.id} className="startlist-rider">
                    {rider.nationality && (
                      <span className="startlist-flag">
                        {rider.nationality
                          .toUpperCase()
                          .replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397))}
                      </span>
                    )}
                    <span className="startlist-rider-name">{rider.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
