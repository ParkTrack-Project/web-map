import type { MapPoint, MapPointsResponse, MapError } from "../types"

// Mock data for parking lots in Saint Petersburg
const MOCK_POINTS: MapPoint[] = [
  {
    id: "1",
    name: "Парковка у Эрмитажа",
    coordinates: { lat: 59.9398, lng: 30.3146 },
    description: "Подземная парковка Государственного Эрмитажа",
    category: "underground",
    metadata: {
      вместимость: "150 мест",
      свободно: "23 места",
      тариф: "200 руб/час",
      охрана: "да",
    },
  },
  {
    id: "2",
    name: "Стоянка Невский проспект",
    coordinates: { lat: 59.935, lng: 30.325 },
    description: "Уличная парковка на главной улице города",
    category: "street",
    metadata: {
      вместимость: "50 мест",
      свободно: "7 мест",
      тариф: "100 руб/час",
      зона: "платная",
    },
  },
  {
    id: "3",
    name: "ТРЦ Галерея - Паркинг",
    coordinates: { lat: 59.9325, lng: 30.3605 },
    description: "Многоуровневая парковка торгового центра",
    category: "mall",
    metadata: {
      вместимость: "500 мест",
      свободно: "156 мест",
      тариф: "бесплатно 2 часа",
      этажей: "3",
    },
  },
  {
    id: "4",
    name: "Аэропорт Пулково",
    coordinates: { lat: 59.8, lng: 30.2625 },
    description: "Крытая парковка международного аэропорта",
    category: "airport",
    metadata: {
      вместимость: "2000 мест",
      свободно: "847 мест",
      тариф: "от 150 руб/час",
      долгосрочная: "да",
    },
  },
  {
    id: "5",
    name: "Парковка Летний сад",
    coordinates: { lat: 59.945, lng: 30.335 },
    description: "Открытая парковка рядом с Летним садом",
    category: "park",
    metadata: {
      вместимость: "80 мест",
      свободно: "45 мест",
      тариф: "бесплатно",
      время: "круглосуточно",
    },
  },
  {
    id: "6",
    name: "Московский вокзал",
    coordinates: { lat: 59.9297, lng: 30.3628 },
    description: "Привокзальная парковка у главного вокзала",
    category: "station",
    metadata: {
      вместимость: "200 мест",
      свободно: "89 мест",
      тариф: "150 руб/час",
      камеры: "да",
    },
  },
  {
    id: "7",
    name: "Парковка Петропавловская крепость",
    coordinates: { lat: 59.95, lng: 30.3167 },
    description: "Туристическая парковка у исторической крепости",
    category: "tourist",
    metadata: {
      вместимость: "120 мест",
      свободно: "34 места",
      тариф: "100 руб/час",
      сезон: "апрель-октябрь",
    },
  },
  {
    id: "8",
    name: "БЦ Сенатор - Паркинг",
    coordinates: { lat: 59.925, lng: 30.315 },
    description: "Подземная парковка бизнес-центра",
    category: "office",
    metadata: {
      вместимость: "300 мест",
      свободно: "67 мест",
      тариф: "250 руб/час",
      пропуск: "требуется",
    },
  },
  {
    id: "9",
    name: "Парковка Васильевский остров",
    coordinates: { lat: 59.94, lng: 30.28 },
    description: "Уличная парковка на Васильевском острове",
    category: "street",
    metadata: {
      вместимость: "75 мест",
      свободно: "12 мест",
      тариф: "80 руб/час",
      зона: "платная",
    },
  },
  {
    id: "10",
    name: "Сенная площадь - Стоянка",
    coordinates: { lat: 59.9275, lng: 30.32 },
    description: "Муниципальная парковка на центральной площади",
    category: "municipal",
    metadata: {
      вместимость: "100 мест",
      свободно: "28 мест",
      тариф: "120 руб/час",
      оплата: "картой/наличными",
    },
  },
]

/**
 * Simulated API delay for realistic behavior
 */
const simulateApiDelay = (ms: number = 1000): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock API function to fetch map points
 * In a real application, this would make an HTTP request to your backend
 */
export const fetchMapPoints = async (
  page: number = 1,
  limit: number = 50
): Promise<MapPointsResponse> => {
  try {
    // Simulate network delay
    await simulateApiDelay()

    // Simulate potential network errors (5% chance)
    if (Math.random() < 0.05) {
      throw new Error("Network error: Failed to fetch map points")
    }

    // Paginate the results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPoints = MOCK_POINTS.slice(startIndex, endIndex)

    return {
      points: paginatedPoints,
      total: MOCK_POINTS.length,
      page,
      limit,
    }
  } catch (error) {
    const mapError: MapError = {
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      code: "API_ERROR",
    }
    throw mapError
  }
}

/**
 * Mock API function to fetch a single map point by ID
 */
export const fetchMapPointById = async (
  id: string
): Promise<MapPoint | null> => {
  try {
    await simulateApiDelay(500)

    const point = MOCK_POINTS.find((p) => p.id === id)
    return point || null
  } catch (error) {
    const mapError: MapError = {
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      code: "API_ERROR",
    }
    throw mapError
  }
}

/**
 * Mock API function to search map points by query
 */
export const searchMapPoints = async (
  query: string,
  limit: number = 20
): Promise<MapPoint[]> => {
  try {
    await simulateApiDelay(800)

    const filteredPoints = MOCK_POINTS.filter(
      (point) =>
        point.name.toLowerCase().includes(query.toLowerCase()) ||
        point.description?.toLowerCase().includes(query.toLowerCase()) ||
        point.category?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit)

    return filteredPoints
  } catch (error) {
    const mapError: MapError = {
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      code: "API_ERROR",
    }
    throw mapError
  }
}
