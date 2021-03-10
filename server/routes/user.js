import { MultipartService } from '../services';
import {
	AuthenticationControllers,
	UserControllers,
} from '../controllers';

/**
 * @description
 * This is the route handler for the users
 * @author Santgurlal Singh
 * @since 7 Jan, 2021
 */

const prefix = '/api/user/';

export default (app) => {
	app.post(`${prefix}signup`, MultipartService, UserControllers.signup);
	app.get(`${prefix}verify`, UserControllers.verify);
	app.post(`${prefix}resendVerification`, UserControllers.resendVerification);
	app.post(`${prefix}login`, UserControllers.login);
	app.post(`${prefix}socialLogin`, UserControllers.socialLogin);
	app.post(`${prefix}details`, AuthenticationControllers.authenticateUser, UserControllers.details);
	app.post(`${prefix}update`, MultipartService, AuthenticationControllers.authenticateUser, UserControllers.update);
	app.get(`${prefix}password`, UserControllers.password);
	app.post(`${prefix}forgotPassword`, UserControllers.forgotPassword);
	app.post(`${prefix}contactAdmin`, AuthenticationControllers.authenticateUser, UserControllers.contactAdmin);
};
