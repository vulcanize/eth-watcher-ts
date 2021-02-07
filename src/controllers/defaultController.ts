
import { NextFunction, Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import ContractService from '../services/contractService';

const contractService = new ContractService();

export default class DefaultController {

	public async test (req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			res.status(HttpStatusCodes.OK).json({
				message: 'OK',
			});
		} catch (error) {
			error.httpStatusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
			return next(error);
		}
	}

	public async addContracts (req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const addresses = req.body.addresses;
			const apikey = req.body.apikey;

			const data = await contractService.addContracts(apikey, addresses);

			res.status(HttpStatusCodes.OK).json({
				message: 'OK',
				data,
			});
		} catch (error) {
			error.httpStatusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
			return next(error);
		}
	}

}
