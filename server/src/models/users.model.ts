import { PrimaryGeneratedColumn, Entity, Column, OneToMany, CreateDateColumn } from 'typeorm'
import { VerifiedCode } from "./verification.model"
import { StatusUser } from '@/constants/constants'
import { GroupUser } from './group_user';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'idUser' }) // Sửa name
  idUser!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column({ default: false, name: 'emailVerified' }) // Sửa name
  emailVerified!: boolean;

  @Column({ nullable: true, name: 'avatarUrl' }) // Sửa name
  avatarUrl?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true, type: 'date' })
  birthday?: Date;

  @Column({ nullable: true })
  gender?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'createdAt' }) // Sửa name
  createdAt!: Date;

  @Column({ nullable: true, name: 'lastLogin' }) // Sửa name
  lastLogin?: Date;

  // Thêm enumName để khớp với Postgres Enum type
  @Column({ type: 'enum', enum: StatusUser, enumName: 'user_status_enum', default: StatusUser.OFFLINE })
  status!: StatusUser;

  @OneToMany(() => VerifiedCode, (verifiedCode) => verifiedCode.user)
  verifiedCodes!: VerifiedCode[];

  @OneToMany(() => GroupUser, (groupUser) => groupUser.user)
  groupUsers!: GroupUser[];
}