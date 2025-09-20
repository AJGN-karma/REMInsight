// web/src/api.ts
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE as string) || "";

type PredictResponse = {
  risk: number;
  probs?: number[];
  explain?: any;
};

export async function predict(
  features: Record<string, any>,
  explain = true,
  token?: string
): Promise<PredictResponse> {
  if (!API_BASE) throw new Error("API base not configured");

  const res = await fetch(`${API_BASE}/predict?explain=${String(explain)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(features),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}
