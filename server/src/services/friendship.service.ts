import { AppError } from "@/utils/error.response";
import { FriendshipRepository } from "@/repositories/friendship.repository";
import { UserRepository } from "@/repositories/user.repository";
import { FriendStatus } from "@/constants/constants";
import { PaginationUtil, PaginationResult, createPaginationQuery } from "@/utils/pagination"

class FriendshipService {
  private friendshipRepository = new FriendshipRepository();
  private userRepository = new UserRepository();

  async sendRequest(senderId: number, receiverId: number, message?: string) {
    if (senderId == receiverId) throw new AppError(400, "Không thể tự gửi lời mời kết bạn cho chính mình");

    const sender = await this.userRepository.findById(senderId);
    const receiver = await this.userRepository.findById(receiverId);

    if (!receiver) throw new AppError(404, "Không tìm thấy người nhận");

    const existing = await this.friendshipRepository.findFriendship(senderId, receiverId);
    if (existing) throw new AppError(400, "Đã tồn tại mối quan hệ giữa 2 người dùng");

    return await this.friendshipRepository.createRequest(sender!, receiver, message);
  }

  async acceptRequest(userId: number, requestId: number) {
    const request = await this.friendshipRepository.findFriendshipById(requestId);
    if (!request) throw new AppError(404, "Không tìm thấy lời mời kết bạn");

    if (request.friend_id.idUser !== userId) throw new AppError(403, "Bạn không thể chấp nhận lời mời này");

    await this.friendshipRepository.updateStatus(requestId, FriendStatus.ACCEPTED);
    return { message: "Đã chấp nhận lời mời kết bạn" };
  }

  async deleteFriendship(userId: number, friendId: number) {
    const friendship = await this.friendshipRepository.findFriendship(userId, friendId);
    if (!friendship) throw new AppError(404, "Không tìm thấy mối quan hệ bạn bè");

    await this.friendshipRepository.deleteFriendship(friendship.idFriendShip);
    return { message: "Đã xóa bạn bè thành công" };
  }

  async blockFriend(userId: number, friendId: number) {
    // If there is an existing friendship, update status to BLOCKED
    const friendship = await this.friendshipRepository.findFriendship(userId, friendId);
    if (friendship) {
      await this.friendshipRepository.updateStatus(friendship.idFriendShip, FriendStatus.BLOCKED);
      return { message: "Đã chặn người dùng" };
    }

    // Otherwise create a new friendship record with BLOCKED status where sender is the blocker
    const sender = await this.userRepository.findById(userId);
    const receiver = await this.userRepository.findById(friendId);
    if (!sender || !receiver) throw new AppError(404, "Người dùng không tồn tại");

    await this.friendshipRepository.createFriendshipWithStatus(sender!, receiver, FriendStatus.BLOCKED);
    return { message: "Đã chặn người dùng" };
  }

  async unblockFriend(userId: number, friendId: number) {
    const friendship = await this.friendshipRepository.findFriendship(userId, friendId);
    if (!friendship) throw new AppError(404, "Không tìm thấy mối quan hệ");

    // If the friendship was blocked, remove it or set to pending/accepted depending on desired semantics.
    // We'll delete the blocked relationship to simplify (unblock => remove block record)
    await this.friendshipRepository.deleteFriendship(friendship.idFriendShip);
    return { message: "Đã bỏ chặn" };
  }

  async getFriends(userId: number, page = 1, limit = 10): Promise<PaginationResult<any>> {
    PaginationUtil.validatePagination(page, limit);

    const { skip, take } = createPaginationQuery(page, limit);
    const [list, total] = await this.friendshipRepository.getFriends(userId, skip, take);

    const data = list.map((f) => {
        const friend = f.sender_id.idUser === userId ? f.friend_id : f.sender_id;
        return {
    id: friend.idUser,
    name: friend.name,
    avatarUrl: friend.avatarUrl,
    email: friend.email,
    phone: friend.phone,
        };
    });

    return PaginationUtil.createPagination(data, total, page, limit);
    }

  async getPendingRequests(userId: number) {
    return await this.friendshipRepository.getPendingRequests(userId);
  }

  async getReceivedRequests(userId: number, page = 1, limit = 10) {
    PaginationUtil.validatePagination(page, limit);
    const { skip, take } = createPaginationQuery(page, limit);
    const [list, total] = await this.friendshipRepository.getReceivedRequestsPaginated(userId, skip, take);

    const data = list.map((f) => ({
      id: f.idFriendShip,
      sender: {
        id: f.sender_id.idUser,
        name: f.sender_id.name,
        avatarUrl: f.sender_id.avatarUrl,
      },
      message: f.message,
      requestAt: f.requestAt,
    }));

    return PaginationUtil.createPagination(data, total, page, limit);
  }

  async getSentRequests(userId: number, page = 1, limit = 10) {
    PaginationUtil.validatePagination(page, limit);
    const { skip, take } = createPaginationQuery(page, limit);
    const [list, total] = await this.friendshipRepository.getSentRequestsPaginated(userId, skip, take);

    const data = list.map((f) => ({
      id: f.idFriendShip,
      receiver: {
        id: f.friend_id.idUser,
        name: f.friend_id.name,
        avatarUrl: f.friend_id.avatarUrl,
      },
      message: f.message,
      requestAt: f.requestAt,
    }));

    return PaginationUtil.createPagination(data, total, page, limit);
  }

  async deleteRequest(userId: number, requestId: number) {
    const request = await this.friendshipRepository.findFriendshipById(requestId);
    if (!request) throw new AppError(404, "Không tìm thấy lời mời");

    if (request.status !== FriendStatus.PENDING) throw new AppError(400, "Lời mời không ở trạng thái chờ");

    const isSender = request.sender_id.idUser === userId;
    const isReceiver = request.friend_id.idUser === userId;

    if (!isSender && !isReceiver) throw new AppError(403, "Bạn không có quyền hủy/từ chối lời mời này");

    await this.friendshipRepository.deleteFriendship(requestId);

    if (isSender) return { message: "Đã thu hồi lời mời" };
    return { message: "Đã từ chối lời mời" };
  }
}

export default new FriendshipService();
