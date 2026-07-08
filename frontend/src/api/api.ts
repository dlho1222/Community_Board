import axios from 'axios';

// 쿠키를 읽기 위한 헬퍼 함수
const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
};

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://192.168.111.130:8080',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Send cookies with requests
});

// 요청 인터셉터: 포트가 다른 환경(5173 -> 8080)에서는 Axios 자동 기능이 작동하지 않으므로 수동으로 헤더 주입
api.interceptors.request.use((config) => {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
