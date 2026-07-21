import axios from 'axios';

interface ApiErrorBody {
  error_description?: string;
  detail?: string | Array<{ msg?: string }>;
  message?: string;
}

export function getApiErrorDescription(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return fallback;
  const body = error.response?.data;
  if (body?.error_description) return body.error_description;
  if (typeof body?.detail === 'string') return body.detail;
  if (Array.isArray(body?.detail)) {
    const message = body.detail.find((item) => item.msg)?.msg;
    if (message) return message;
  }
  return body?.message || fallback;
}
