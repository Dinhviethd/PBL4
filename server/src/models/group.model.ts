import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany} from "typeorm"
import { User } from './users.model'
import { GroupUser } from "./group_user";

@Entity({ name: 'groups' })
export class Group {
  @PrimaryGeneratedColumn({name: 'idGroup'}) // CamelCase
  idGroup!: number;

  @Column()
  name!: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'createdAt' }) // CamelCase
  createdAt!: Date;

  @Column({ default: true, name: 'statusGroup' }) // CamelCase
  statusGroup!: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' }) // CamelCase
  createdBy?: User;

  @OneToMany(() => GroupUser, (groupUser) => groupUser.group)
  groupUsers!: GroupUser[];
}