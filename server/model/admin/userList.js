import { ResponseUtility } from 'appknit-backend-bundle';
import { UserModel } from '../../schemas';
import { PAGINATION_LIMIT } from '../../constants';
import { delete } from 'request-promise';

/**
* @description service model function to fetch the listing of the users
* @author Abhinav Sharma
* @since 10 March, 2021
*/

export default ({
	text = '',
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		const andQuery = [
			{ deleted: false }
		];

		if(text) {
			andQuery.push(
				{ email: new RegExp(text, 'i') },
				{ name: new RegExp(text, 'i') },
			)
		};
		
		const [data] = await UserModel.aggregate([
			{
				$and: andQuery,
			},
			{
				$unset: [
					'password',
					'device',
					'fcmToken',
					'emailToken',
					'emailTokenDate',
					'socialId',
					'socialToken',
					'socialIdentifier',
					'changePassToken',
					'changePassTokenDate',
				],
			},
			{
				$sort: {
					createdOn: -1,
				},
			},
			{
				$facet: {
					list: [
						{
							$skip: (page - 1) * limit,
						},
						{
							$limit: limit,
						},
					],
					total: [
						{
							$count: 'count',
						},
					],
				},
			},
			{
				$unwind: '$total',
			},
		]);
		return resolve(ResponseUtility.SUCCESS({
			data: {
				list: ((data || {}).list || []),
				page,
				limit,
				total: (((data || {}).total || {}).count || 0),
				size: ((data || {}).list || []).length,
				hasMore: ((data || {}).list || []).length === limit,
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
