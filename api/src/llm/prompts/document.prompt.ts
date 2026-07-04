import { Injectable } from '@nestjs/common';
import { Prompt } from '@rekog/mcp-nest';
import { z } from 'zod';

@Injectable()
export class DocumentPromptProvider {
  @Prompt({
    name: 'format',
    description: 'Rewrites the contents of the document in Markdown format.',
    parameters: z.object({
      doc_id: z.string().describe('Id of the document to format'),
    }),
  })
  async formatDocument({ doc_id }: { doc_id: string }) {
    const promptText = `Your goal is to reformat a document to be written with markdown syntax.

The id of the document you need to reformat is:

@${doc_id}

Add in headers, bullet points, tables, etc as necessary. Feel free to add in extra formatting.
Please provide the complete reformatted document in your response.`;

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: promptText,
          },
        },
      ],
    };
  }
}
