import axios, { AxiosError } from "axios"
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.parktrack.live"
const API_TOKEN = import.meta.env.VITE_API_TOKEN || ""

const isDevelopment = import.meta.env.DEV
const baseURL = isDevelopment ? "/api" : API_BASE_URL

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (API_TOKEN && config.headers) {
      config.headers.Authorization = `Bearer ${API_TOKEN}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as { message?: string; detail?: string }

      switch (status) {
        case 401:
          return Promise.reject(
            new Error(data.message || data.detail || "Unauthorized. Please check your API token.")
          )
        case 403:
          return Promise.reject(new Error(data.message || data.detail || "Forbidden"))
        case 404:
          return Promise.reject(new Error(data.message || data.detail || "Resource not found"))
        case 422:
          return Promise.reject(
            new Error(data.message || data.detail || "Validation error")
          )
        case 500:
          return Promise.reject(
            new Error(data.message || data.detail || "Internal server error")
          )
        case 503:
          return Promise.reject(
            new Error(data.message || data.detail || "Service unavailable")
          )
        default:
          return Promise.reject(
            new Error(data.message || data.detail || `Request failed with status ${status}`)
          )
      }
    }

    if (error.request) {
      return Promise.reject(new Error("Network error. Please check your connection."))
    }

    return Promise.reject(error)
  }
)
