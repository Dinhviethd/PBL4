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

    return [data, total];
    }


  async getPendingRequests(userId: number): Promise<FriendShip[]> {
    return await this.repo.find({
      where: { friend_id: { idUser: userId }, status: FriendStatus.PENDING },
      relations: ["sender_id"],
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

    return [data, total];
  }

  async getSentRequestsPaginated(userId: number, skip: number, take: number): Promise<[FriendShip[], number]> {
    const [data, total] = await this.repo.findAndCount({
      where: { sender_id: { idUser: userId }, status: FriendStatus.PENDING },
      relations: ["friend_id"],
      skip,
      take,
      order: { requestAt: "DESC" },
    });

    return [data, total];
  }
}
