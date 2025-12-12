import React from "react"
import type { Camera } from "../../types/api"

interface CameraSelectorProps {
  cameras: Camera[]
  selectedCameraId: number | null
  onCameraSelect: (camera: Camera | null) => void
}

export const CameraSelector: React.FC<CameraSelectorProps> = ({
  cameras,
  selectedCameraId,
  onCameraSelect,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === "") {
      onCameraSelect(null)
    } else {
      const camera = cameras.find((c) => c.camera_id === Number(value))
      if (camera) {
        onCameraSelect(camera)
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="camera-selector"
        className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap"
      >
        Перейти к камере:
      </label>
      <select
        id="camera-selector"
        value={selectedCameraId ?? ""}
        onChange={handleChange}
        className="px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1"
      >
        <option value="">Выберите камеру</option>
        {cameras.map((camera) => (
          <option key={camera.camera_id} value={camera.camera_id}>
            {camera.title}
          </option>
        ))}
      </select>
    </div>
  )
}

