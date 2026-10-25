import type { ComponentType } from 'react'
import { FuelIcon, OverviewIcon, RouteIcon, WeightsIcon } from './TabIcons'

export type TabId = 'overview' | 'route' | 'fuel' | 'weights'

export interface TabConfig {
  id: TabId
  label: string
  icon: ComponentType
  title: string
}

export const TABS: readonly TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: OverviewIcon, title: 'Flight overview' },
  { id: 'route', label: 'Route', icon: RouteIcon, title: 'Route & navigation' },
  { id: 'fuel', label: 'Fuel', icon: FuelIcon, title: 'Fuel planning' },
  { id: 'weights', label: 'Weights', icon: WeightsIcon, title: 'Weights & loading' },
]



export const tabElementId = (id: TabId) => `tab-${id}`
export const panelElementId = (id: TabId) => `panel-${id}`
