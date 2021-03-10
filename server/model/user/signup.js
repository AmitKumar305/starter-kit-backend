import {
	ResponseUtility,
	RandomCodeUtility,
	PropsValidationUtility,
	TokenUtility,
	S3Services,
} from 'appknit-backend-bundle';
import UserModel from '../../schemas/user';
import {
	HOST,
	S3_IMAGES,
	NODE_ENV,
	APP_NAME,
	SUCCESS_CODE,
} from '../../constants';
import { TemplateMailService } from '../../services';
import { UsersDetailsService } from '.';

/**
 * @description service model function to handles the signup
 * of a user.
 * @author Abhinav Sharma
 * @since 09 March, 2021
 */

export default ({
	name,
	email,
	picture,
	password,
	device = '',
	fcmToken = '',
}) => new Promise(async (resolve, reject) => {
	try {
		const { code, message } = await PropsValidationUtility({
			validProps: ['name', 'email', 'password', 'picture'],
			sourceDocument: {
				name, email, password, picture,
			},
		});

		if (code !== SUCCESS_CODE) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}

		// eslint-disable-next-line no-param-reassign
		email = email.toLowerCase();
		const emailExists = await UserModel.findOne({ email });
		if (emailExists) {
			return reject(ResponseUtility.GENERIC_ERR({ message: `Email ${email} is already registered.` }));
		}
		let pictureName;
		if (picture) {
			pictureName = `${NODE_ENV}-image-${Date.now()}-${RandomCodeUtility(3)}`;
			// S3Services.uploadPublicObject({
			// 	Bucket: S3_IMAGES.GLOBAL,
			// 	Key: pictureName,
			// 	data: Buffer.from(picture.data),
			// });
		}

		const userObject = new UserModel({
			name,
			email,
			password,
			profilePicture: pictureName,
			device,
			fcmToken,
			emailToken: RandomCodeUtility(10),
			emailTokenDate: new Date(),
		});

		await TemplateMailService.VerificationMail({
			to: email,
			name,
			emailSubject: 'Please verify your email.',
			text: `Congrats on signing up for ${APP_NAME}. In order to activate your account, please click the button below to verify your email address!`,
			button: 'Verify your email',
			verificationLink: `${HOST}user/verify?id=${userObject._id}&emailToken=${userObject.emailToken}`,
		});
		await userObject.save();

		const token = await TokenUtility.generateToken({
			// eslint-disable-next-line no-underscore-dangle
			id: userObject._id,
			email,
			tokenLife: '100d',
			role: 'user',
		});
		const user = await UsersDetailsService({ id: userObject._id });
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
