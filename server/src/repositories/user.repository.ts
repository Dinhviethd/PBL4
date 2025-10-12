import { AppDataSource } from "@/configs/database.config";
import { Repository } from "typeorm";
import { User } from "@/models/users.model";
import { StatusUser } from "@/constants/constants";

export class UserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async findById(userId: number): Promise<User | null> {
    return await this.repo.findOne({ where: { idUser: userId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repo.findOne({ where: { email } });
  }

  async save(user: Partial<User>): Promise<User> {
    return await this.repo.save(user);
  }

  async update(userId: number, data: Partial<User>) {
    return await this.repo.update({ idUser: userId }, data);
  }

  async delete(userId: number) {
    return await this.repo.delete({ idUser: userId });
  }

  async getStatus(userId: number): Promise<StatusUser | null> {
    const user = await this.repo.findOne({
      where: { idUser: userId },
      select: ["status"],
    });
    return user?.status ?? null;
  }
}
