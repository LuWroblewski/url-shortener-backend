import { Column, Entity, Generated, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Users } from '../../users/entities/user.entity';

@Entity()
export class Url {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  @Generated('uuid')
  public_id: string;
  @Column({ length: 2048, nullable: false })
  originalUrl: string;
  @Column({ length: 10, nullable: false, unique: true })
  shortCode: string;
  @Column({ default: 0 })
  clicks: number;
  @Column({ default: 1, comment: '1=Ativa, 2=Inativa' })
  status: number;
  @ManyToOne(() => Users, { nullable: true })
  createdBy: Users;
  @ManyToOne(() => Users, { nullable: true })
  updatedBy: Users;
  @ManyToOne(() => Users, { nullable: true })
  deletedBy: Users;
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
  @Column({ type: 'timestamptz', nullable: true })
  updatedAt: Date;
  @Column({ type: 'timestamptz', nullable: true })
  disabledAt: Date;
}
