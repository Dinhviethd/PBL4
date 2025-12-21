import { PrimaryGeneratedColumn, Entity, Column, OneToMany, CreateDateColumn } from 'typeorm'
import { VerifiedCode } from "./verification.model"
import { StatusUser } from '@/constants/constants'
import { GroupUser } from './group_user';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'iduser' })
  idUser!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column({ default: false, name: 'emailverified' })
  emailVerified!: boolean;

  @Column({ nullable: true, name: 'avatarurl' })
  avatarUrl?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true, type: 'date' })
  birthday?: Date;

  @Column({ nullable: true })
  gender?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'createdat' })
  createdAt!: Date;

  @Column({ nullable: true, name: 'lastlogin' })
  lastLogin?: Date;

  @Column({ type: 'enum', enum: StatusUser, default: StatusUser.OFFLINE })
  status!: StatusUser;

  @OneToMany(() => VerifiedCode, (verifiedCode) => verifiedCode.user)
  verifiedCodes!: VerifiedCode[];

  @OneToMany(() => GroupUser, (groupUser) => groupUser.user)
  groupUsers!: GroupUser[];
}
