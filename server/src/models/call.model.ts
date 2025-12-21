import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm'
import { User } from './users.model'
import { CallStatus } from '@/constants/constants'

@Entity( { name: 'call' } )
export class Call {
  @PrimaryGeneratedColumn({ name: 'idCall' }) // Sửa name
  idCall!: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'caller_id' })
  caller!: User;

  @Column('int')
  caller_id!: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'receiver_id' })
  receiver!: User;

  @Column('int')
  receiver_id!: number;

  // Thêm enumName
  @Column({ type: 'enum', enum: ['audio', 'video'], enumName: 'call_type_enum', default: 'audio', name: 'callType' })
  callType!: 'audio' | 'video';

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'startedAt' }) // Sửa name
  startedAt!: Date;

  @Column({ nullable: true, name: 'answeredAt' }) // Sửa name
  answeredAt?: Date;

  @Column({ nullable: true, name: 'endedAt' }) // Sửa name
  endedAt?: Date;

  // Thêm enumName
  @Column({ type: 'enum', enum: CallStatus, enumName: 'call_status_enum', default: CallStatus.MISSED, name: 'callStatus' })
  callStatus!: CallStatus;

  @Column({ type: 'int', nullable: true })
  duration?: number;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)", name: 'updatedAt' }) // Sửa name
  updatedAt!: Date;
}