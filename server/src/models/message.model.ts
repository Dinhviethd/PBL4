import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn} from "typeorm"
import { User } from './users.model'
import { Group } from './group.model'
import { Call } from './call.model'
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

  @UpdateDateColumn()
  updatedAt!: Date;

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

  @Column({ default: false })
  isEdited!: boolean;

  @Column({ nullable: true })
  editedAt?: Date;

  @ManyToOne(() => Call, { nullable: true })
  @JoinColumn({ name: 'callId' })
  call?: Call;

  @Column({ nullable: true })
  callId?: number;
}