import type { ComponentType } from 'react';
import {
  YMapFeature as YMapFeatureRaw,
  YMapFeatureDataSource as YMapFeatureDataSourceRaw,
  YMapLayer as YMapLayerRaw,
} from '@/shared/lib/ymaps';
import { MAP_Z } from '@/shared/config';

type FeatureProps = {
  id: string;
  source: string;
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  style: { fill: string; interactive: boolean };
  blockEvents: boolean;
  blockBehaviors: boolean;
};

const YMapFeature = YMapFeatureRaw as unknown as ComponentType<FeatureProps>;
const YMapFeatureDataSource = YMapFeatureDataSourceRaw as unknown as ComponentType<{ id: string }>;
const YMapLayer = YMapLayerRaw as unknown as ComponentType<{
  source: string;
  type: string;
  zIndex: number;
}>;

/** Ensures a drag can start on map background, not only on rendered parking features. */
export function MapGestureLayer() {
  return (
    <>
      <YMapFeatureDataSource id="ptk-map-gestures" />
      <YMapLayer source="ptk-map-gestures" type="features" zIndex={MAP_Z.mapGestures} />
      <YMapFeature
        id="ptk-map-gesture-surface"
        source="ptk-map-gestures"
        geometry={{
          type: 'Polygon',
          coordinates: [
            [
              [-179.9, -85],
              [179.9, -85],
              [179.9, 85],
              [-179.9, 85],
              [-179.9, -85],
            ],
          ],
        }}
        style={{ fill: 'rgba(0,0,0,0.001)', interactive: true }}
        blockEvents={false}
        blockBehaviors={false}
      />
    </>
  );
}
