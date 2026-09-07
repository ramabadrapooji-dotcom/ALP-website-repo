// Simple API client using fetch
const API_BASE = '/api';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Remove Content-Type if sending FormData
  if (options.body instanceof FormData) {
    delete (headers as Record<string, string>)['Content-Type'];
  }

  const response = await fetch(url, { ...options, headers });
  
  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Failed to parse API response');
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return data.data;
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) => fetchApi<T>(endpoint, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: any) => fetchApi<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' }),
};
