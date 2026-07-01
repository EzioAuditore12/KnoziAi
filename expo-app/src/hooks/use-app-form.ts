import { createFormHook } from '@tanstack/react-form';

import { InputField } from '@/components/form/input-field';
import { SubmitButton } from '@/components/form/submit-button';
import { fieldContext, formContext } from '@/lib/tanstack/form';

/**
 * App-wide form hook factory using TanStack Form.
 * Pre-registers shared field components (Input, Select, DatePicker) and
 * form-level components (SubmitButton) so every form gets a consistent
 * look and behavior without re-importing individual field components.
 */
export const { useAppForm } = createFormHook({
  fieldComponents: {
    InputField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
