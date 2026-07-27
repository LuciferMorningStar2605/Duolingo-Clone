const rawUrl = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') 
  : 'http://localhost:8000';

// Bulletproof check: If the user provided URL already ends with '/api', use it directly;
// otherwise, append '/api' to form the correct base endpoint.
export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
