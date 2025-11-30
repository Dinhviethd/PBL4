import { AppDataSource } from "@/configs/database.config";
import { Repository } from "typeorm";
import { FriendShip } from "@/models/friendship.model";
import { User } from "@/models/users.model";
import { FriendStatus } from "@/constants/constants";
import { UserResponse } from "@/DTOs/user.dto";

export class FriendshipRepository {
  private repo: Repository<FriendShip>;

  constructor() {
    this.repo = AppDataSource.getRepository(FriendShip);
  }

  async createRequest(sender: UserResponse, receiver: UserResponse, message?: string): Promise<FriendShip> {
    const friendRequest = this.repo.create({
      sender_id: sender,
      friend_id: receiver,
      message,
      status: FriendStatus.PENDING,
    });
    return await this.repo.save(friendRequest);
  }

  async createFriendshipWithStatus(sender: UserResponse, receiver: UserResponse, status: FriendStatus, message?: string): Promise<FriendShip> {
    const friendship = this.repo.create({
      sender_id: sender,
      friend_id: receiver,
      message,
      status,
    });
    return await this.repo.save(friendship);
  }

  async findFriendship(senderId: number, friendId: number): Promise<FriendShip | null> {
    return await this.repo.findOne({
      where: [
        { sender_id: { idUser: senderId }, friend_id: { idUser: friendId } },
        { sender_id: { idUser: friendId }, friend_id: { idUser: senderId } },
      ],
      relations: ["sender_id", "friend_id"],
    });
  }

  async findFriendshipById(id: number): Promise<FriendShip | null> {
    return await this.repo.findOne({
      where: { idFriendShip: id },
      relations: ["sender_id", "friend_id"],
    });
  }

  async updateStatus(id: number, status: FriendStatus) {
    return await this.repo.update({ idFriendShip: id }, { status });
  }

  async deleteFriendship(id: number) {
    return await this.repo.delete({ idFriendShip: id });
  }

    async getFriends(userId: number, skip: number, take: number): Promise<[FriendShip[], number]> {
    // Chỉ lấy bạn bè có status ACCEPTED, loại bỏ các mối quan hệ BLOCKED
    const [data, total] = await this.repo.findAndCount({
      where: [
        { sender_id: { idUser: userId }, status: FriendStatus.ACCEPTED },
        { friend_id: { idUser: userId }, status: FriendStatus.ACCEPTED },
      ],
      relations: ["sender_id", "friend_id"],
      skip,
      take,
      order: { requestAt: "DESC" },
    });

    // Loại bỏ các mối quan hệ mà status là BLOCKED (nếu có nhầm lẫn dữ liệu)
    const filtered = data.filter(f => f.status !== FriendStatus.BLOCKED);
    return [filtered, filtered.length];
    }


  async getPendingRequests(userId: number): Promise<FriendShip[]> {
    // Chỉ lấy lời mời chưa bị chặn
    const requests = await this.repo.find({
      where: { friend_id: { idUser: userId }, status: FriendStatus.PENDING },
      relations: ["sender_id"],
    });
    // Loại bỏ các lời mời mà giữa 2 người đã có mối quan hệ BLOCKED
    return requests.filter(async (req) => {
      const blocked = await this.findFriendship(req.sender_id.idUser, userId);
      return !(blocked && blocked.status === FriendStatus.BLOCKED);
    });
  }

  async getReceivedRequestsPaginated(userId: number, skip: number, take: number): Promise<[FriendShip[], number]> {
    const [data, total] = await this.repo.findAndCount({
      where: { friend_id: { idUser: userId }, status: FriendStatus.PENDING },
      relations: ["sender_id"],
      skip,
      take,
      order: { requestAt: "DESC" },
    });
    // Loại bỏ các lời mời mà giữa 2 người đã có mối quan hệ BLOCKED
    const filtered = [];
    for (const req of data) {
      const blocked = await this.findFriendship(req.sender_id.idUser, userId);
      if (!(blocked && blocked.status === FriendStatus.BLOCKED)) {
        filtered.push(req);
      }
    }
    return [filtered, filtered.length];
  }

  async getSentRequestsPaginated(userId: number, skip: number, take: number): Promise<[FriendShip[], number]> {
    const [data, total] = await this.repo.findAndCount({
      where: { sender_id: { idUser: userId }, status: FriendStatus.PENDING },
      relations: ["friend_id"],
      skip,
      take,
      order: { requestAt: "DESC" },
    });
    // Loại bỏ các lời mời mà giữa 2 người đã có mối quan hệ BLOCKED
    const filtered = [];
    for (const req of data) {
      const blocked = await this.findFriendship(userId, req.friend_id.idUser);
      if (!(blocked && blocked.status === FriendStatus.BLOCKED)) {
        filtered.push(req);
      }
    }
    return [filtered, filtered.length];
  }
}
