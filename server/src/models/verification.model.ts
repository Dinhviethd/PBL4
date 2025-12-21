import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, CreateDateColumn } from 'typeorm'
import { verifiedCodeType } from '@/constants/constants'
import { User } from './users.model'
@Entity({ name: 'verified_code' })
export class VerifiedCode{
    @PrimaryGeneratedColumn({ name: 'idverifiedcode' })
    idVerifiedCode!: number;

    @Column({name: 'expiredat'})
    ExpiredAt!: Date

    @CreateDateColumn({ 
        type: "timestamp", 
        default: () => "CURRENT_TIMESTAMP(6)",  name: 'createdat'
    })
    CreatedAt!: Date; 

    @Column({type: "enum" ,enum: verifiedCodeType})
    type!: verifiedCodeType;

    @Column({ nullable: true })
    code?: string;

    @ManyToOne(()=> User, (user) => user.verifiedCodes)
    user!: User;
}