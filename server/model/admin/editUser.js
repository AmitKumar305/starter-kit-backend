/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import {
	UserModel,
} from '../../schemas';
import { ADMIN_USER_ACTIONS } from '../../constants';

/**
* @description service model function to handle edition of user.
* @author Abhinav Sharma
* @since 10 March 2021
*/

export default ({
	userRef,
	action,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!(userRef && action)) {
			return reject(ResponseUtility.MISSING_PROPS({ message: `Missing Property ${userRef ? 'action' : 'userRef'}` }));
		}
		if (!Object.keys(ADMIN_USER_ACTIONS)[action - 1]) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid action provided!' }));
		}
		await UserModel.updateOne({ _id: userRef }, action === ADMIN_USER_ACTIONS.DELETED ? { deleted: true }
			: (action === ADMIN_USER_ACTIONS.BLOCKED ? { blocked: true } : (action === ADMIN_USER_ACTIONS.UNBLOCKED
				? { blocked: false } : { verified: true })));
		return resolve(ResponseUtility.SUCCESS({ message: `User has been successfully ${Object.keys(ADMIN_USER_ACTIONS)[action - 1].toLowerCase()}` }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
