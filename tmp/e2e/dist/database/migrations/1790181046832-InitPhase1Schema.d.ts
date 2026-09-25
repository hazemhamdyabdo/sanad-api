import type { MigrationInterface, QueryRunner } from 'typeorm';
export declare class InitPhase1Schema1790181046832 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
