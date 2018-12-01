import { ResponseUtility } from 'appknit-backend-bundle';
import EntityModel from '../../schemas/entity';
/**
 * @description
 * Service model function to handle the toggle betweeen the blocking a user
 * from login
 * @author gaurav sharma
 * @since 13th November 2018
 */
export default ({ entityId, block = false }) => new Promise(async (resolve, reject) => {
	if (!entityId) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property entityId.' }));
	}
	const lookupQuery = { _id: entityId, blocked: block ? false : true };
	const updateQuery = { blocked: block };
	await EntityModel.update(lookupQuery, updateQuery);
	return resolve(ResponseUtility.SUCCESS());
});
