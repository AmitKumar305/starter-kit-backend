import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { AdminModel } from '../../schemas';
import { SECRET_STRING } from '../../constants';

/**
 * @description service model function to handles the signup of an admin.
 * @author Abhinav Sharma
 * @since 25 February, 2021
 */

export default ({
	email,
	password,
	secretKey,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!(email && password && secretKey)) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing Property either email or password or secretKey!' }));
		}

		const emailExists = await AdminModel.findOne({ email: email.toLowerCase() });
		if (emailExists) {
			return reject(ResponseUtility.GENERIC_ERR({ message: `Email ${email} is already registered!` }));
		}

		if (secretKey !== SECRET_STRING) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid Authorization.' }));
		}

		const admin = new AdminModel({
			email,
			password,
		});
		await admin.save();
		return resolve(ResponseUtility.SUCCESS({ message: 'Admin has signed up successfully!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
