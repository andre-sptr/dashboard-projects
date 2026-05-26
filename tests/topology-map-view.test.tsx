import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import TopologyMapView from '../src/components/features/topology/TopologyMapView';
import type { TopologyHierarchy } from '../src/lib/topology';
import type { TopologyMapContext } from '../src/lib/topology-map';

vi.mock('react-leaflet', () => ({
  CircleMarker: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  MapContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Polyline: () => <div />,
  Popup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TileLayer: () => <div />,
  useMap: () => ({
    fitBounds: vi.fn(),
    setView: vi.fn(),
  }),
}));

const topology: TopologyHierarchy = {
  AMK: {},
};

const mapContext: TopologyMapContext = {
  nodes: [],
  traces: [],
  missingLocations: [],
};

describe('TopologyMapView search status', () => {
  it('shows search as toolbar filter state instead of a map input placeholder', () => {
    render(
      <TopologyMapView
        topology={topology}
        mapContext={mapContext}
        searchQuery=""
        selectedArea=""
        selectedSto=""
      />
    );

    expect(screen.getByText('Filter dari Search Utama')).toBeInTheDocument();
    expect(screen.getByText('Belum ada filter pencarian')).toBeInTheDocument();
    expect(screen.queryByText('Cari ODC, OLT, STO, Port...')).not.toBeInTheDocument();
  });
});
