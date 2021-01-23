import {
	AuthenticationControllers,
	AppDetailControllers,
} from '../controllers';

const prefix = '/api/appDetail/';
/**
 * @description
 * This is the route handler for the App Details.
 * @author Abhinav Sharma
 * @since 22 December, 2020
 */
export default (app) => {
	app.post(`${prefix}add`, AuthenticationControllers.authenticateAdmin, AppDetailControllers.add);
	app.post(`${prefix}list`, AppDetailControllers.list);
};
