/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { AppDetailModel } from '../../schemas';

/**
* @description a common service model function to list app details.
* @author Abhinav Sharma
* @since 22 December, 2020
*/

export default ({
}) => new Promise(async (resolve, reject) => {
	try {
		const appDetails = await AppDetailModel.findOne({}, { __v: 0 });
		return resolve(ResponseUtility.SUCCESS({ data: appDetails }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
