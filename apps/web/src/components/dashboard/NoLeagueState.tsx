import { useState } from 'react'
import { useLeague } from '../../hooks/useLeague'

export default function NoLeagueState() {
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle')
  const [leagueName, setLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const { createMutation, joinMutation } = useLeague()

  return (
    <div className="empty-layout">
      <div className="empty-card">
        <div className="empty-title">Bienvenue dans BCF</div>
        <div className="empty-sub">
          Crée ta première ligue ou rejoins celle d'un ami avec son code d'invitation.
        </div>
        <div className="empty-actions">
          {mode === 'create' ? (
            <>
              <input
                className="empty-input"
                placeholder="Nom de ta ligue"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && leagueName && createMutation.mutate(leagueName)}
                autoFocus
              />
              {createMutation.isError && (
                <div className="empty-error">Impossible de créer la ligue.</div>
              )}
              <button
                className="btn-primary"
                onClick={() => createMutation.mutate(leagueName)}
                disabled={!leagueName || createMutation.isPending}
              >
                {createMutation.isPending ? 'Création…' : 'Créer la ligue'}
              </button>
              <button className="btn-ghost-sm" onClick={() => setMode('idle')}>Annuler</button>
            </>
          ) : mode === 'join' ? (
            <>
              <input
                className="empty-input"
                placeholder="Code d'invitation (ex: FDG-2026)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && joinCode && joinMutation.mutate(joinCode)}
                autoFocus
              />
              {joinMutation.isError && (
                <div className="empty-error">Code invalide ou ligue introuvable.</div>
              )}
              <button
                className="btn-primary"
                onClick={() => joinMutation.mutate(joinCode)}
                disabled={!joinCode || joinMutation.isPending}
              >
                {joinMutation.isPending ? 'Rejoindre…' : 'Rejoindre la ligue'}
              </button>
              <button className="btn-ghost-sm" onClick={() => setMode('idle')}>Annuler</button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={() => setMode('create')}>
                + Créer une ligue
              </button>
              <div className="empty-divider">
                <div className="empty-divider-line" />
                <div className="empty-divider-txt">ou</div>
                <div className="empty-divider-line" />
              </div>
              <button className="btn-ghost-sm" onClick={() => setMode('join')}>
                Rejoindre avec un code
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
