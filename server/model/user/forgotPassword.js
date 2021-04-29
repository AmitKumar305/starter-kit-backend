import {
	ResponseUtility,
	HashUtility,
} from 'appknit-backend-bundle';

import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { UserModel } from '../../schemas';
import { APP_LOGO_URL, APP_NAME } from '../../constants';
/**
 * @description
 * A Service model function to handle change password of a user.
 * @author Abhinav Sharma
 * @since 10 March, 2021
 */

export default ({
	id,
	passToken,
	password,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!(id && passToken && password)) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Some required property missing!' }));
		}
		const user = await UserModel.findOne({ _id: id, changePassToken: passToken });
		const dateNow = new Date().getTime();
		if (!user || user.changePassTokenDate < dateNow) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid Access Token!' }));
		}
		const updateQuery = {
			$set: {
				password: await HashUtility.generate({ text: password }),
			},
			$unset:
			{
				changePassToken: 1,
				changePassTokenDate: 1,
			},
		};
		await UserModel.updateOne({ _id: id }, updateQuery);
		const html = fs.readFileSync(path.resolve(__dirname, '../../services/templates', 'verification.html'), { encoding: 'utf-8' });
		const template = handlebars.compile(html)({
			text: `Your ${APP_NAME} account password has been updated successfully.`,
			logoURL: APP_LOGO_URL,
			appName: APP_NAME,
		});

		return resolve(ResponseUtility.SUCCESS({
			message: 'template',
			data: template,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
