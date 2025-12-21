import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { UserRole } from '@/constants/constants'
import { User } from './users.model'
import { Group } from './group.model'
// Map to the existing DB table `group_user` and primary column `idGroup_User`
@Entity({ name: 'group_user' })
export class GroupUser {
  @PrimaryGeneratedColumn({ name: 'idgroup_user' })
  id!: number;

  @ManyToOne(() => Group, (group) => group.groupUsers)
  @JoinColumn({ name: 'idgroup' })
  group!: Group;

  @ManyToOne(() => User, (user) => user.groupUsers)
  @JoinColumn({ name: 'iduser' })
  user!: User;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actionby' })
  actionBy?: User;
}
