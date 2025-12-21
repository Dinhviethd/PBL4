import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany} from "typeorm"
import { User } from './users.model'
import { GroupUser } from "./group_user";
@Entity({ name: 'groups' })
export class Group {
  @PrimaryGeneratedColumn({name: 'idgroup'})
  idGroup!: number;

  @Column()
  name!: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'createdat' })
  createdAt!: Date;

  @Column({ default: true, name: 'statusgroup' })
  statusGroup!: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdby' })
  createdBy?: User;

  @OneToMany(() => GroupUser, (groupUser) => groupUser.group)
  groupUsers!: GroupUser[];
}
