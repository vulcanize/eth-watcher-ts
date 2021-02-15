import DefaultController from "../controllers/defaultController";

export default class Routes {

	public defaultController: DefaultController = new DefaultController();

	public routes(app): void {

		app.route('/v1/healthz')
			.get(this.defaultController.health);

	}
}
