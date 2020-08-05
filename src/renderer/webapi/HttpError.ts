export class HttpError extends Error {
    constructor(status: number, statusText: string) {
        super(statusText);
        this._status = status;
    }

    private _status: number;

    get status(): number {
        return this._status;
    }

    get statusText(): string {
        return this.message;
    }

    static fromResponse(response: Response): HttpError {
        return new HttpError(response.status, response.statusText);
    }
}
