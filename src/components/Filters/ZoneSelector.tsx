import React from "react"
import type { Zone } from "../../types/api"

interface ZoneSelectorProps {
  zones: Zone[]
  selectedZoneId: number | null
  onZoneSelect: (zone: Zone | null) => void
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  zones,
  selectedZoneId,
  onZoneSelect,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === "") {
      onZoneSelect(null)
    } else {
      const zone = zones.find((z) => z.zone_id === Number(value))
      if (zone) {
        onZoneSelect(zone)
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="zone-selector"
        className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap"
      >
        Перейти к зоне:
      </label>
      <select
        id="zone-selector"
        value={selectedZoneId ?? ""}
        onChange={handleChange}
        className="px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Выберите зону</option>
        {zones.map((zone) => (
          <option key={zone.zone_id} value={zone.zone_id}>
            Зона {zone.zone_id}
          </option>
        ))}
      </select>
    </div>
  )
}

