import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn } from 'typeorm';
import { Group } from './group.model';
import { User } from './users.model';
import { GroupInvitationStatus } from '../constants/constants';

@Entity({ name: 'group_invitation' })
export class GroupInvitation {
  @PrimaryGeneratedColumn({ name: 'idInvitation' }) // Sửa name
  idInvitation!: number;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'idGroup' }) 
  group!: Group; 

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inviter' })
  inviter!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitee' })
  invitee!: User;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", name: 'createdAt' }) // Sửa name
  createdAt!: Date;

  @Column({ type: 'boolean', default: false, name: 'needAdminApprove' }) // Sửa name
  needAdminApprove!: boolean;

  // Bỏ type: 'enum' vì trong DB cột này là varchar
  @Column({
    type: 'varchar', 
    default: GroupInvitationStatus.PENDING
  })
  status!: GroupInvitationStatus;
}