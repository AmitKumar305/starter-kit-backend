/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { UserModel } from '../../schemas';
import {
	USER_TYPE,
} from '../../constants';

/**
* @description service model function to handle the dashboard of admin panel.
* @author Abhinav Sharma
* @since 25 February, 2021
*/

export default ({

}) => new Promise(async (resolve, reject) => {
	try {
		const [data] = await UserModel.aggregate([
			{
				$group: {
					_id: null,
					total: { $sum: { $cond: ['$_id', 1, 0] } },
					active: { $sum: { $cond: [{ $eq: ['$deleted', false] }, 1, 0] } },
					blocked: { $sum: { $cond: [{ $and: [{ $eq: ['$deleted', false] }, { $eq: ['$blocked', true] }] }, 1, 0] } },
					deleted: { $sum: { $cond: [{ $eq: ['$deleted', true] }, 1, 0] } },
				},
			},
			{
				$unset: ['_id'],
			},
		]);
		return resolve(ResponseUtility.SUCCESS({ data }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
