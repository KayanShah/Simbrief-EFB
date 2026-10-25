import { useEffect, useState, type ReactNode } from 'react'
import { PilotIdForm } from './components/form/PilotIdForm'
import { AppHeader } from './components/layout/AppHeader'
import { PageHeading } from './components/layout/PageHeading'
import { PilotChip } from './components/layout/PilotChip'
import { Sidebar } from './components/layout/Sidebar'
import { TopLine } from './components/layout/TopLine'
import { TABS, panelElementId, tabElementId, type TabId } from './components/layout/tabs'
import { FuelPanel } from './components/panels/FuelPanel'
import { OverviewPanel } from './components/panels/OverviewPanel'
import { RoutePanel } from './components/panels/RoutePanel'
import { WeightsPanel } from './components/panels/WeightsPanel'
import { ErrorBanner } from './components/states/ErrorBanner'
import { FlightLoader } from './components/states/FlightLoader'
import { LoadingSkeletons } from './components/states/LoadingSkeletons'
import { useOfp, type OfpState } from './hooks/useOfp'
import { loadLastPilotId } from './lib/storage'
import type { Ofp } from './types/ofp'





const PANELS: Record<TabId, (props: { ofp: Ofp | null }) => ReactNode> = {
  overview: OverviewPanel,
  route: RoutePanel,
  fuel: FuelPanel,
  weights: WeightsPanel,
}




function ofpStatusText(state: OfpState): string {
  switch (state.status) {
    case 'idle':
      return 'NO OFP LOADED'
    case 'loading':
      return 'LOADING OFP…'
    case 'success':
      return `OFP LOADED · ${state.data.flight.callsign}`
    case 'error':
      return 'OFP NOT LOADED'
  }
}



export default function App() {
  const { state, load, reload, clear } = useOfp()
  const [lastPilotId] = useState(loadLastPilotId)
  const [tab, setTab] = useState<TabId>('overview')
  const [changingPilot, setChangingPilot] = useState(false)

  //   if they were here before just pull the last id
  useEffect(() => {
    if(lastPilotId) void load(lastPilotId)
  }, [lastPilotId, load])

  const ofp = state.status === 'success' ? state.data : null

  // form only stays up when we dont have a loaded id, or they hit Change
  const activePilotId = state.status === 'loading' || state.status === 'success' ? state.pilotId : null
  const showForm = activePilotId === null || changingPilot

  function submitPilotId(pilotId: string) {
    setChangingPilot(false)
    void load(pilotId)
  }

  function clearPlan() {
    setChangingPilot(false)
    clear()
  }
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0]!
  const Panel = PANELS[tab]




  return (
    <div className="shell">
      <TopLine ofpStatus={ofpStatusText(state)} />
      <AppHeader
        generatedAt={ofp?.meta.generatedAt ?? null}
        pilot={
          activePilotId !== null &&
          !changingPilot && (
            <PilotChip
              pilotId={activePilotId}
              isLoading={state.status === 'loading'}
              onRefresh={reload}
              onChange={() => setChangingPilot(true)}
            />
          )
        }
      />

      <div className="layout">
        <Sidebar active={tab} onSelect={setTab} />

        <main aria-busy={state.status === 'loading'}>
          <PageHeading title={activeTab.title} canClear={state.status !== 'idle'} onClear={clearPlan} />

          {showForm && (
            <PilotIdForm
              initialPilotId={state.status === 'idle' ? (lastPilotId ?? '') : state.pilotId}
              status={changingPilot ? 'idle' : state.status}
              onSubmit={submitPilotId}
              onCancel={changingPilot ? () => setChangingPilot(false) : undefined}
            />
          )}

          {state.status === 'error' && <ErrorBanner error={state.error} pilotId={state.pilotId} onRetry={reload} />}
          {state.status === 'loading' && <FlightLoader pilotId={state.pilotId} />}

          <section
            className="tab-panel active"
            id={panelElementId(tab)}
            role="tabpanel"
            aria-labelledby={tabElementId(tab)}
          >
            {state.status === 'loading' ? <LoadingSkeletons /> : <Panel ofp={ofp} />}
          </section>

        </main>
      </div>
    </div>
  )
}
