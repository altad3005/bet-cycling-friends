import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RankDelta from './RankDelta'

describe('RankDelta', () => {
  it('renders an up arrow for a positive delta', () => {
    render(<RankDelta delta={3} />)
    expect(screen.getByText('▲3')).toBeInTheDocument()
  })

  it('renders a down arrow with the absolute value for a negative delta', () => {
    render(<RankDelta delta={-2} />)
    expect(screen.getByText('▼2')).toBeInTheDocument()
  })

  it('renders a dash when delta is null', () => {
    render(<RankDelta delta={null} />)
    expect(screen.getByText('–')).toBeInTheDocument()
  })
})
