import { cn } from 'cnfast';
import { View, type ViewProps } from 'react-native';

import { useAppForm } from '@/hooks/use-app-form';
import { registerParamSchema, type RegisterParam } from '../schemas/param.schema';

interface RegisterFormProps extends ViewProps {
  isSubmitting: boolean;
  handleSubmit: (data: RegisterParam) => Promise<any> | void;
}

export function RegisterForm({
  className,
  handleSubmit,
  isSubmitting,
  ...props
}: RegisterFormProps) {
  const Form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    } satisfies RegisterParam,
    validators: {
      onChange: registerParamSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmit(value);
    },
  });

  return (
    <Form.AppForm>
      <View className={cn('flex-col gap-y-4', className)} {...props}>
        <Form.AppField name="name">
          {(field) => (
            <field.InputField label="Name" placeholder="Enter your name ..." isRequired />
          )}
        </Form.AppField>

        <Form.AppField name="email">
          {(field) => (
            <field.InputField label="Email" placeholder="Enter your email ..." isRequired />
          )}
        </Form.AppField>

        <Form.AppField name="password">
          {(field) => (
            <field.InputField
              label="Password"
              placeholder="Enter your password ..."
              secureTextEntry
              isRequired
            />
          )}
        </Form.AppField>

        <Form.SubmitButton title="Register" />
      </View>
    </Form.AppForm>
  );
}
