import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useAuthStore } from '@/store/auth';
import { registerFormApi } from '../api/register-form.api';

export const useRegisterForm = () => {
  const { setUserDetails, setUserTokens } = useAuthStore((state) => state);

  return useMutation({
    mutationFn: registerFormApi,
    onSuccess: (data) => {
      setUserTokens(data.tokens);

      setUserDetails(data.user);

      router.replace('/(main)');
    },
    onError: (data) => {
      alert(data.message);
    },
  });
};
