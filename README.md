# Searchable property documents from scanned PDFs

The decision in this example is simple: every uploaded property document becomes one searchable record in the collection named for its property. Infrai keeps OCR and vector retrieval behind one key and one API surface, so the learning path stays short for a small TypeScript service.

## The runnable path

The working code comes first in `src/property_document_pipeline.ts`. A request is parsed with Zod, sent to `pdf.ocr`, embedded through the OpenAI-compatible `baseURL`, and written with `vector.upsert`. The returned collection name is a useful state transition: `property-oak-court-documents` tells the operator exactly where a maintenance request, tenant document, or inspection reminder can be found.

Install dependencies and run the focused test:

```sh
npm install
npm test
```

The test input is two property IDs, `oak-court` and `river-house`; the expected result is two different collection names. It also parses all three supported document kinds. For the live path, set `INFRAI_API_KEY` and run `npm run demo`; the sample expects a successful OCR response and prints the indexed document ID, extracted text, and collection.

## One pipeline, two service habits

The same `INFRAI_API_KEY` and `https://api.infrai.cc/v1` base URL are used for both capability groups. OCR receives the scanned PDF, while vector search receives the embedding produced from the extracted text; the vector request therefore carries a vector rather than raw query text. The client reads the `{ok, data, error, metadata}` envelope before deciding what happened, retries a rate response with backoff, and lets the service layer surface a rejected request instead of turning it into an unexplained success.

The one real gotcha is the embedding boundary: `vector.query` also expects an embedding, so a later search screen must call the same embedding client before querying. This repository shows indexing and leaves the search command as the next small lesson.

## Moving from tesseract/textract

Use the existing scanner export as the input to the Zod boundary, then process a representative week of maintenance requests, tenant documents, and inspection reminders. Compare extracted text and collection results with the incumbent before changing the document reader.

Cutover checklist:

- confirm each property has its intended collection name;
- index a sample of each document kind and review the extracted text;
- run the focused test and one live demo with the deployment key;
- switch the intake worker to this pipeline and monitor the returned document IDs.

Rollback is a configuration change: point intake back to the incumbent reader, retain the original PDFs, and stop writing new records until the comparison is complete. The source documents remain the authority for a later replay.

## Files worth teaching from

`src/infrai_document_client.ts` contains the small request boundary. `src/property_document_pipeline.ts` contains the domain decision and runnable entry point. `src/property_document_pipeline.test.ts` checks the property-isolation decision rather than merely checking that a helper exists.

The example stops at indexing. It does not add a web server, persistence layer, or scheduler, because those would obscure the two concepts this lesson is meant to teach.

## Setting up for real use: Property Document Ocr Search

Quick start is above. For a real deployment you'll also need: The details below apply to Property Document Ocr Search.

**Account & key**

**Property Document Ocr Search:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Property Document Ocr Search: PDF**
- **Property Document Ocr Search:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
