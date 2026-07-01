import { Activity, type ComponentProps } from 'react';
import { View } from 'react-native';

import { useFieldContext } from '@/lib/tanstack/form';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { FieldError } from './field-error';

export type InputFieldProps = ComponentProps<typeof Input> & {
  label?: string;
  isRequired?: boolean;
};

export const InputField = ({ className, label, isRequired, ...inputProps }: InputFieldProps) => {
  const field = useFieldContext<string>();
  const hasError = field.state.meta.errors.length > 0;

  return (
    <View className="w-full gap-1.5">
      <Activity mode={label ? 'visible' : 'hidden'}>
        <Label nativeID={field.name}>
          {label}
          {isRequired && <Label className="text-destructive"> *</Label>}
        </Label>
      </Activity>

      <Input
        className={cn(hasError && 'border-destructive focus-visible:border-destructive', className)}
        aria-labelledby={field.name}
        value={field.state.value}
        onChangeText={field.handleChange}
        onBlur={field.handleBlur}
        {...inputProps}
      />
      <View className="min-h-5 justify-center">
        <Activity mode={hasError ? 'visible' : 'hidden'}>
          <FieldError meta={field.state.meta} />
        </Activity>
      </View>
    </View>
  );
};
