import { create } from 'zustand';

interface RouteGeometryState {
  routeId: number | null;
  coordinates: [number, number][];
  setRouteGeometry: (routeId: number, coordinates: [number, number][]) => void;
  clearRouteGeometry: (routeId?: number) => void;
}

export const useRouteGeometry = create<RouteGeometryState>((set) => ({
  routeId: null,
  coordinates: [],
  setRouteGeometry: (routeId, coordinates) => set({ routeId, coordinates }),
  clearRouteGeometry: (routeId) =>
    set((state) =>
      routeId !== undefined && state.routeId !== routeId
        ? state
        : { routeId: null, coordinates: [] },
    ),
}));
