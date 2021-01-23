import {
	AuthenticationControllers,
	FaqControllers,
} from '../controllers';

const prefix = '/api/faq/';
/**
 * @description
 * This is the route handler for the FAQ.
 * @author Abhinav Sharma
 * @since 22 December, 2020
 */
export default (app) => {
	app.post(`${prefix}add`, AuthenticationControllers.authenticateAdmin, FaqControllers.add);
	app.post(`${prefix}update`, AuthenticationControllers.authenticateAdmin, FaqControllers.update);
	app.post(`${prefix}list`, FaqControllers.list);
	app.post(`${prefix}delete`, AuthenticationControllers.authenticateAdmin, FaqControllers.delete);
};
