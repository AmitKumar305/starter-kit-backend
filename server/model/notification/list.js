/**
* @author Abhinav Sharma
* @since 10 March 2021
 */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { NotificationModel } from '../../schemas';
import { PAGINATION_LIMIT } from '../../constants';

export default ({
	id,
	limit = PAGINATION_LIMIT,
	page = 1,
}) => new Promise(async (resolve, reject) => {
	try {
		const notification = await NotificationModel.aggregate([
			{
				$match: {
					userRef: Types.ObjectId(id),
				},
			},
			{
				$sort: {
					createdOn: -1,
				},
			},
			{
				$skip: (page - 1) * limit,
			},
			{
				$limit: limit,
			},
		]);
		await NotificationModel.updateMany({ userRef: id, seen: false }, { seen: true });
		return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: notification, limit, page }));
	} catch (error) {
		return reject(ResponseUtility.GENERIC_ERR({ message: error.message, error }));
	}
});
