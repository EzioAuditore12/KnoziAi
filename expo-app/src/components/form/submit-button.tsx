import { Activity, type ComponentProps } from 'react';
import { ActivityIndicator } from 'react-native';

import { useFormContext } from '@/lib/tanstack/form';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Text } from '../ui/text';

export const SubmitButton = ({
  className,
  title,
  ...props
}: Omit<ComponentProps<typeof Button>, 'children'> & { title: string }) => {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          className={cn('flex-row items-center justify-center gap-x-2', className)}

          disabled={isSubmitting}
          onPress={form.handleSubmit}
          {...props}
        >
          <Activity mode={isSubmitting ? 'visible' : 'hidden'}>
            <ActivityIndicator />
          </Activity>
          <Text>{title}</Text>
        </Button>
      )}
    </form.Subscribe>
  );
};
