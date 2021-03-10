/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import {
	UserModel,
} from '../../schemas';
import { TYPE_OF_NOTIFICATIONS } from '../../constants';
import { FirebaseNotificationService } from '../../services';

/**
* @description A service model function to publish a notification in system.
* @author Abhinav Sharma
* @since 10 March 2021
*/

export default ({
	message,
	userIds = [],
}) => new Promise(async (resolve, reject) => {
	try {
		if (!message) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing property message' }));
		}

		const lookupQuery = {
			deleted: false, blocked: false, fcmToken: { $ne: '' || null }, device: { $ne: '' || null },
		};
		if (userIds.length) {
			lookupQuery._id = { $in: userIds.map(id => Types.ObjectId(id)) };
		}
		const userList = (await UserModel.find(lookupQuery) || []).map(user => user.fcmToken);
		if (!userList.length) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No valid users present for notifications' }));
		}
		await FirebaseNotificationService({
			deviceTokens: userList,
			payload: {
				type: TYPE_OF_NOTIFICATIONS.ADMIN,
			},
			body: message,
		});

		return resolve(ResponseUtility.SUCCESS({ message: 'All Notifications were sent successfully' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ error: err, message: err.message }));
	}
});
