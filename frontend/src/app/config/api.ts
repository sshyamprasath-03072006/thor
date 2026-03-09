// Central API configuration
// In development: defaults to localhost:8000
// In production: set VITE_API_URL env var on Vercel to point to your Railway backend
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
