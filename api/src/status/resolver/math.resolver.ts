import type { CallToolResult } from '@modelcontextprotocol/sdk/types';
import { Resolver, Tool } from '@nestjs-mcp/server';
import { z } from 'zod';

@Resolver('math')
export class MathResolver {
  @Tool({
    name: 'add',
    description: 'Add two numbers',
    paramsSchema: {
      a: z.number().describe('The first number'),
      b: z.number().describe('The second number'),
    },
  })
  add(args: { a: number; b: number }): CallToolResult {
    const result = args.a + args.b;
    return {
      content: [{ type: 'text', text: String(result) }],
    };
  }

  @Tool({
    name: 'multiple',
    description: 'Multiply two numbers',
    paramsSchema: {
      a: z.number().describe('The first number'),
      b: z.number().describe('The second number'),
    },
  })
  multiple(args: { a: number; b: number }): CallToolResult {
    const result = args.a * args.b;
    return {
      content: [{ type: 'text', text: String(result) }],
    };
  }
}
