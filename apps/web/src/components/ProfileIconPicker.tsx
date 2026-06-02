import { PROFILE_ICONS } from '@bcf/shared'
import { PROFILE_ICON_PATHS } from './profileIcons'

interface ProfileIconPickerProps {
  value: string
  onSelect: (icon: string) => void
}

export default function ProfileIconPicker({ value, onSelect }: ProfileIconPickerProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {PROFILE_ICONS.map((id) => {
        const selected = id === value
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            style={{
              aspectRatio: '1',
              borderRadius: 14,
              background: selected ? 'rgba(232,201,109,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${selected ? '#e8c96d' : 'transparent'}`,
              color: selected ? '#e8c96d' : '#b0b8c8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={26}
              height={26}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {PROFILE_ICON_PATHS[id]}
            </svg>
          </button>
        )
      })}
    </div>
  )
}
