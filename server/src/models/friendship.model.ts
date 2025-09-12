import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn} from "typeorm"
import { User } from './users.model'
import { FriendStatus } from '@/constants/constants'
@Entity('FriendShip')
export class FriendShip {
  @PrimaryGeneratedColumn()
  idFriendShip!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender_id!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'friend_id' })
  friend_id!: User;

  @Column({ type: 'enum', enum: FriendStatus })
  status?: FriendStatus;

  @CreateDateColumn()
  requestAt!: Date;
}