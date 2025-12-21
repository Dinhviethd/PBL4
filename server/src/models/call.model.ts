import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { User } from './users.model'
import { CallStatus } from '@/constants/constants'
import { JoinColumn } from 'typeorm'   

@Entity( { name: 'call' } )
export class Call {
  @PrimaryGeneratedColumn({ name: 'idcall' })
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

  @Column({ type: 'enum', enum: ['audio', 'video'], default: 'audio', name: 'calltype' })
  callType!: 'audio' | 'video';

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'startedat' })
  startedAt!: Date;

  @Column({ nullable: true, name: 'answeredat' })
  answeredAt?: Date;

  @Column({ nullable: true, name: 'endedat' })
  endedAt?: Date;

  @Column({ type: 'enum', enum: CallStatus, default: CallStatus.MISSED, name: 'callstatus' })
  callStatus!: CallStatus;

  @Column({ type: 'int', nullable: true })
  duration?: number; // Duration in seconds

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)", name: 'updatedat' })
  updatedAt!: Date;
}
