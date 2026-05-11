import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { loginApi } from '../api/authApi';
import { tokenStore } from '@/shared/auth';

export function useLoginMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      tokenStore.set(data.access_token);
      navigate('/');
    },
  });
}
