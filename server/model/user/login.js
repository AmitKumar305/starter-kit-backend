/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
	HashUtility,
	TokenUtility,
} from 'appknit-backend-bundle';
import { UserModel } from '../../schemas';
import { UsersDetailsService } from '.';
import { SUCCESS_CODE } from '../../constants';
import { RedisService } from '../../services';

/**
 * @description service model function to handles the login
 * of a user.
 * @author Abhinav Sharma
 * @since 09 March, 2021
 */

export default ({
	email,
	password,
	device = '',
	fcmToken = '',
}) => new Promise(async (resolve, reject) => {
	try {
		if (!email || !password) {
			return reject(ResponseUtility.MISSING_PROPS({ message: `Missing property ${email ? 'password' : 'email'}.` }));
		}
		const checkUnique = await UserModel.findOne({ email: email.toLowerCase() });
		if (!checkUnique) {
			return reject(ResponseUtility.NO_USER());
		}

		if (!checkUnique.password || !checkUnique.verified || checkUnique.blocked || checkUnique.deleted) {
			return reject(ResponseUtility.GENERIC_ERR({
				message: `${!checkUnique.password
					? 'Kindly set the password for the email.' : `Your account has ${!checkUnique.verified
						? 'not been verified. Kindly verify the email' : `been ${checkUnique.blocked ? 'blocked' : 'deleted'}`}.`}`,
			}));
		}

		const passwordMatch = await HashUtility.compare({
			text: password,
			hash: checkUnique.password,
		});
		if (!passwordMatch) {
			return reject(ResponseUtility.LOGIN_AUTH_FAILED());
		}

		const token = await TokenUtility.generateToken({
			id: checkUnique._id,
			email,
			tokenLife: '60d',
			role: 'user',
		});

		await RedisService.set(
			checkUnique._id.toString(), JSON.stringify({ blocked: false, deleted: false }),
		);
		// update the fcmToken and device
		await UserModel.updateOne({ _id: checkUnique._id }, { fcmToken, device });
		const user = await UsersDetailsService({ id: checkUnique._id });
		if (user.code !== SUCCESS_CODE) {
			return reject(ResponseUtility.GENERIC_ERR({ message: user.message }));
		}
		return resolve(ResponseUtility.SUCCESS({
			data: {
				accessToken: token,
				user: user.data,
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
