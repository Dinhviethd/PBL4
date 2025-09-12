import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn} from "typeorm"
import { UserRole } from '@/constants/constants'
import { User } from './users.model'
import { Group } from './group.model'
@Entity('Group_User')
export class GroupUser {
  @PrimaryGeneratedColumn()
  idGroup_User!: number;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'idGroup' })
  idGroup?: Group;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'idUser' })
  idUser!: User;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role?: UserRole;
}
