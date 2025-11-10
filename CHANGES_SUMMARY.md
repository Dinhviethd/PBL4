# Cập nhật - Danh sách Nhóm và Mời Thành Viên

## 📋 Các thay đổi chính:

### 1. ✅ Cho phép mời những người chưa phải bạn bè

- **Thêm endpoint mới:**

  - `GET /groups/:groupId/invitable-users` - Lấy danh sách tất cả users có thể mời (không chỉ bạn bè)
  - `POST /groups/:groupId/invite` - Mời user vào group

- **File thay đổi:**

  - `server/src/repositories/group.repository.ts` - Thêm method `getInvitableUsers()`
  - `server/src/services/group.service.ts` - Thêm 2 methods: `getInvitableUsers()` và `inviteUserToGroup()`
  - `server/src/controllers/group.controller.ts` - Thêm 2 handlers tương ứng
  - `server/src/routes/apis/group.route.ts` - Thêm 2 routes mới

- **Client side:**
  - `client/src/services/group.service.js` - Thêm tất cả các service methods cần thiết

### 2. ✅ Hiển thị ảnh nhóm ở phần tin nhắn (như danh sách nhóm)

- **Thay đổi:**
  - `client/src/pages/chat/components/ChatArea.jsx`
    - Thêm helper function `getGroupAvatarDisplay()` tạo SVG avatar với chữ cái đầu
    - Cập nhật header chat để hiển thị ảnh nhóm (chữ cái đầu của tên nhóm)

### 3. ✅ Click vào nhóm trong danh sách để mở trang tin nhắn

- **Thay đổi:**
  - `client/src/pages/contact/GroupsList.jsx`
    - Import `useNavigate` từ react-router
    - Thêm `handleGroupClick()` function để navigate tới `/chat?type=group&id={groupId}`
    - Thêm click handler toàn bộ group item
    - Thêm button icon tin nhắn (MessageSquare) khi hover
    - Click vào nhóm sẽ mở trang chat

### 4. ✅ Sửa Bug - Route `/my-groups`

- **Vấn đề:** Route GET `/my-groups` được đặt sau `:groupId` routes, khiến `/my-groups` khớp với `:groupId` parameter
- **Giải pháp:** Di chuyển route `/my-groups` lên trước `:groupId` routes
- **File:** `server/src/routes/apis/group.route.ts`

### 5. ✅ Thêm Console Logs để Debug

- **Server:** `group.controller.ts` - Log userId, params, số groups
- **Client:** `GroupsList.jsx` - Log dữ liệu response, items, groups mapped

---

## 🔄 Flow Chi Tiết:

### Mời User vào Nhóm

1. Admin/Member click menu ⋯ → "Mời vào nhóm"
2. Modal hiển thị search box
3. Gọi `getInvitableUsers` - lấy danh sách tất cả users (không phải thành viên)
4. Click "Mời" → gọi `inviteUserToGroup`
5. User được thêm vào nhóm trực tiếp (UserRole.USER)

### Click Nhóm Để Mở Chat

1. Click vào nhóm item
2. Navigate tới `/chat?type=group&id={groupId}`
3. ChatArea hiển thị ảnh nhóm (chữ cái đầu)

---

## 📌 Database:

- Không thay đổi schema
- Chỉ thêm logic để lấy users chưa là thành viên

## 🧪 Test:

1. Khởi động server: `npm run dev` (trong folder `/server`)
2. Khởi động client: `npm run dev` (trong folder `/client`)
3. Đăng nhập vào 2 tài khoản khác nhau
4. Thử:
   - Click vào "Danh sách nhóm" xem dữ liệu được load
   - Tạo nhóm mới hoặc click nhóm cũ
   - Hover vào nhóm → click icon tin nhắn hoặc click trực tiếp vào nhóm
   - Mở modal mời → search các users khác (không chỉ bạn bè)
   - Mời user vào nhóm
