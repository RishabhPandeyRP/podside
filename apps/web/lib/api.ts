import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true, // send cookies automatically
});


// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post("/user/refresh", {} , {withCredentials:true}); // attempt token refresh
        return api(originalRequest); // retry original request
      } catch (err) {
        // Refresh failed → logout user
        console.error("Refresh token invalid, logging out...");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

      }
    }
    return Promise.reject(error);
  }
);


// Generic request function
export async function apiRequest<T = any>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await api.request<T>({
      url,
      method,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{message?: string}>;
    const message = axiosError.response?.data?.message || axiosError.message || "An unexpected error occurred";
    throw new Error(message);
  }
}

export default api;
