import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToOne} from "typeorm"
import { UserRole } from '@/constants/constants'
import { User } from './users.model'
import { Group } from './group.model'
@Entity('Group_User')
export class GroupUser {
  @PrimaryGeneratedColumn()
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
