export const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

async function http(path, { method = 'GET', body } = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    throw new Error(`API ${method} ${path} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function apiHealth() {
  return http('/health');
}
export async function getFeatures() {
  return http('/features');
}
export async function predict(rows) {
  return http('/predict', { method: 'POST', body: { rows } });
}
export async function sampleRow() {
  return http('/sample_row');
}
