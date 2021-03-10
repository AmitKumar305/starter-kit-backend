/**
 * @description
 * This is the controller for the users
 * @author Abhinav Sharma
 * @since 10 March, 2021
 */

import { UserModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	signup: (req, res) => ModelResolver(req, res, UserModel.UsersSignupService),
	verify: (req, res) => {
		const { query: { id, emailToken } } = req;
		UserModel.UsersVerifyService({ id, emailToken })
			.then((sucess) => {
				res.set('Content-Type', 'text/html');
				res.send(sucess);
			})
			.catch(err => res.send(err));
	},
	resendVerification:
		(req, res) => ModelResolver(req, res, UserModel.UsersResendVerificationService),
	login: (req, res) => ModelResolver(req, res, UserModel.UsersLoginService),
	socialLogin: (req, res) => ModelResolver(req, res, UserModel.UsersSocialLoginService),
	details: (req, res) => ModelResolver(req, res, UserModel.UsersDetailsService),
	update: (req, res) => ModelResolver(req, res, UserModel.UsersUpdateService),
	password: (req, res) => {
		const { query: { id, tok } } = req;
		UserModel.UsersPasswordService({ id, tok })
			.then((success) => {
				res.set('Content-Type', 'text/html');
				res.send(success.data);
			})
			.catch(err => res.send(err));
	},
	forgotPassword: (req, res) => {
		const {
			body: {
				id,
				passToken,
				password,
			},
		} = req;
		UserModel.UsersForgotPasswordService({ 	id, passToken, password })
			.then((sucess) => {
				res.set('Content-Type', 'text/html');
				res.send(sucess.data);
			})
			.catch(err => res.send(err));
	},
	contactAdmin: (req, res) => ModelResolver(req, res, UserModel.UsersContactAdminService),
};
