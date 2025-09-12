import {PrimaryGeneratedColumn, Entity, ManyToOne} from "typeorm"
import { Column, JoinColumn, CreateDateColumn} from "typeorm"
import { User } from './users.model'
import { StatusNoti, NotiType } from '@/constants/constants'
@Entity('Notification')
export class Notification {
  @PrimaryGeneratedColumn()
  idNotification!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user_id!: User;

  @Column({ type: 'enum', enum: StatusNoti })
  status?: StatusNoti;

  @Column()
  content?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'enum', enum: NotiType })
  type?: NotiType;

  @Column()
  type_id!: number;
}