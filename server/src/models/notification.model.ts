import {PrimaryGeneratedColumn, Entity, ManyToOne} from "typeorm"
import { Column, JoinColumn, CreateDateColumn} from "typeorm"
import { User } from './users.model'
import { StatusNoti, NotiType } from '@/constants/constants'
@Entity({ name: 'notification' })
export class Notification {
  @PrimaryGeneratedColumn({name: 'idnotification'})
  idNotification!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user_id!: User;

  @Column({ type: 'enum', enum: StatusNoti })
  status?: StatusNoti;

  @Column()
  content?: string;

  @CreateDateColumn({name: 'createdat'})
  createdAt!: Date;

  @Column({ type: 'enum', enum: NotiType })
  type?: NotiType;

  @Column()
  type_id!: number;
}