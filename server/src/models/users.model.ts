import { PrimaryGeneratedColumn, Entity, Column, OneToMany, CreateDateColumn } from 'typeorm'
import { VerifiedCode } from "./verification.model"
import { StatusUser } from '@/constants/constants'

@Entity('Users')
export class User {
  @PrimaryGeneratedColumn()
  idUser!: number;

  @Column()
  name?: string;

  @Column()
  email?: string;

  @Column()
  password?: string;

  @Column({ default: false })
  emailVerified?: boolean;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true, type: 'date' })
  birthday?: Date;

  @Column({ nullable: true })
  gender?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @Column({ nullable: true })
  lastLogin?: Date;

  @Column({ type: 'enum', enum: StatusUser, default: StatusUser.OFFLINE })
  status?: StatusUser;

  @OneToMany(() => VerifiedCode, (verifiedCode) => verifiedCode.user)
  verifiedCodes!: VerifiedCode[]
}