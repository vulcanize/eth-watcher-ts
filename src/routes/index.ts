import env from '../env';
import DefaultController from "../controllers/defaultController";

export default class Routes {

	public defaultController: DefaultController = new DefaultController();

	public routes(app): void {

		app.route('/add')
			.get((req, res) => {
				res.render('add.ejs', { api: env.HTTP_PUBLIC_ADDR });
			});

		app.route('/v1/test')
			.get(this.defaultController.test);

		app.route('/v1/contracts')
			.post(this.defaultController.addContracts);

	}
}
