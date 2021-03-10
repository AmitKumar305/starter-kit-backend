/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
/* eslint-disable import/no-extraneous-dependencies */
import {
	ResponseUtility,
	TokenUtility,
	PropsValidationUtility,
	VerifyFacebookTokenService,
	RandomCodeUtility,
	S3Services,
} from 'appknit-backend-bundle';
import { UserModel } from '../../schemas';
import {
	GoogleVerificationUtility,
	AppleVerificationUtility,
} from '../../utility';
import {
	SOCIAL_IDENTIFIER, SUCCESS_CODE, NODE_ENV, S3_IMAGES,
} from '../../constants';
import { UsersDetailsService } from '.';
import { RedisService, DownloadFileService } from '../../services';

/**
 * @description service model function to handle the social
 * login of user for multiple social platforms.
 * @author Abhinav Sharma
 * @since 09 March, 2021
 */

export default ({
	name,
	email,
	device = '',
	fcmToken = '',
	socialId,
	socialToken,
	socialIdentifier,
	picture,
}) => new Promise(async (resolve, reject) => {
	try {
		const { code, message } = await PropsValidationUtility({
			validProps: ['name', 'socialId', 'socialToken', 'socialIdentifier', 'picture'],
			sourceDocument: {
				name, socialId, socialToken, socialIdentifier, picture,
			},
		});

		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}

		if (!(socialId && socialToken && socialIdentifier)) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing either of the required properties for login.' }));
		}
		if (socialIdentifier === SOCIAL_IDENTIFIER.FB) {
			const fbVerification = await VerifyFacebookTokenService({ accessToken: socialToken });
			if (fbVerification.data.id !== socialId.toString()) {
				return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid Social Id' }));
			}
		} else if (socialIdentifier === SOCIAL_IDENTIFIER.GOOGLE) {
			const googleVerification = await GoogleVerificationUtility({ accessToken: socialToken });
			if (googleVerification.data.sub !== socialId.toString()) {
				return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid Social Id' }));
			}
		} else if (socialIdentifier === SOCIAL_IDENTIFIER.APPLE) {
			const appleVerification = await AppleVerificationUtility({ accessToken: socialToken });
			if (appleVerification.data.payload.sub !== socialId.toString()) {
				return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid Social Id' }));
			}
		} else {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid Social Identifier.' }));
		}
		let userId;
		const alreadyRegistered = await UserModel.findOne({ $or: [{ socialId, socialIdentifier }, { email }] });
		if (alreadyRegistered && (alreadyRegistered.deleted || alreadyRegistered.blocked)) {
			return reject(ResponseUtility.GENERIC_ERR({ message: `User has been ${alreadyRegistered.blocked ? 'blocked' : 'deleted'}!` }));
		}
		if (!alreadyRegistered) {
			let imageName;
			if (picture) {
				imageName = `${NODE_ENV}-${Date.now()}-${RandomCodeUtility(3)}`;
				const fileContent = await DownloadFileService(picture);
				// S3Services.uploadPublicObject({
				// 	Bucket: S3_IMAGES.GLOBAL,
				// 	Key: imageName,
				// 	data: Buffer.from(fileContent),
				// });
			}
			const userObject = new UserModel({
				socialId,
				socialToken,
				socialIdentifier,
				name,
				email,
				fcmToken,
				device,
				picture: imageName,
				verified: true,
			});
			await userObject.save();
			userId = userObject._id;
		} else {
			userId = alreadyRegistered._id;
			await UserModel.updateOne({ _id: userId }, { fcmToken, device });
		}

		await RedisService.set(
			userId.toString(), JSON.stringify({ blocked: false, deleted: false }),
		);

		const token = await TokenUtility.generateToken({
			id: userId,
			email,
			tokenLife: '7d',
			role: 'user',
		});
		const user = await UsersDetailsService({ id: userId._id });
		if (user.code !== SUCCESS_CODE) {
			return reject(ResponseUtility.GENERIC_ERR({ message: user.message }));
		}
		return resolve(ResponseUtility.SUCCESS({
			data: {
				accessToken: token,
				user: user.data,
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
