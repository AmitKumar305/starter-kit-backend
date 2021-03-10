
import { NotificationControllers, AuthenticationControllers } from '../controllers';
/**
 * @author Abhinav Sharma
 * @since 10 March 2021
 */

const prefix = '/api/notification/';

export default (app) => {
	app.post(`${prefix}list`, AuthenticationControllers.authenticateUser, NotificationControllers.list);
	app.post(`${prefix}broadcast`, AuthenticationControllers.authenticateAdmin, NotificationControllers.broadcast);
};
