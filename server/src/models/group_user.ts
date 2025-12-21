import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { UserRole } from '@/constants/constants'
import { User } from './users.model'
import { Group } from './group.model'

@Entity({ name: 'group_user' })
export class GroupUser {
  @PrimaryGeneratedColumn({ name: 'idGroup_User' }) // CamelCase
  id!: number;

  @ManyToOne(() => Group, (group) => group.groupUsers)
  @JoinColumn({ name: 'idGroup' }) // CamelCase
  group!: Group;

  @ManyToOne(() => User, (user) => user.groupUsers)
  @JoinColumn({ name: 'idUser' }) // CamelCase
  user!: User;

  @Column({ type: 'enum', enum: UserRole, enumName: 'group_role_enum', default: UserRole.USER })
  role!: UserRole;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actionBy' }) // CamelCase
  actionBy?: User;
}