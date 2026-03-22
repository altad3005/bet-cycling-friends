import { useQuery } from '@tanstack/react-query'
import { MultiplierType } from '@bcf/shared'
import { racesApi } from '../../api/races'
import { betsApi, type BetClassicResponse, type BetGrandTourResponse } from '../../api/bets'
import type { RaceResponse } from '../../api/races'
import ClassicBetForm from './ClassicBetForm'
import GrandTourBetForm from './GrandTourBetForm'
import './BetModal.css'

const MULT_LABELS: Partial<Record<string, string>> = {
  [MultiplierType.MONUMENT]:   'Monument · ×2',
  [MultiplierType.WT_CLASSIC]: 'WorldTour · ×1,5',
  [MultiplierType.STAGE_RACE]: 'Étapes · ×1',
  [MultiplierType.GT_STAGE]:   'Grand Tour',
  [MultiplierType.GT_GC]:      'Grand Tour',
}

interface Props {
  race:    RaceResponse
  onClose: () => void
}

export default function BetModal({ race, onClose }: Props) {
  const { data: startlist, isLoading: loadingList } = useQuery({
    queryKey: ['startlist', race.id],
    queryFn: () => racesApi.startlist(race.id).then((r) => r.data.data.riders),
  })

  const { data: betData, isLoading: loadingBet } = useQuery({
    queryKey: ['bet', race.id],
    queryFn: () => betsApi.myBet(race.id).then((r) => r.data.data.bet),
  })

  const isLoading = loadingList || loadingBet
  const multLabel = race.isGrandTour ? 'Grand Tour · Équipe de 8' : (MULT_LABELS[race.multiplierType] ?? '')

  return (
    <div className="bet-overlay" onClick={onClose}>
      <div className="bet-modal" onClick={(e) => e.stopPropagation()}>

        <div className="bet-modal-header">
          <div>
            <div className="bet-modal-title">{race.name}</div>
            <div className="bet-modal-sub">{multLabel}</div>
          </div>
          <button className="bet-modal-close" onClick={onClose}>×</button>
        </div>

        {isLoading ? (
          <div className="bet-modal-loading">Chargement de la startlist…</div>
        ) : !startlist || startlist.length === 0 ? (
          <div className="bet-modal-loading">Startlist non disponible pour cette course.</div>
        ) : race.isGrandTour ? (
          <GrandTourBetForm
            race={race}
            startlist={startlist}
            existingBet={(betData as BetGrandTourResponse) ?? null}
            onSuccess={onClose}
          />
        ) : (
          <ClassicBetForm
            race={race}
            startlist={startlist}
            existingBet={(betData as BetClassicResponse) ?? null}
            onSuccess={onClose}
          />
        )}

      </div>
    </div>
  )
}
