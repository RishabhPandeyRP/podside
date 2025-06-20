import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generic request function
export async function apiRequest<T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<T> {
  try {
    const response = await api({ url, method, data });
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error?.response || error);
    throw error?.response?.data || new Error('API request failed');
  }
}

export default api;
