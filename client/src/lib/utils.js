import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Lấy URL avatar, nếu không có thì trả về ảnh mặc định
 * @param {string} avatarUrl - URL của avatar
 * @param {string} defaultAvatar - Đường dẫn ảnh mặc định (optional)
 * @returns {string} URL avatar hoặc ảnh mặc định
 */
export function getAvatarUrl(avatarUrl, defaultAvatar = '/images/avatar-default-icon.png') {
  return avatarUrl || defaultAvatar;
}
