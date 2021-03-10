/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { UserModel } from '../../schemas';
import { CONTACT_US_EMAIL, APP_NAME } from '../../constants';
import { TemplateMailService } from '../../services';
/**
* @description service model function to handle contact admin.
* @author Abhinav Sharma
* @since 10 March, 2021
*/

export default ({
	id,
	message = '',
}) => new Promise(async (resolve, reject) => {
	try {
		if (!message) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing Property message!' }));
		}
		const user = await UserModel.findOne({ _id: id });
		if (!user.email) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Kindly add an email so that we can get back to you!' }));
		}
		await TemplateMailService.VerificationMail({
			to: CONTACT_US_EMAIL,
			name: 'Admin',
			emailSubject: `${APP_NAME} Query`,
			text: message.trim(),
			senderName: user.name || 'User',
			senderEmail: user.email,
		});
		return resolve(ResponseUtility.SUCCESS({ message: 'Your query has been submitted!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
