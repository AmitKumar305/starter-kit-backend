import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { UserModel } from '../../schemas';
import { APP_NAME } from '../../constants';

/**
 * @description handles the emnail verificiation process
 * @author Abhinav Sharma
 * @since 10 March, 2021
 */

export default ({
	id,
	emailToken,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!(id && emailToken)) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing either of the required properties.' }));
		}

		const user = await UserModel.findOne({ _id: id, emailToken });

		if (!user) {
			return resolve('<h1 style="text-align: center">Invalid Access Token.</h1>');
		}
		if (user.verified) {
			return resolve('<h1 style="text-align: center">Your account is already verified.</h1>');
		}
		const updateQuery = {
			$set: {
				verified: true,
			},
			$unset:
			{
				emailToken: 1,
				emailTokenDate: 1,
			},
		};
		await UserModel.update({ _id: id }, updateQuery);
		return resolve(`<h1 style="text-align: center">Your account has been verified. You can now use ${APP_NAME} app.</h1>`);
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
