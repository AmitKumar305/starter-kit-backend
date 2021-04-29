/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
	HashUtility,
	TokenUtility,
} from 'appknit-backend-bundle';
import { AdminModel } from '../../schemas';

/**
 * @description service model function to handles the login of an admin.
 * @author Abhinav Sharma
 * @since 25 February, 2021
 */

export default ({
	email,
	password,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!(email && password)) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing property either password or email!' }));
		}
		const adminExists = await AdminModel.findOne({ email: email.toLowerCase() });
		if (!adminExists) {
			return reject(ResponseUtility.NO_USER());
		}
		const passwordMatch = await HashUtility.compare({
			text: password,
			hash: adminExists.password,
		});
		if (!passwordMatch) {
			return reject(ResponseUtility.LOGIN_AUTH_FAILED());
		}
		const token = await TokenUtility.generateToken({
			id: adminExists._id,
			email,
			tokenLife: '7d',
			role: 'admin',
		});

		return resolve(ResponseUtility.SUCCESS({
			data: {
				accessToken: token,
				user: {
					...adminExists._doc,
					password: undefined,
					createdOn: undefined,
					updatedOn: undefined,
					__v: undefined,
				},
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
