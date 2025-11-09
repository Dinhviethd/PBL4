import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { User } from './users.model'
import { CallStatus } from '@/constants/constants'
import { JoinColumn } from 'typeorm'   

@Entity('Call')
export class Call {
  @PrimaryGeneratedColumn()
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

  @Column({ type: 'enum', enum: ['audio', 'video'], default: 'audio' })
  callType!: 'audio' | 'video';

  @CreateDateColumn()
  startedAt!: Date;

  @Column({ nullable: true })
  answeredAt?: Date;

  @Column({ nullable: true })
  endedAt?: Date;

  @Column({ type: 'enum', enum: CallStatus, default: CallStatus.MISSED })
  callStatus!: CallStatus;

  @Column({ type: 'int', nullable: true })
  duration?: number; // Duration in seconds

  @UpdateDateColumn()
  updatedAt!: Date;
}
