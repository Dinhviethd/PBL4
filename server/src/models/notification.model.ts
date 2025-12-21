import {PrimaryGeneratedColumn, Entity, ManyToOne} from "typeorm"
import { Column, JoinColumn, CreateDateColumn} from "typeorm"
import { User } from './users.model'
import { StatusNoti, NotiType } from '@/constants/constants'

@Entity({ name: 'notification' })
export class Notification {
  @PrimaryGeneratedColumn({name: 'idNotification'}) // Sửa name
  idNotification!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user_id!: User;

  // Đổi sang varchar để khớp với DB
  @Column({ type: 'varchar', default: 'pending' }) 
  status?: StatusNoti;

  @Column()
  content?: string;

  @CreateDateColumn({name: 'createdAt'}) // Sửa name
  createdAt!: Date;

  // Đổi sang varchar để khớp với DB
  @Column({ type: 'varchar' })
  type?: NotiType;

  @Column()
  type_id!: number;
}