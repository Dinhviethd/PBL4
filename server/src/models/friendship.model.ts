import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn} from "typeorm"
import { User } from './users.model'
import { FriendStatus } from '@/constants/constants'
@Entity({ name: 'friendship' })
export class FriendShip {
  @PrimaryGeneratedColumn({ name: 'idfriendship' })
  idFriendShip!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender_id!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'friend_id' })
  friend_id!: User;

  @Column({ type: 'enum', enum: FriendStatus })
  status?: FriendStatus;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'requestat' })
  requestAt!: Date;

  @Column()
  message?: string; //Text gửi kèm khi gửi lời mời kết bạn
}