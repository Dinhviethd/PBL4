// utils/groupAvatar.js
/**
 * Trả về chuỗi SVG base64 dùng làm avatar cho nhóm, dựa trên chữ cái đầu tiên của tên nhóm.
 * @param {string} groupName
 * @returns {string} Chuỗi base64 SVG
 */
export function getGroupAvatarDisplay(groupName = '') {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2360A5FA'/%3E%3Ctext x='50' y='65' font-size='40' font-weight='bold' fill='white' text-anchor='middle'%3E${groupName.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
}
