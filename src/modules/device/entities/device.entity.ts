import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * id is the client-generated X-Device-Id (uuid v4), not app-generated —
 * this is the one entity whose primary key comes from the request header.
 */
@Entity('devices')
export class Device {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar')
  platform!: string;

  @Column('varchar')
  appVersion!: string;

  @Column('varchar')
  locale!: string;

  @Column('varchar')
  region!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
