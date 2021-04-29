/**
 * @description
 * This is the controller for the admin
 * @author Santgurlal Singh
 * @since 12 Jan, 2021
 */

import { AdminModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	signup: (req, res) => ModelResolver(req, res, AdminModel.Signup),
	login: (req, res) => ModelResolver(req, res, AdminModel.Login),
	dashboard: (req, res) => ModelResolver(req, res, AdminModel.Dashboard),
	userList: (req, res) => ModelResolver(req, res, AdminModel.UserList),
	editUser: (req, res) => ModelResolver(req, res, AdminModel.EditUser),
};
