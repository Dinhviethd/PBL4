import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn} from "typeorm"
import { User } from './users.model'
import { Group } from './group.model'
import { MessageType } from '@/constants/constants'

@Entity('Message')
export class Message {
  @PrimaryGeneratedColumn()
  idMessage!: number;

  @Column({ nullable: true })
  fileURL?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sentBy' })
  sentBy!: User;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type!: MessageType;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'sendToGroup' })
  sendToGroup?: Group;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sendToUser' })
  sendToUser?: User;

  @Column({ default: false })
  isDeleted!: boolean;

  @Column({ nullable: true })
  deletedAt?: Date;
}