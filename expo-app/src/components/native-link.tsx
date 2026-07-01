import { cn } from 'cnfast';
import { Link as ExpoLink, type LinkProps } from 'expo-router';

export function Link({ className, href, ...props }: LinkProps) {
  return <ExpoLink href={href} className={cn('text-blue-500', className)} {...props} />;
}
