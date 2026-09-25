export declare const appConfig: (() => {
    env: "development" | "test" | "production";
    port: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    env: "development" | "test" | "production";
    port: number;
}>;
export declare const databaseConfig: (() => {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
}>;
export declare const aiConfig: (() => {
    llmProvider: "mistral" | "fake";
    apiKey: string | undefined;
    model: string;
    extractionModel: string;
    sttProvider: "mistral" | "fake";
    sttModel: string;
    embeddingProvider: "mistral" | "fake";
    embeddingModel: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    llmProvider: "mistral" | "fake";
    apiKey: string | undefined;
    model: string;
    extractionModel: string;
    sttProvider: "mistral" | "fake";
    sttModel: string;
    embeddingProvider: "mistral" | "fake";
    embeddingModel: string;
}>;
export declare const emailConfig: (() => {
    provider: "fake" | "resend";
    resendApiKey: string | undefined;
    fromAddress: string;
    fromName: string;
    redirectTo: string | null;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    provider: "fake" | "resend";
    resendApiKey: string | undefined;
    fromAddress: string;
    fromName: string;
    redirectTo: string | null;
}>;
export declare const jobsConfig: (() => {
    provider: "fake" | "jooble";
    joobleApiKeys: {
        EG: string | undefined;
        SA: string | undefined;
        AE: string | undefined;
        DE: string | undefined;
    };
    joobleMaxCalls: number;
    cacheTtlDays: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    provider: "fake" | "jooble";
    joobleApiKeys: {
        EG: string | undefined;
        SA: string | undefined;
        AE: string | undefined;
        DE: string | undefined;
    };
    joobleMaxCalls: number;
    cacheTtlDays: number;
}>;
