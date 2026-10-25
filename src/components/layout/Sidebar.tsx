import { useRef, type KeyboardEvent } from 'react'
import { TABS, panelElementId, tabElementId, type TabId } from './tabs'

const STEP: Partial<Record<string, number>> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }

interface SidebarProps {
  active: TabId
  onSelect: (tab: TabId) => void
}

// arrow keys work both ways - sidebar is vertical on desktop, a row on phones
export function Sidebar({ active, onSelect }: SidebarProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(event: KeyboardEvent, index: number) {
    const step = STEP[event.key]
    let next: number | null = null
    if (step !== undefined) next = (index + step + TABS.length) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1

    const tab = next === null ? undefined : TABS[next]
    if (next === null || !tab) return
    event.preventDefault()
    onSelect(tab.id)
    buttons.current[next]?.focus()
  }

  return (
    <aside className="sidebar" aria-label="EFB navigation">
      <div className="side-label">FLIGHT PLAN</div>
      <div className="nav" role="tablist" aria-label="Flight plan sections">
        {TABS.map((tab, index) => {
          const selected = tab.id === active
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[index] = el
              }}
              type="button"
              role="tab"
              id={tabElementId(tab.id)}
              aria-selected={selected}
              aria-controls={panelElementId(tab.id)}
              tabIndex={selected ? 0 : -1}
              className={selected ? 'active' : undefined}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span className="nav-icon">
                <TabIcon />
              </span>
              {tab.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
