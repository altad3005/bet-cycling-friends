import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GRAND_TOUR_TEAM_SIZE } from '@bcf/shared'
import { betsApi, type BetGrandTourResponse } from '../../api/bets'
import { type StartlistRider } from '../../api/races'
import type { RaceResponse } from '../../api/races'

interface Props {
  race:        RaceResponse
  startlist:   StartlistRider[]
  existingBet: BetGrandTourResponse | null
  onSuccess:   () => void
}

export default function GrandTourBetForm({ race, startlist, existingBet, onSuccess }: Props) {
  const queryClient = useQueryClient()

  const [team, setTeam] = useState<StartlistRider[]>(() => {
    if (!existingBet?.riders) return []
    return existingBet.riders
      .map((ref) => startlist.find((r) => r.id === ref.id))
      .filter((r): r is StartlistRider => r !== undefined)
  })
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return startlist
    const q = search.toLowerCase()
    return startlist.filter((r) => r.name.toLowerCase().includes(q))
  }, [startlist, search])

  const mutation = useMutation({
    mutationFn: () => betsApi.placeGrandTour(race.id, team.map((r) => r.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bet', race.id] })
      onSuccess()
    },
  })

  function toggleRider(rider: StartlistRider) {
    const inTeam = team.some((r) => r.id === rider.id)
    if (inTeam) {
      setTeam(team.filter((r) => r.id !== rider.id))
    } else if (team.length < GRAND_TOUR_TEAM_SIZE) {
      setTeam([...team, rider])
    }
  }

  const slots = Array.from({ length: GRAND_TOUR_TEAM_SIZE })
  const canSubmit = team.length === GRAND_TOUR_TEAM_SIZE

  return (
    <div className="bet-form">
      {/* ── Team slots ── */}
      <div className="bet-team-header">
        <div className="bet-team-label">Équipe de {GRAND_TOUR_TEAM_SIZE}</div>
        <div className="bet-team-count">
          <span>{team.length}</span> / {GRAND_TOUR_TEAM_SIZE}
        </div>
      </div>

      <div className="bet-team-grid">
        {slots.map((_, i) => {
          const rider = team[i]
          return (
            <div key={i} className="bet-team-slot">
              {rider ? (
                <>
                  <div className="bet-team-slot-name">{rider.name}</div>
                  <button
                    className="bet-team-remove"
                    onClick={() => setTeam(team.filter((r) => r.id !== rider.id))}
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="bet-team-slot-empty">Vide</div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Search ── */}
      <div className="bet-search-wrap">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          className="bet-search"
          placeholder="Rechercher un coureur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* ── Rider list ── */}
      <div className="bet-rider-list">
        {filtered.length === 0 ? (
          <div className="bet-list-empty">Aucun coureur trouvé.</div>
        ) : filtered.map((rider) => {
          const inTeam = team.some((r) => r.id === rider.id)
          const full   = !inTeam && team.length >= GRAND_TOUR_TEAM_SIZE
          return (
            <div
              key={rider.id}
              className={`bet-rider-row${inTeam ? ' selected' : ''}${full ? ' disabled' : ''}`}
              onClick={() => !full && toggleRider(rider)}
              style={full ? { opacity: 0.35, cursor: 'default' } : undefined}
            >
              <div className="bet-rider-name">{rider.name}</div>
              <div className="bet-rider-hint">{inTeam ? '✓ Dans l\'équipe' : full ? '' : '+ Ajouter'}</div>
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <div className="bet-modal-footer">
        {mutation.isError && (
          <div className="bet-modal-error">Erreur lors de l'enregistrement.</div>
        )}
        <button
          className="btn-primary"
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending
            ? 'Enregistrement…'
            : existingBet ? 'Modifier l\'équipe' : `Confirmer l'équipe (${team.length}/${GRAND_TOUR_TEAM_SIZE})`}
        </button>
      </div>
    </div>
  )
}
