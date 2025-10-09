import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true, // send cookies automatically
});

const refreshApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const unAuthorizedStatusCodes = [401, 403];
const networkErrorCodes = ["ECONNABORTED", "ENETDOWN", "ENETRESET", "ENETUNREACH", "EAI_AGAIN"];
const serverErrorStatusCodes = [0, 500, 501, 502, 503, 504];
const series4xxStatusCodes = Array.from({ length: 100 }, (_, i) => 400 + i);
const wrongStatusCodes = [...serverErrorStatusCodes, ...series4xxStatusCodes, ...networkErrorCodes];
// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error:AxiosError) => {
    // debugger;
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    // Prevent infinite loop
    if (unAuthorizedStatusCodes.includes(error?.response?.status as number) && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshApi.post("/user/refresh"); // attempt token refresh
        await new Promise((res) => setTimeout(res, 50)); // allow browser to update cookie
        return api(originalRequest); // retry original request
      } catch (refreshError) {
        // Refresh failed → logout user
        console.log("Refresh token invalid, logging out...");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/signup" && window.location.pathname !== "/") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    const shouldRetry = !error.response || wrongStatusCodes.includes(error?.response?.status as number); // server or network error

    if (shouldRetry) {
      originalRequest._retryCount = originalRequest._retryCount || 0;

      if (originalRequest._retryCount < 2) { // retry up to 2 times
        originalRequest._retryCount += 1;
        console.warn(`Retrying request (${originalRequest._retryCount}) due to network/server error...`);
        await sleep(300 * originalRequest._retryCount); // exponential backoff (300ms, 600ms)
        return api(originalRequest);
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
