import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn} from "typeorm"
import { User } from './users.model'
import { Group } from './group.model'
import { Call } from './call.model'
import { MessageType } from '@/constants/constants'

@Entity({ name: 'message' })
export class Message {
  @PrimaryGeneratedColumn({ name: 'idmessage' })
  idMessage!: number;

  @Column({ nullable: true, name: 'fileurl' })
  fileURL?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sentby' })
  sentBy!: User;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type!: MessageType;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'createdat' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedat' })
  updatedAt!: Date;

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'sendtogroup' })
  sendToGroup?: Group;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sendtouser' })
  sendToUser?: User;

  @Column({ default: false , name: 'isdeleted' })
  isDeleted!: boolean;

  @Column({ nullable: true, name: 'deletedat' })
  deletedAt?: Date;

  @Column({ default: false, name: 'isedited' })
  isEdited!: boolean;

  @Column({ nullable: true, name: 'editedat' })
  editedAt?: Date;

  @ManyToOne(() => Call, { nullable: true })
  @JoinColumn({ name: 'callid' })
  call?: Call;

  @Column({ nullable: true, name: 'callid' })
  callId?: number;
}