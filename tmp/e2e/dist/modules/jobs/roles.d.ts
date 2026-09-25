export declare const ROLE_GROUP_IDS: readonly ["software_development", "ai_ml", "it_support", "data_analytics", "design_creative", "marketing", "accounting_finance", "administrative_clerical", "hr_recruitment", "translation", "sales_retail", "customer_service_call_center", "hospitality_food_service", "healthcare_clinical_support", "pharmacy", "education", "transport_delivery", "warehouse_logistics", "security", "skilled_trades_construction", "automotive", "cleaning_services", "personal_domestic_services", "engineering_non_software", "legal", "real_estate", "fitness"];
export type RoleGroupId = (typeof ROLE_GROUP_IDS)[number];
export interface RoleGroup {
    id: RoleGroupId;
    keywords: string[];
}
export interface RoleDefinition {
    code: string;
    group: RoleGroupId;
    keyword: string;
    labelEn: string;
    labelAr: string;
    aliases: string[];
}
export declare const ROLE_GROUPS: RoleGroup[];
export declare const ROLE_DEFINITIONS: RoleDefinition[];
export declare function getRoleByCode(code: string): RoleDefinition | undefined;
export declare function getGroupById(id: RoleGroupId): RoleGroup;
export declare function normalize(text: string): string;
export declare function resolveRoleFromCvTitle(title: string | null | undefined): RoleDefinition | null;
