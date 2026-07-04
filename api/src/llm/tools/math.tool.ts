import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';

@Injectable()
export class MathTool {
  @Tool({
    name: 'add',
    description: 'Add two numbers',
    parameters: z.object({
      a: z.number().describe('The first number'),
      b: z.number().describe('The second number'),
    }),
  })
  async add({ a, b }: { a: number; b: number }) {
    return {
      content: [{ type: 'text', text: String(a + b) }],
    };
  }

  @Tool({
    name: 'multiple',
    description: 'Multiply two numbers',
    parameters: z.object({
      a: z.number().describe('The first number'),
      b: z.number().describe('The second number'),
    }),
  })
  async multiple({ a, b }: { a: number; b: number }) {
    return {
      content: [{ type: 'text', text: String(a * b) }],
    };
  }
}
