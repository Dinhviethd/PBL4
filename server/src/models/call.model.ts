import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, CreateDateColumn } from 'typeorm'
import { User } from './users.model'
import { CallStatus } from '@/constants/constants'
import { JoinColumn } from 'typeorm'   
@Entity('Call')
export class Call {
  @PrimaryGeneratedColumn()
  idVideoInfor!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'caller_id' })
  caller_id!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver_id!: User;

  @CreateDateColumn()
  startedAt!: Date;

  @Column({ nullable: true })
  endedAt?: Date;

  @Column({ type: 'enum', enum: CallStatus })
  callStatus?: CallStatus;
}
