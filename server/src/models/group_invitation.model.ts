import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn } from 'typeorm';
import { Group } from './group.model';
import { User } from './users.model';
import { GroupInvitationStatus } from '../constants/constants';

@Entity({ name: 'group_invitation' })
export class GroupInvitation {
  @PrimaryGeneratedColumn({ name: 'idinvitation' })
  idInvitation!: number;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'idgroup' })
  idGroup!: Group;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inviter' })
  inviter!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitee' })
  invitee!: User;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'createdat' })
  createdAt!: Date;

  @Column({ type: 'boolean', default: false, name: 'needadminapprove' })
  needAdminApprove!: boolean;

  @Column({
    type: 'enum',
    enum: GroupInvitationStatus,
    default: GroupInvitationStatus.PENDING
  })
  status!: GroupInvitationStatus;
}
