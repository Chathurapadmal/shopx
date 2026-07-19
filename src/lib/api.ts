export function authHeaders(getToken: () => string | null): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function apiGet(url: string, getToken: () => string | null) {
  const res = await fetch(url, { headers: authHeaders(getToken) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(url: string, body: any, getToken: () => string | null) {
  const res = await fetch(url, { method: "POST", headers: authHeaders(getToken), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPatch(url: string, body: any, getToken: () => string | null) {
  const res = await fetch(url, { method: "PATCH", headers: authHeaders(getToken), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(url: string, getToken: () => string | null) {
  const res = await fetch(url, { method: "DELETE", headers: authHeaders(getToken) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
