import assert from "node:assert/strict";
import test from "node:test";
import { collectionFor, documentRequest } from "./property_document_pipeline.ts";

test("a property keeps its document index separate from another property", () => {
  assert.equal(collectionFor("oak-court"), "property-oak-court-documents");
  assert.notEqual(collectionFor("oak-court"), collectionFor("river-house"));
});

test("the request boundary accepts the three document kinds", () => {
  for (const kind of ["maintenance_request", "tenant_document", "inspection_reminder"] as const) {
    assert.equal(documentRequest.parse({ documentId: "d1", propertyId: "p1", kind, pdf: "pdf" }).kind, kind);
  }
});
