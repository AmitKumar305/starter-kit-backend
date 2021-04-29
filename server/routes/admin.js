import {
	AuthenticationControllers,
	AdminControllers,
} from '../controllers';

const prefix = '/api/admin/';
/**
 * @description
 * This is the route handler for the admin.
 * @author Santgurlal Singh
 * @since 12 Jan, 2021
 */

export default (app) => {
	app.post(`${prefix}signup`, AdminControllers.signup);
	app.post(`${prefix}login`, AdminControllers.login);
	app.post(`${prefix}dashboard`, AuthenticationControllers.authenticateAdmin, AdminControllers.dashboard);
	app.post(`${prefix}userList`, AuthenticationControllers.authenticateAdmin, AdminControllers.userList);
	app.post(`${prefix}editUser`, AuthenticationControllers.authenticateAdmin, AdminControllers.editUser);
};
