import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm'
import { verifiedCodeType } from '@/constants/constants'
import { User } from './users.model'

@Entity({ name: 'verified_code' })
export class VerifiedCode{
    @PrimaryGeneratedColumn({ name: 'idVerifiedCode' }) // CamelCase
    idVerifiedCode!: number;

    @Column({name: 'ExpiredAt'}) // CamelCase
    ExpiredAt!: Date

    @CreateDateColumn({ 
        type: "timestamp", 
        default: () => "CURRENT_TIMESTAMP(6)",  name: 'CreatedAt' // CamelCase
    })
    CreatedAt!: Date; 

    @Column({type: "varchar" }) // Postgres check constraint, không phải enum native nếu chưa tạo type
    type!: verifiedCodeType;

    @Column({ nullable: true })
    code?: string;

    @ManyToOne(()=> User, (user) => user.verifiedCodes)
    @JoinColumn({ name: 'userIdUser' }) // CamelCase
    user!: User;
}