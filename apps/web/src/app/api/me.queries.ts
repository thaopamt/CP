import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangePasswordRequest, UpdateMePayload } from '@cp/shared';

import { meApi } from './me.api';

export const meQueryKeys = {
  current: () => ['me', 'current'] as const,
};

export function useMe() {
  return useQuery({
    queryKey: meQueryKeys.current(),
    queryFn: () => meApi.get(),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMePayload) => meApi.update(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: meQueryKeys.current() });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => meApi.uploadAvatar(file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: meQueryKeys.current() });
    },
  });
}

export function useDeleteAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => meApi.deleteAvatar(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: meQueryKeys.current() });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => meApi.changePassword(payload),
  });
}
