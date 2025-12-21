import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn} from "typeorm"
import { User } from './users.model'
import { Group } from './group.model'
import { Call } from './call.model'
import { MessageType } from '@/constants/constants'

@Entity({ name: 'message' })
export class Message {
  @PrimaryGeneratedColumn({ name: 'idMessage' }) // Sửa name
  idMessage!: number;

  @Column({ nullable: true, name: 'fileURL' }) // Sửa name
  fileURL?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sentBy' }) // Sửa name khớp SQL "sentBy"
  sentBy!: User;

  // Thêm enumName
  @Column({ type: 'enum', enum: MessageType, enumName: 'msg_type_enum', default: MessageType.TEXT })
  type!: MessageType;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'createdAt' }) // Sửa name
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' }) // Sửa name
  updatedAt!: Date;

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'sendToGroup' }) // Sửa name
  sendToGroup?: Group;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sendToUser' }) // Sửa name
  sendToUser?: User;

  @Column({ default: false , name: 'isDeleted' }) // Sửa name
  isDeleted!: boolean;

  @Column({ nullable: true, name: 'deletedAt' }) // Sửa name
  deletedAt?: Date;

  @Column({ default: false, name: 'isEdited' }) // Sửa name
  isEdited!: boolean;

  @Column({ nullable: true, name: 'editedAt' }) // Sửa name
  editedAt?: Date;

  @ManyToOne(() => Call, { nullable: true })
  @JoinColumn({ name: 'callId' }) // Sửa name
  call?: Call;

  @Column({ nullable: true, name: 'callId' }) // Sửa name
  callId?: number;
}