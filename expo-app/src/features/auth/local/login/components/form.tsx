import { cn } from 'cnfast';
import { View, type ViewProps } from 'react-native';

import { useAppForm } from '@/hooks/use-app-form';
import { loginParamSchema, type LoginParam } from '../schemas/param.schema';

interface LoginFormProps extends ViewProps {
  isSubmitting: boolean;
  handleSubmit: (data: LoginParam) => Promise<any> | void;
}

export function LoginForm({ className, handleSubmit, isSubmitting, ...props }: LoginFormProps) {
  const Form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    } satisfies Omit<LoginParam, 'expoPushToken'>,
    validators: {
      onChange: loginParamSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmit(value);
    },
  });

  return (
    <Form.AppForm>
      <View className={cn('flex-col gap-y-4', className)} {...props}>
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

        <Form.SubmitButton title="Login" />
      </View>
    </Form.AppForm>
  );
}
