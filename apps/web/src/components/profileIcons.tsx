import type { ReactNode } from 'react'
import type { ProfileIcon } from '@bcf/shared'

export const PROFILE_ICON_PATHS: Record<ProfileIcon, ReactNode> = {
  'bike-road': (
    <>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </>
  ),
  'bike-mtb': (
    <>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M5.5 17.5 9 9h6l3 8.5M9 9 7.5 6H5.5M15 9l1.5-3h2.5" />
    </>
  ),
  helmet: (
    <>
      <path d="M3 13a9 9 0 0 1 18 0" />
      <path d="M3 13h18v1.5a1.5 1.5 0 0 1-1.5 1.5H16l-1-2H9l-1 2H4.5A1.5 1.5 0 0 1 3 14.5z" />
    </>
  ),
  wheel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1.5" />
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    </>
  ),
  'jersey-yellow': (
    <path d="M8 3 4 5l1.5 4L8 8v13h8V8l2.5 1L20 5l-4-2a4 4 0 0 1-8 0z" />
  ),
  'jersey-polka': (
    <>
      <path d="M8 3 4 5l1.5 4L8 8v13h8V8l2.5 1L20 5l-4-2a4 4 0 0 1-8 0z" />
      <circle cx="12" cy="12" r=".6" />
      <circle cx="10" cy="15" r=".6" />
      <circle cx="14" cy="15" r=".6" />
      <circle cx="12" cy="17.5" r=".6" />
    </>
  ),
  'jersey-green': (
    <>
      <path d="M8 3 4 5l1.5 4L8 8v13h8V8l2.5 1L20 5l-4-2a4 4 0 0 1-8 0z" />
      <path d="M8 13h8" />
    </>
  ),
  cyclist: (
    <>
      <circle cx="14" cy="5" r="2" />
      <path d="M14 7v4l3 3M14 11l-4 1 1 5M10 12l-3 1" />
    </>
  ),
  mountain: <path d="m3 20 6-12 4 6 3-4 5 10z" />,
  trophy: (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 21h16" />
      <path d="M10 15v2.5c0 .8-.7 1-1 1.5-.7.5-1 1-1 2" />
      <path d="M14 15v2.5c0 .8.7 1 1 1.5.7.5 1 1 1 2" />
      <path d="M18 3H6v6a6 6 0 0 0 12 0z" />
    </>
  ),
  medal: (
    <>
      <path d="M7.5 4 5 9M16.5 4 19 9" />
      <path d="M8 4h8" />
      <circle cx="12" cy="15" r="5" />
      <path d="M12 13v4" />
    </>
  ),
  stopwatch: (
    <>
      <path d="M10 2h4" />
      <path d="M12 6V4" />
      <circle cx="12" cy="14" r="8" />
      <path d="M12 14l2.5-2.5" />
    </>
  ),
}
