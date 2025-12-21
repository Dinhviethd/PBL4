import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn} from "typeorm"
import { User } from './users.model'
import { FriendStatus } from '@/constants/constants'

@Entity({ name: 'friendship' })
export class FriendShip {
  @PrimaryGeneratedColumn({ name: 'idFriendShip' }) // Sửa name
  idFriendShip!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender_id!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'friend_id' })
  friend_id!: User;

  // Thêm enumName
  @Column({ type: 'enum', enum: FriendStatus, enumName: 'friendship_status_enum' })
  status?: FriendStatus;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'requestAt' }) // Sửa name
  requestAt!: Date;

  @Column()
  message?: string; 
}