import { useCallback, useRef, useState } from 'react';
import { Avatar, Icon, useToast } from '@cp/ui';

import { useUploadAvatar, useDeleteAvatar } from '../api/me.queries';
import { useAuthStore } from '../stores/auth.store';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface AvatarUploadProps {
  /** Currently saved avatar URL */
  currentAvatarUrl?: string | null;
  /** Display name or initial to show when no avatar */
  displayName: string;
  /** Visual variant for styling */
  variant?: 'student' | 'admin';
}

export function AvatarUpload({
  currentAvatarUrl,
  displayName,
  variant = 'student',
}: AvatarUploadProps) {
  const toast = useToast();
  const updateUser = useAuthStore((s) => s.updateUser);
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isUploading = uploadAvatar.isPending;
  const isDeleting = deleteAvatar.isPending;

  const isStudent = variant === 'student';

  const processFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Chỉ hỗ trợ định dạng: JPEG, PNG, GIF, WebP');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Dung lượng file tối đa 5MB');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      try {
        const updated = await uploadAvatar.mutateAsync(file);
        updateUser({ avatarUrl: updated.avatarUrl });
        toast.success('Đã cập nhật ảnh đại diện!');
      } catch (err) {
        setPreviewUrl(null);
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg || 'Không upload được ảnh. Vui lòng thử lại.');
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    },
    [uploadAvatar, updateUser, toast],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDelete = async () => {
    try {
      const updated = await deleteAvatar.mutateAsync();
      updateUser({ avatarUrl: updated.avatarUrl });
      setPreviewUrl(null);
      toast.success('Đã xóa ảnh đại diện.');
    } catch {
      toast.error('Không xóa được ảnh đại diện.');
    }
  };

  const avatarSrc = previewUrl || currentAvatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar with hover overlay */}
      <div
        className="relative group cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        {/* Glow ring */}
        <div
          className={`absolute -inset-1 rounded-full blur transition-opacity duration-300 ${
            isStudent
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              : 'bg-gradient-to-r from-primary to-secondary'
          } ${dragActive ? 'opacity-80' : 'opacity-30 group-hover:opacity-60'}`}
        />

        {/* Avatar image */}
        <div className="relative">
          <Avatar
            size="lg"
            src={avatarSrc}
            initials={initial}
            className={`w-28 h-28 shadow-2xl ${
              isStudent ? 'border-4 border-[#121218]' : 'border-4 border-surface-container-lowest'
            }`}
          />

          {/* Hover overlay */}
          <div
            className={`absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center gap-1 transition-opacity duration-200 ${
              dragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isUploading ? (
              <Icon name="progress_activity" size={28} className="animate-spin text-white" />
            ) : (
              <>
                <Icon name="photo_camera" size={28} className="text-white" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                  {dragActive ? 'Thả ảnh' : 'Đổi ảnh'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Camera badge */}
        <div
          className={`absolute bottom-1 right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md z-10 ${
            isStudent
              ? 'bg-emerald-500 border-4 border-[#0f0f13]'
              : 'bg-primary border-4 border-surface-container-lowest'
          }`}
        >
          <Icon name="photo_camera" size={14} className="text-white" />
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        id="avatar-upload-input"
      />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all
            hover:shadow-lg hover:-translate-y-0.5
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
            ${
              isStudent
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                : 'bg-primary text-on-primary'
            }`}
        >
          {isUploading ? (
            <>
              <Icon name="progress_activity" size={14} className="animate-spin" />
              Đang tải...
            </>
          ) : (
            <>
              <Icon name="upload" size={14} />
              Tải ảnh lên
            </>
          )}
        </button>

        {avatarSrc && !isUploading && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                isStudent
                  ? 'bg-white/5 border border-white/10 text-gray-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                  : 'bg-surface-container-low border border-outline-variant text-on-surface-variant hover:bg-error-container hover:border-error hover:text-error'
              }`}
          >
            {isDeleting ? (
              <>
                <Icon name="progress_activity" size={14} className="animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Icon name="delete" size={14} />
                Xóa ảnh
              </>
            )}
          </button>
        )}
      </div>

      {/* Hint text */}
      <p className={`text-[11px] text-center ${isStudent ? 'text-gray-500' : 'text-on-surface-variant'}`}>
        JPEG, PNG, GIF, WebP · Tối đa 5MB
      </p>
    </div>
  );
}
