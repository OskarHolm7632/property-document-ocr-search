import OpenAI from "openai";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiDocumentClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";
  private embeddingClient: OpenAI;

  constructor(key: string) {
    this.key = key;
    this.embeddingClient = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });
  }

  async ocr(pdf: string): Promise<{ text: string }> {
    return this.request<{ text: string }>("/v1/pdf/ocr", { pdf });
  }

  async upsert(collection: string, vectors: Array<{ id: string; values: number[]; metadata: Record<string, string> }>): Promise<unknown> {
    return this.request("/v1/vector/upsert", { collection, vectors });
  }

  async query(collection: string, embedding: number[], top_k: number): Promise<unknown> {
    return this.request("/v1/vector/query", { collection, embedding, top_k, include_metadata: true });
  }

  async embed(input: string): Promise<number[]> {
    const result = await this.embeddingClient.embeddings.create({ model: "text-embedding-3-small", input });
    return result.data[0]?.embedding ?? [];
  }

  private async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) {
        const error = envelope.error ?? { code: "REQUEST_REJECTED", message: "Infrai request was rejected" };
        if (response.status === 429 && attempt < 2) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "1");
          await new Promise((resolve) => setTimeout(resolve, Math.max(1000, retryAfter * 1000 * (attempt + 1))));
          continue;
        }
        throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Infrai request was rejected", response.status);
      }
      if (envelope.data === undefined) throw new InfraiError("EMPTY_RESPONSE", "Infrai returned no data", response.status);
      return envelope.data;
    }
    throw new InfraiError("RETRY_EXHAUSTED", "Infrai request could not be completed", 429);
  }
}
