import { PROFILE_ICONS, type ProfileIcon } from '@bcf/shared'
import { initials, avatarColor } from '../utils/ui'
import { PROFILE_ICON_PATHS } from './profileIcons'

interface AvatarProps {
  pseudo: string
  icon?: string
  colorIndex?: number
  size?: number
}

function isProfileIcon(value: string): value is ProfileIcon {
  return (PROFILE_ICONS as readonly string[]).includes(value)
}

export default function Avatar({ pseudo, icon, colorIndex = 0, size = 36 }: AvatarProps) {
  const col = avatarColor(colorIndex)
  const hasIcon = !!icon && isProfileIcon(icon)

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: col.bg,
        color: col.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: size * 0.4,
        fontWeight: 600,
      }}
    >
      {hasIcon ? (
        <svg
          viewBox="0 0 24 24"
          width={size * 0.55}
          height={size * 0.55}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {PROFILE_ICON_PATHS[icon as ProfileIcon]}
        </svg>
      ) : (
        initials(pseudo)
      )}
    </div>
  )
}
