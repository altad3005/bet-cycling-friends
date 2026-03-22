const FEATURES = [
  {
    title: 'Monuments & Classiques',
    desc: "Paris-Roubaix, Tour des Flandres, Liège. Chaque monument vaut double — l'expertise se récompense.",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
  },
  {
    title: 'Grands Tours',
    desc: "Composez une équipe de 8 coureurs. Points à chaque étape, bonus sur le classement général final.",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    title: 'Ligues privées',
    desc: "Jusqu'à 20 participants. Un code d'invitation, vos amis rejoignent et la compétition commence.",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
]

export default function LandingFeatures() {
  return (
    <div className="bcf-features-wrapper">
      <div className="bcf-features">
        {FEATURES.map((f) => (
          <div key={f.title} className="bcf-feature">
            <div className="bcf-feature-icon">{f.icon}</div>
            <div className="bcf-feature-title">{f.title}</div>
            <div className="bcf-feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
