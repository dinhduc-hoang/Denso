const baseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export const backendEnabled =
  import.meta.env.MODE !== "test" && import.meta.env.VITE_DEMO_MODE !== "true";
const tokenKey = "shopfloor-session";
export function getToken() {
  return sessionStorage.getItem(tokenKey);
}
export function setToken(token) {
  if (token) sessionStorage.setItem(tokenKey, token);
  else sessionStorage.removeItem(tokenKey);
}
export async function request(
  path,
  { method = "GET", body, raw = false } = {},
) {
  const token = getToken();
  const multipart = body instanceof FormData;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !multipart ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(
      data.error?.message || "Không thể kết nối backend.",
    );
    error.status = response.status;
    error.code = data.error?.code;
    throw error;
  }
  if (raw) return response;
  if (response.status === 204) return null;
  return (await response.json()).data;
}
export async function downloadKnowledge(id) {
  const response = await request(`/knowledge/${id}/export`, { raw: true });
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `knowledge-${id}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
