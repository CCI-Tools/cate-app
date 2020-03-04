export class HttpError extends Error {
    private _status: number;

    static fromResponse(response: Response): HttpError {
        return new HttpError(response.status, response.statusText);
    }

    constructor(status: number, statusText: string) {
        super(statusText);
        this._status = status;
    }

    get status(): number {
        return this._status;
    }

    get statusText(): string {
        return this.message;
    }
}
