/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility, S3Services, RandomCodeUtility, SchemaMapperUtility,
} from 'appknit-backend-bundle';
import { UserModel } from '../../schemas';
import { NODE_ENV, S3_IMAGES, SUCCESS_CODE } from '../../constants';
import { UsersDetailsService } from '.';

/**
 * @description service model function to handles the
 * updation of an user.
 * @author Abhinav Sharma
 * @since 10 March, 2021
 */

export default ({
	id,
	name,
	picture,
	phoneCode,
	phoneNumber,
	dob,
	gender,
	nationality,
	about,
}) => new Promise(async (resolve, reject) => {
	try {
		let imageName;
		if (picture) {
			imageName = `${NODE_ENV}-${Date.now()}-${RandomCodeUtility(3)}`;
			// S3Services.uploadPublicObject({
			// 	Bucket: S3_IMAGES.GLOBAL,
			// 	Key: imageName,
			// 	data: Buffer.from(picture.data),
			// });
		}

		const updateQuery = await SchemaMapperUtility({
			name,
			picture: imageName,
			phoneCode,
			phoneNumber,
			dob: dob ? new Date(dob) : undefined,
			gender,
			nationality,
			about,
		});
		await UserModel.updateOne({ _id: id }, updateQuery);
		const user = await UsersDetailsService({ id });
		if (user.code !== SUCCESS_CODE) {
			return reject(ResponseUtility.GENERIC_ERR({ message: user.message }));
		}
		return resolve(ResponseUtility.SUCCESS({ data: user.data }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
