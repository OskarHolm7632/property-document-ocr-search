import { z } from "zod";
import { InfraiDocumentClient } from "./infrai_document_client.ts";

export const documentRequest = z.object({
  documentId: z.string().min(1),
  propertyId: z.string().min(1),
  kind: z.enum(["maintenance_request", "tenant_document", "inspection_reminder"]),
  pdf: z.string().min(1)
});

export type DocumentRequest = z.infer<typeof documentRequest>;

export function collectionFor(propertyId: string): string {
  return `property-${propertyId}-documents`;
}

export async function indexPropertyDocument(input: unknown, client: InfraiDocumentClient): Promise<{ documentId: string; text: string; collection: string }> {
  const request = documentRequest.parse(input);
  const { text } = await client.ocr(request.pdf);
  const collection = collectionFor(request.propertyId);
  const embedding = await client.embed(text);
  await client.upsert(collection, [{
    id: request.documentId,
    values: embedding,
    metadata: { propertyId: request.propertyId, kind: request.kind, text }
  }]);
  return { documentId: request.documentId, text, collection };
}

async function demo(): Promise<void> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the demo");
  const client = new InfraiDocumentClient(key);
  const result = await indexPropertyDocument({
    documentId: "maint-104",
    propertyId: "oak-court",
    kind: "maintenance_request",
    pdf: "base64-encoded-pdf"
  }, client);
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) void demo();
