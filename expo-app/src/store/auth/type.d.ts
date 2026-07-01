import { Tokens } from '@/features/common/schemas/tokens.schema';
import { User } from '@/features/common/schemas/user.schema';

export interface AuthStore {
  user: User | null;
  tokens: Tokens | null;
  setUserDetails(data: User): void;
  setUserTokens(data: Tokens): void;
  logout: () => void;
}
