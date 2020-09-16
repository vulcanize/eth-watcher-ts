import * as HttpStatusCodes from 'http-status-codes';

export default class ApplicationError extends Error {

	public httpStatusCode: number;

	public constructor(m: string, code?: number) {
		super(m);

		this.httpStatusCode = code ? code : HttpStatusCodes.BAD_REQUEST;
	}
}
