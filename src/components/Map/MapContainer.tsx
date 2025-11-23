import React, { useEffect } from "react"
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  useMap,
} from "react-leaflet"
import type { MapState } from "../../types"
import type { Zone } from "../../types/api"
import { MapPoints } from "./MapPoints"
import "leaflet/dist/leaflet.css"

interface MapContainerProps {
  zones: Zone[]
  mapState: MapState
  onMapStateChange?: (newState: MapState) => void
  onZoneClick?: (zone: Zone) => void
  className?: string
}

const MapEventHandler: React.FC<{
  onMapStateChange?: (newState: MapState) => void
}> = ({ onMapStateChange }) => {
  const map = useMap()

  useEffect(() => {
    if (!onMapStateChange) return

    const handleMoveEnd = () => {
      const center = map.getCenter()
      const zoom = map.getZoom()

      onMapStateChange({
        center: [center.lat, center.lng],
        zoom,
      })
    }

    map.on("moveend", handleMoveEnd)
    map.on("zoomend", handleMoveEnd)

    return () => {
      map.off("moveend", handleMoveEnd)
      map.off("zoomend", handleMoveEnd)
    }
  }, [map, onMapStateChange])

  return null
}

export const MapContainer: React.FC<MapContainerProps> = ({
  zones,
  mapState,
  onMapStateChange,
  onZoneClick,
  className = "",
}) => {
  const { center, zoom } = mapState

  return (
    <div className={`map-container ${className}`}>
      <LeafletMapContainer
        center={center}
        zoom={zoom}
        maxZoom={18}
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler onMapStateChange={onMapStateChange} />

        <MapPoints zones={zones} onZoneClick={onZoneClick} />
      </LeafletMapContainer>
    </div>
  )
}
