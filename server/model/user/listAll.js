import { ResponseUtility } from 'appknit-backend-bundle';
import UsersModel from '../../schemas/user';
import EntityModel from '../../schemas/entity';
/**
 * @description
 * service model function to list down all the users registered on the platform.
 * @author gaurav sharma
 * @since 13th November 2018
 */
export default ({
	page = 1,
	limit = 30,
}) => new Promise(async (resolve, reject) => {
	const options = { skip: limit * (page - 1) };
	const populationQuery = { path: 'userEntity', model: EntityModel };
	const users = await UsersModel.find({}, { __v: 0 }, options)
		.populate(populationQuery);
	const refactoredResponses = [];

	users.map(user => refactoredResponses.push(Object.assign({}, {
		...user._doc,
		blocked: user.$$populatedVirtuals.userEntity.blocked,
	})));
	return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: refactoredResponses, page, limit }));
});
