import { ResponseUtility } from 'appknit-backend-bundle';
import ReviewsModel from '../../schemas/reviews';
import UsersModel from '../../schemas/user';
import { PAGINATION_LIMIT } from '../../constants';
/**
 * @description
 * listing the reviews for entities
 * @author gaurav sharma
 * @since 10th November 2018
 */
export default ({
	id,
	entityRef,
	page = 1,
	limit = Number(PAGINATION_LIMIT) || 30,
}) => new Promise(async (resolve, reject) => {
	if (!entityRef) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property entityRef.' }));
	}
	const options = { skip: limit * (page - 1), sort: { timestamp: -1 }, limit };
	const lookupQuery = { ref: entityRef };
	const populationQuery = { path: 'user', model: UsersModel, select: 'name ref picture' };

	const reviews = await ReviewsModel.find(lookupQuery, { __v: 0 }, options)
		.populate(populationQuery);
	const refactoredResponses = [];
	reviews.map(review => refactoredResponses.push(Object.assign({}, { ...review._doc })));
	return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: refactoredResponses, page, limit }));
});
