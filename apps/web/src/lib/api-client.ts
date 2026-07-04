const _API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
export const API_BASE_URL = `${_API_URL.replace(/\/$/, '')}/api/v1`;

export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  let token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem("token", data.access_token);
          if (data.refresh_token) {
            localStorage.setItem("refresh_token", data.refresh_token);
          }
          // Retry original request
          headers["Authorization"] = `Bearer ${data.access_token}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          
          if (!retryResponse.ok) {
            const errorBody = await retryResponse.text();
            throw new Error(`API Error: ${retryResponse.status} ${errorBody}`);
          }
          return retryResponse.json();
        }
      } catch (err) {
        console.error("Token refresh failed", err);
      }
    }
    // If refresh fails or no refresh token, log out
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("orgId");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error: ${response.status} ${errorBody}`);
  }

  return response.json();
}
