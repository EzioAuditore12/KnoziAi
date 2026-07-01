import type { AnyFieldMeta } from '@tanstack/react-form';
import { Activity, type ComponentProps } from 'react';

import { Text } from '../ui/text';

type FieldErrorProps = {
  meta: AnyFieldMeta;
} & Omit<ComponentProps<typeof Text>, 'children'>;

export const FieldError = ({ meta, ...props }: FieldErrorProps) => {
  return meta.errors.map(({ message }: { message: string }, index) => (
    <Activity key={index} mode={meta.isTouched ? 'visible' : 'hidden'}>
      <Text className="text-destructive text-sm" {...props}>
        {message}
      </Text>
    </Activity>
  ));
};
