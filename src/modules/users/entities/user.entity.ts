import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 250, nullable: false })
  firstName: string;
  @Column({ length: 250, nullable: false })
  lastName: string;
  @Column({ length: 100, nullable: false })
  userName: string;
  @Column({ length: 250, nullable: false })
  email: string;
  @Column({ length: 250, nullable: false })
  password: string;
  @Column({
    default: 1,
    nullable: true,
    comment: '1=Ativo, 2=Inativo, 3=Suspenso',
  })
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
