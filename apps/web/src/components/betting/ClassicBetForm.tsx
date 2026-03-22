import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { betsApi, type BetClassicResponse } from '../../api/bets'
import { type StartlistRider } from '../../api/races'
import type { RaceResponse } from '../../api/races'

interface Props {
  race:        RaceResponse
  startlist:   StartlistRider[]
  existingBet: BetClassicResponse | null
  onSuccess:   () => void
}

export default function ClassicBetForm({ race, startlist, existingBet, onSuccess }: Props) {
  const queryClient = useQueryClient()

  const [favoriteRider, setFavoriteRider] = useState<StartlistRider | null>(() =>
    existingBet?.favoriteRider
      ? (startlist.find((r) => r.id === existingBet.favoriteRider!.id) ?? null)
      : null
  )
  const [bonusRider, setBonusRider] = useState<StartlistRider | null>(() =>
    existingBet?.bonusRider
      ? (startlist.find((r) => r.id === existingBet.bonusRider!.id) ?? null)
      : null
  )
  const [activeSlot, setActiveSlot] = useState<'favorite' | 'bonus'>('favorite')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return startlist
    const q = search.toLowerCase()
    return startlist.filter((r) => r.name.toLowerCase().includes(q))
  }, [startlist, search])

  const mutation = useMutation({
    mutationFn: () => betsApi.placeClassic(race.id, favoriteRider!.id, bonusRider!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bet', race.id] })
      onSuccess()
    },
  })

  function selectRider(rider: StartlistRider) {
    if (activeSlot === 'favorite') {
      setFavoriteRider(rider)
      // Auto-avance vers le slot bonus si vide
      if (!bonusRider) setActiveSlot('bonus')
    } else {
      setBonusRider(rider)
      if (!favoriteRider) setActiveSlot('favorite')
    }
  }

  const favIsSelected   = (r: StartlistRider) => favoriteRider?.id === r.id
  const bonusIsSelected = (r: StartlistRider) => bonusRider?.id === r.id
  const canSubmit = !!favoriteRider && !!bonusRider && favoriteRider.id !== bonusRider.id

  return (
    <div className="bet-form">
      {/* ── Slots ── */}
      <div className="bet-slots">
        <div
          className={`bet-slot${activeSlot === 'favorite' ? ' active' : ''}`}
          onClick={() => setActiveSlot('favorite')}
        >
          <div className="bet-slot-label">★ Favori</div>
          {favoriteRider
            ? <div className="bet-slot-rider">{favoriteRider.name}</div>
            : <div className="bet-slot-empty">Sélectionner…</div>
          }
          <div className="bet-slot-coeff fav">×1,0</div>
        </div>
        <div
          className={`bet-slot${activeSlot === 'bonus' ? ' active' : ''}`}
          onClick={() => setActiveSlot('bonus')}
        >
          <div className="bet-slot-label">⊕ Bonus</div>
          {bonusRider
            ? <div className="bet-slot-rider">{bonusRider.name}</div>
            : <div className="bet-slot-empty">Sélectionner…</div>
          }
          <div className="bet-slot-coeff bonus">×0,5</div>
        </div>
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
          const isFav   = favIsSelected(rider)
          const isBonus = bonusIsSelected(rider)
          const hint = isFav ? '★ Favori' : isBonus ? '⊕ Bonus'
            : activeSlot === 'favorite' ? '→ Favori' : '→ Bonus'
          return (
            <div
              key={rider.id}
              className={`bet-rider-row${(isFav || isBonus) ? ' selected' : ''}`}
              onClick={() => selectRider(rider)}
            >
              <div className="bet-rider-name">{rider.name}</div>
              <div className="bet-rider-hint">{hint}</div>
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
            : existingBet ? 'Modifier le pronostic' : 'Confirmer le pronostic'}
        </button>
      </div>
    </div>
  )
}
