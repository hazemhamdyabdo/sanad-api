import type { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddCvAnalysis1790292190541 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
