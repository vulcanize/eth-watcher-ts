
import { NextFunction, Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';

export default class DefaultController {

	public async health ({ res, next }: { req: Request; res: Response; next: NextFunction }): Promise<void> {
		try {
			res.status(HttpStatusCodes.OK).json({
				message: 'OK',
			});
		} catch (error) {
			error.httpStatusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
			return next(error);
		}
	}

}
