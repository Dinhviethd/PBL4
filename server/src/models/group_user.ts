import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { UserRole } from '@/constants/constants'
import { User } from './users.model'
import { Group } from './group.model'
// Map to the existing DB table `group_user` and primary column `idGroup_User`
@Entity('group_user')
export class GroupUser {
  @PrimaryGeneratedColumn({ name: 'idGroup_User' })
  id!: number;

  @ManyToOne(() => Group, (group) => group.groupUsers)
  @JoinColumn({ name: 'idGroup' })
  group!: Group;

  @ManyToOne(() => User, (user) => user.groupUsers)
  @JoinColumn({ name: 'idUser' })
  user!: User;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actionBy' })
  actionBy?: User;
}
