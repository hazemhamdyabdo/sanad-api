import type { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddJobs1790298140466 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
