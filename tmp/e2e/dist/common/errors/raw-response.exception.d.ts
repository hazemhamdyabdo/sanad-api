import { HttpException } from '@nestjs/common';
export declare class RawResponseException extends HttpException {
    constructor(status: number, body: Record<string, unknown>);
}
