import {
	ResponseUtility,
	SchemaMapperUtility,
	RandomCodeUtility,
	S3Services,
} from 'appknit-backend-bundle';
import { ProfileCompletionService } from '../../services';
import UsersModel from '../../schemas/user';
import {
	S3_BUCKET,
	NODE_ENV,
} from '../../constants';
/**
 * @description service modle function to handle the creation
 * This is a common function that could be used to create as
 * well as update the existing user.
 * of the new user. This will handle the profile completion process
 * @author gaurav sharma
 * @since 25th October 2018
 *
 * @todo handle the twilio OTP process
 */
export default ({
	id,
	phoneCode,
	phoneNumber,
	day,
	month,
	year,
	gender,
	sportsType,
	sportsExperience,
	nationality,
	languages,
	about,
	picture,
}) => new Promise(async (resolve, reject) => {
	if (!id || !(phoneCode || phoneNumber || day || month ||
		year || gender || sportsType || sportsExperience || nationality ||
		about || picture || languages)) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing either of the required properties.' }));
	}
	const lookupQuery = { ref: id };
	const verificationCode = (phoneCode && phoneNumber) ? RandomCodeUtility(6) : undefined;
	/**
	 * @todo process sending the verification code via twilio
	 */
	try {
		const pictureName = picture ? `profile_${Date.now()}` :  undefined;
		if (pictureName) {
			const Bucket = `${S3_BUCKET}/${NODE_ENV}/profile`;
			const Key = pictureName;

			await S3Services.uploadToBucket({ Key, Bucket, data: picture });
		}

		const updateQuery = await SchemaMapperUtility({
			ref: id,
			picture: pictureName,
			mobile: verificationCode ? {
				code: phoneCode,
				number: phoneNumber,
			} : undefined,
			dob: (day && month && year) ? {
				day, month, year,
			} : undefined,
			verification: verificationCode ? {
				isVerified: false,
				verificationCode,
				verificationCodeTimestamp: Date.now(),
				retryAttempt: 0,
			} : undefined,
			gender,
			sportsType,
			sportsExperience,
			nationality,
			about,
			languages,
			lastUpdated: Date.now(),
		});

		const updated = await UsersModel.findOneAndUpdate(lookupQuery, updateQuery, { upsert: true, new: true });
		const completion = ProfileCompletionService({
			sportsType: updated.sportsType,
			sportsExperience: updated.sportsExperience,
			day: updated.dob.day,
			month: updated.dob.month,
			year: updated.dob.year,
			gender: updated.gender,
			languages: updated.languages,
			nationality: updated.nationality,
			about: updated.about,
			picture: updated.picture,
			country: updated.country,
		});

		await UsersModel.update({ ...lookupQuery, profileCompletion: { $ne: completion } }, { profileCompletion: completion });
		return resolve(ResponseUtility.SUCCESS());
	} catch (err) {
		return resolve(ResponseUtility.SUCCESS());
	}
});
