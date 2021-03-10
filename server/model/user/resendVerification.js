/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
	RandomCodeUtility,
} from 'appknit-backend-bundle';
import { UserModel } from '../../schemas';
import {
	HOST,
	TOKEN_EXPIRATION_TIME,
	VERIFICATION_TYPE,
	APP_NAME,
} from '../../constants';
import { TemplateMailService } from '../../services';

/**
* @description Service model function to resend the verification code email
* in case user hasn't received it and inititates the password change request
* @author Abhinav Sharma
* @since 10 March, 2021
* @param {String} email to resend the verification email to change password
* @param {Number} requestType represent the request type@see constants to see mapping
* 1. resend verification email.
* 2. initiate the change password request.
* Both the actions will be handled at front end by the web interfaces
* the password change process will also take place via a web page.
*/
export default ({
	email,
	requestType = VERIFICATION_TYPE.CHANGE_PASSWORD,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!email) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing email required property.' }));
		}
		let updateQuery;
		const token = RandomCodeUtility(10);
		const tokenExpirationDate = new Date().getTime() + TOKEN_EXPIRATION_TIME;
		let text;
		let emailSubject;
		let verificationLink;
		const account = await UserModel.findOne({ email: email.toLowerCase(), deleted: false });
		if (!account) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No account registered with this email address.' }));
		}
		switch (requestType) {
			case VERIFICATION_TYPE.EMAIL_VERIFICATION:
				updateQuery = {
					emailToken: token,
					emailTokenDate: tokenExpirationDate,
				};
				text = 'Click on this link to verify email: ';
				emailSubject = 'Please Verify your email';
				verificationLink = `${HOST}user/verify?id=${account._id.toString()}&emailToken=${token}`;
				break;
			case VERIFICATION_TYPE.CHANGE_PASSWORD:
				if (!account.verified) {
					return reject(ResponseUtility.GENERIC_ERR({ message: 'Please verify your email id First' }));
				}
				updateQuery = {
					changePassToken: token,
					changePassTokenDate: tokenExpirationDate,
				};
				text = 'Click on this link to change your password';
				emailSubject = `Change ${APP_NAME} Password`;
				verificationLink = `${HOST}user/password?id=${account._id.toString()}&tok=${token}`;
				break;
			default:
				return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid request type.' }));
		}
		await UserModel.findOneAndUpdate({ email, deleted: false }, updateQuery);

		await TemplateMailService.VerificationMail({
			to: email,
			name: account.firstName || 'user',
			emailSubject,
			text,
			verificationLink,
			button: requestType === VERIFICATION_TYPE.CHANGE_PASSWORD ? 'Change Password' : 'Verify Email',
		});

		return resolve(ResponseUtility.SUCCESS({ message: `An email with ${requestType === VERIFICATION_TYPE.EMAIL_VERIFICATION ? 'verification' : 'change password'} link has been sent to your email id.` }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
