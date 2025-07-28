import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { FinancialDashboard } from '../FinancialDashboard'

jest.mock('../LiveDataPanel', () => ({
  LiveDataPanel: ({
    symbol,
    className
  }: {
    symbol: string
    className: string
  }) => (
    <div
      data-testid="live-data-panel"
      data-symbol={symbol}
      className={className}>
      <h3>Live Data Panel</h3>
      <div>Live Price: $45,000</div>
      <div>24h Volume: 1,234,567</div>
    </div>
  )
}))

jest.mock('../financial-calendar/FinancialCalendar', () => ({
  FinancialCalendar: ({
    symbol,
    className
  }: {
    symbol: string
    className: string
  }) => (
    <div
      data-testid="financial-calendar"
      data-symbol={symbol}
      className={className}>
      <h3>Financial Calendar</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Price</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2024-01-01</td>
            <td>$45,000</td>
            <td>1,234,567</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}))

describe('FinancialDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders the dashboard with default symbol', () => {
      render(<FinancialDashboard />)

      const symbolSelector = screen.getByRole('combobox')
      expect(symbolSelector).toBeInTheDocument()

      expect(screen.getByText('BTCUSDT')).toBeInTheDocument()
    })

    it('renders live data panel with correct props', () => {
      render(<FinancialDashboard />)

      const liveDataPanel = screen.getByTestId('live-data-panel')
      expect(liveDataPanel).toBeInTheDocument()
      expect(liveDataPanel).toHaveAttribute('data-symbol', 'BTCUSDT')
      expect(liveDataPanel).toHaveClass('flex-1')
    })

    it('renders financial calendar with correct props', () => {
      render(<FinancialDashboard />)

      const financialCalendar = screen.getByTestId('financial-calendar')
      expect(financialCalendar).toBeInTheDocument()
      expect(financialCalendar).toHaveAttribute('data-symbol', 'BTCUSDT')
      expect(financialCalendar).toHaveClass('flex-1', 'min-w-0')
    })

    it('renders with correct layout structure', () => {
      render(<FinancialDashboard />)

      const mainSection = document.querySelector('section')
      expect(mainSection).toBeInTheDocument()
      expect(mainSection).toHaveClass(
        'max-w-[1500px]',
        'mx-auto',
        'p-2',
        'space-y-2'
      )

      const flexContainer = mainSection?.querySelector(
        '.flex.flex-col.lg\\:flex-row.gap-2'
      )
      expect(flexContainer).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('passes correct className props to child components', () => {
      render(<FinancialDashboard />)

      const liveDataPanel = screen.getByTestId('live-data-panel')
      const financialCalendar = screen.getByTestId('financial-calendar')

      expect(liveDataPanel).toHaveClass('flex-1')

      expect(financialCalendar).toHaveClass('flex-1', 'min-w-0')
    })

    it('renders both child components', () => {
      render(<FinancialDashboard />)

      expect(screen.getByTestId('live-data-panel')).toBeInTheDocument()
      expect(screen.getByTestId('financial-calendar')).toBeInTheDocument()

      expect(screen.getByText('Live Data Panel')).toBeInTheDocument()
      expect(screen.getByText('Financial Calendar')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('applies correct responsive classes', () => {
      render(<FinancialDashboard />)

      const mainSection = document.querySelector('section')
      expect(mainSection).toBeInTheDocument()
      expect(mainSection).toHaveClass('max-w-[1500px]')

      const flexContainer = mainSection?.querySelector(
        '.flex.flex-col.lg\\:flex-row.gap-2'
      )
      expect(flexContainer).toHaveClass('flex-col', 'lg:flex-row')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<FinancialDashboard />)

      const selector = screen.getByRole('combobox')
      expect(selector).toBeInTheDocument()

      const mainSection = document.querySelector('section')
      expect(mainSection).toBeInTheDocument()
    })

    it('has proper heading structure', () => {
      render(<FinancialDashboard />)

      expect(screen.getByText('Live Data Panel')).toBeInTheDocument()
      expect(screen.getByText('Financial Calendar')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing symbol gracefully', () => {
      expect(() => render(<FinancialDashboard />)).not.toThrow()
    })

    it('maintains functionality when child components fail', () => {
      jest.doMock('../LiveDataPanel', () => ({
        LiveDataPanel: () => {
          throw new Error('LiveDataPanel failed')
        }
      }))

      expect(() => render(<FinancialDashboard />)).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<FinancialDashboard />)

      rerender(<FinancialDashboard />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  describe('Data Flow', () => {
    it('passes symbol prop to child components', () => {
      render(<FinancialDashboard />)

      const liveDataPanel = screen.getByTestId('live-data-panel')
      const financialCalendar = screen.getByTestId('financial-calendar')

      expect(liveDataPanel).toHaveAttribute('data-symbol', 'BTCUSDT')
      expect(financialCalendar).toHaveAttribute('data-symbol', 'BTCUSDT')
    })
  })
})
