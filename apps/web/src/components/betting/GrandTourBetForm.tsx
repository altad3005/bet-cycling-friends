import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GRAND_TOUR_TEAM_SIZE, GT_RIDER_BUDGET } from '@bcf/shared'
import { betsApi, type BetGrandTourResponse } from '../../api/bets'
import { type StartlistRider } from '../../api/races'
import type { RaceResponse } from '../../api/races'

interface Props {
  race:        RaceResponse
  startlist:   StartlistRider[]
  existingBet: BetGrandTourResponse | null
  onSuccess:   () => void
}

function costClass(cost: number): string {
  if (cost >= 30) return 'cost-tier-1'
  if (cost >= 20) return 'cost-tier-2'
  if (cost >= 12) return 'cost-tier-3'
  if (cost >= 6)  return 'cost-tier-4'
  return 'cost-tier-5'
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

  const spent = useMemo(() => team.reduce((s, r) => s + (r.cost ?? 0), 0), [team])
  const budgetPct = Math.min((spent / GT_RIDER_BUDGET) * 100, 100)

  const filtered = useMemo(() => {
    const base = search.trim()
      ? startlist.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
      : [...startlist]
    return base.sort((a, b) => (a.cost !== b.cost ? b.cost - a.cost : a.name.localeCompare(b.name)))
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
    } else if (team.length < GRAND_TOUR_TEAM_SIZE && spent + rider.cost <= GT_RIDER_BUDGET) {
      setTeam([...team, rider])
    }
  }

  const slots = Array.from({ length: GRAND_TOUR_TEAM_SIZE })
  const canSubmit = team.length === GRAND_TOUR_TEAM_SIZE

  const errorMsg = mutation.isError
    ? ((mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    : null

  return (
    <div className="bet-form">
      {/* ── Budget bar ── */}
      <div className="gt-budget-wrap">
        <div className="gt-budget-header">
          <span className="gt-budget-label">Budget</span>
          <span className={`gt-budget-value${spent > GT_RIDER_BUDGET ? ' over' : ''}`}>
            {spent} <span className="gt-budget-sep">/</span> {GT_RIDER_BUDGET} cr
          </span>
        </div>
        <div className="gt-budget-bar-track">
          <div
            className={`gt-budget-bar-fill${spent >= GT_RIDER_BUDGET * 0.9 ? ' warn' : ''}`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>
      </div>

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
                  <span className={`gt-cost-badge sm ${costClass(rider.cost)}`}>{rider.cost}</span>
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
          const inTeam   = team.some((r) => r.id === rider.id)
          const teamFull = !inTeam && team.length >= GRAND_TOUR_TEAM_SIZE
          const overBudget = !inTeam && spent + rider.cost > GT_RIDER_BUDGET
          const disabled = teamFull || overBudget

          return (
            <div
              key={rider.id}
              className={`bet-rider-row${inTeam ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
              onClick={() => !disabled && toggleRider(rider)}
              style={disabled ? { opacity: 0.35, cursor: 'default' } : undefined}
            >
              <div className="bet-rider-row-left">
                <div className="bet-rider-name">{rider.name}</div>
                {rider.pcsRank && (
                  <div className="bet-rider-rank">#{rider.pcsRank}</div>
                )}
              </div>
              <div className="bet-rider-row-right">
                <span className={`gt-cost-badge ${costClass(rider.cost)}`}>{rider.cost} cr</span>
                <div className="bet-rider-hint">
                  {inTeam ? '✓' : disabled ? '' : '+'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <div className="bet-modal-footer">
        {errorMsg && <div className="bet-modal-error">{errorMsg}</div>}
        <button
          className="btn-primary"
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending
            ? 'Enregistrement…'
            : existingBet
              ? 'Modifier l\'équipe'
              : `Confirmer l'équipe (${spent} / ${GT_RIDER_BUDGET} cr)`}
        </button>
      </div>
    </div>
  )
}
