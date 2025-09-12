import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn} from "typeorm"
import { User } from './users.model'
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
}