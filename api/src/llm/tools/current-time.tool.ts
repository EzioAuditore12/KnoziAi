import { DynamicTool } from '@langchain/core/tools';
import { Injectable } from '@nestjs/common';
import { formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class CurrentTimeTool {
  private readonly timeZone = 'Asia/Kolkata';

  public readonly toolName = 'get_current_datetime';

  public getDateTimeTool(): DynamicTool {
    return new DynamicTool({
      name: this.toolName,
      description:
        'Use this tool to get the current date and time in India (Asia/Kolkata timezone). Input should be an empty string.',
      func: async () => {
        const dateTimeStr = this.getCurrentDateTime();
        return `The current date and time in India is: ${dateTimeStr}`;
      },
    });
  }

  private getCurrentDateTime(): string {
    const now = new Date();
    const pattern = 'yyyy-MM-dd HH:mm:ss';
    return formatInTimeZone(now, this.timeZone, pattern);
  }
}
