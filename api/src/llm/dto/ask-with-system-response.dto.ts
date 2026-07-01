import { IsNotEmpty, IsString } from 'class-validator';
import { z } from 'zod';

export const askWithSystemResponseSchema = z.object({
  topic: z.string().describe('The main topic of the conversation'),
  context: z.string().describe('The extracted background context'),
  result: z.string().describe('The final answered result'),
});

export type AskWithSystemResponse = z.infer<typeof askWithSystemResponseSchema>;

export class AskWithSystemResponseDto implements AskWithSystemResponse {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsNotEmpty()
  context: string;

  @IsString()
  @IsNotEmpty()
  result: string;
}
