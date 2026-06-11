import {
  ChangePasswordRequest,
  CurrentUserResponse,
  UpdateMePayload,
} from '@cp/shared';

import { apiClient } from '../lib/api-client';

export const meApi = {
  async get(): Promise<CurrentUserResponse> {
    const { data } = await apiClient.get<CurrentUserResponse>('/auth/me');
    return data;
  },

  async update(payload: UpdateMePayload): Promise<CurrentUserResponse> {
    const { data } = await apiClient.patch<CurrentUserResponse>('/auth/me', payload);
    return data;
  },

  async uploadAvatar(file: File): Promise<CurrentUserResponse> {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.post<CurrentUserResponse>('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteAvatar(): Promise<CurrentUserResponse> {
    const { data } = await apiClient.delete<CurrentUserResponse>('/auth/me/avatar');
    return data;
  },

  async changePassword(payload: ChangePasswordRequest): Promise<{ success: boolean }> {
    const { data } = await apiClient.post<{ success: boolean }>(
      '/auth/change-password',
      payload,
    );
    return data;
  },
};
