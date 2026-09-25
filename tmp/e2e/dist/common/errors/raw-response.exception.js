import { HttpException } from '@nestjs/common';
export class RawResponseException extends HttpException {
    constructor(status, body) {
        super(body, status);
    }
}
//# sourceMappingURL=raw-response.exception.js.map