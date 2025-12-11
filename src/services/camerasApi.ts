import { apiClient } from "../config/api"
import type { Camera, GetCamerasParams } from "../types/api"

export const camerasApi = {
  getAll: async (params?: GetCamerasParams): Promise<Camera[]> => {
    const response = await apiClient.get<Camera[]>("/cameras", { params })
    return response.data
  },

  getById: async (cameraId: number): Promise<Camera> => {
    const response = await apiClient.get<Camera>(`/cameras/${cameraId}`)
    return response.data
  },
}
