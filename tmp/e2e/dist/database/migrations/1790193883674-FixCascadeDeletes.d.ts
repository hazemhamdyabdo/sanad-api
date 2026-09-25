import type { MigrationInterface, QueryRunner } from 'typeorm';
export declare class FixCascadeDeletes1790193883674 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
