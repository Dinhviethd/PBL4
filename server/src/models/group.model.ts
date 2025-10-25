import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany} from "typeorm"
import { User } from './users.model'
import { GroupUser } from "./group_user";
@Entity('Groups')
export class Group {
  @PrimaryGeneratedColumn()
  idGroup!: number;

  @Column()
  name?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @Column({ default: true })
  statusGroup?: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdBy?: User;

  @OneToMany(() => GroupUser, (groupUser) => groupUser.idGroup)
groupUsers!: GroupUser[];
}