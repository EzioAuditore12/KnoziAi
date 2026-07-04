import { Injectable } from '@nestjs/common';
import { Resource, ResourceTemplate } from '@rekog/mcp-nest';

// Dummy data map
const docs: Record<string, string> = {
  doc1: 'This is the first document content.',
  doc2: 'This is the second document content.',
};

@Injectable()
export class DocumentsResourceProvider {
  // 1. Direct Resource (List Documents)
  @Resource({
    uri: 'docs://documents',
    name: 'documents-list',
    mimeType: 'application/json',
  })
  async listDocs() {
    return {
      contents: [
        {
          uri: 'docs://documents',
          mimeType: 'application/json',
          text: JSON.stringify(Object.keys(docs)),
        },
      ],
    };
  }

  // 2. Templated Resource (Fetch Document)
  @ResourceTemplate({
    uriTemplate: 'docs://documents/{doc_id}',
    name: 'document-fetcher',
    mimeType: 'text/plain',
  })
  async fetchDoc({ doc_id }: { doc_id: string }) {
    const docContent = docs[doc_id];

    if (!docContent) {
      throw new Error(`Doc with id ${doc_id} not found`);
    }

    return {
      contents: [
        {
          uri: `docs://documents/${doc_id}`,
          mimeType: 'text/plain',
          text: docContent,
        },
      ],
    };
  }
}
