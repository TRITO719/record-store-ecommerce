import axios, { AxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { store } from '../store';
import { logout } from '../store/userSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // Hỗ trợ Docker API Gateway hoặc Local
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- RETRY CONFIG ---
// Các HTTP status code được coi là lỗi tạm thời — có thể retry an toàn
const RETRYABLE_STATUS_CODES = [500, 502, 503, 504];
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 500;

// Đính kèm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý response: retry tự động + hiển thị lỗi thân thiện
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };

    // Token hết hạn hoặc không hợp lệ (HTTP 401) — tự động đăng xuất
    if (error.response?.status === 401) {
      const isLoggedIn = store.getState().user.isLoggedIn;
      if (isLoggedIn) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        store.dispatch(logout());
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', {
          id: 'session-expired-toast',
          duration: 4000,
        });
      }
      return Promise.reject(error);
    }

    // Xử lý Rate Limiting từ Server (HTTP 429) — không retry, chỉ báo người dùng chờ
    if (error.response?.status === 429) {
      toast.error(error.response.data.message || 'Bạn đang thao tác quá nhanh. Vui lòng đợi một lát!', {
        id: 'rate-limit-toast',
        duration: 4000,
      });
      return Promise.reject(error);
    }

    // Retry khi gặp lỗi server tạm thời (5xx) hoặc mạng bị ngắt (network error)
    const isNetworkError = !error.response && error.code !== 'ECONNABORTED';
    const isRetryableStatus = error.response && RETRYABLE_STATUS_CODES.includes(error.response.status);

    if ((isNetworkError || isRetryableStatus) && config) {
      config._retryCount = config._retryCount ?? 0;

      if (config._retryCount < MAX_RETRY_ATTEMPTS) {
        config._retryCount += 1;
        const delayMs = Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, config._retryCount - 1), 8000);

        console.warn(
          `🔄 [Retry] Request thất bại (${error.response?.status ?? 'network error'}). ` +
          `Lần ${config._retryCount}/${MAX_RETRY_ATTEMPTS} — thử lại sau ${delayMs}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return api(config);
      }

      // Hết số lần retry → hiển thị thông báo lỗi
      toast.error('Kết nối tới server thất bại. Vui lòng kiểm tra mạng và thử lại.', {
        id: 'server-error-toast',
        duration: 5000,
      });
    }

    return Promise.reject(error);
  }
);

export default api;