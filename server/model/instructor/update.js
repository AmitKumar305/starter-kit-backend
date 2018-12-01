import {
	ResponseUtility,
	SchemaMapperUtility,
	S3Services,
} from 'appknit-backend-bundle';
import InstructorModel from '../../schemas/instructor';
import { S3_BUCKET, NODE_ENV } from '../../constants';
/**
 * @description
 * This is the service model function to update the instructor
 * details. It requires the entity id of the user.
 * @author gaurav sharma
 * @since 23rd October 2018
 *
 * @todo handle images after configuring s3
 */
export default ({
	id,
	sportsType,
	businessType,
	gender,
	languages,
	day,
	month,
	year,
	coachingExperience,
	educationLevel,
	major,
	institute,
	certificateName,
	about,
	hourlyPricing,
	halfDayPricing,
	fullDayPricing,
	seasonalPricing,
	slope,
	minStudentAge,
	maxStudentAge,
	certification,
	location,
	images = [],
}) => new Promise(async (resolve, reject) => {
	if (!id && !(sportsType || businessType || gender || languages
		|| (day && month && year) || coachingExperience || educationLevel || major
		|| institute || about || hourlyPricing || halfDayPricing
		|| fullDayPricing || seasonalPricing || slope || minStudentAge
		|| maxStudentAge || location || certificateName || certification)) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing either of the required property.' }));
	}
	const lookupQuery = { ref: id };
	const instructorExists = await InstructorModel.findOne(lookupQuery);
	if (!instructorExists) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Instructor does not exists.' }));
	}
	const updateImages = instructorExists._doc.images ? new Array(...instructorExists._doc.images) : [];
	const uploadImagePromises = [];
	images.map(image => uploadImagePromises.push(new Promise(async (_resolve) => {
		const Key = `instructor_${Date.now()}`;
		const Bucket = `${S3_BUCKET}/${NODE_ENV}/profile`;

		await S3Services.uploadToBucket({ Key, Bucket, data: image });
		updateImages.push(Key);

		return _resolve();
	})));
	await Promise.all(uploadImagePromises);
	try {
		const updateQuery = await SchemaMapperUtility({
			sportsType,
			businessType,
			gender,
			images: updateImages,
			languages,
			dob: (day && month && year) ? { day, month, year } : undefined,
			coachingExperience,
			educationLevel,
			major,
			institute,
			slopes: slope,
			about,
			certificateName,
			pricing: (hourlyPricing && halfDayPricing && fullDayPricing && seasonalPricing) ? {
				hourly: hourlyPricing,
				halfDay: halfDayPricing,
				fullDay: fullDayPricing,
				seasonal: seasonalPricing,
			} : undefined,
			studentPreferredAge: (minStudentAge && maxStudentAge) ? {
				from: minStudentAge,
				to: maxStudentAge,
			} : undefined,
			certification,
			// useLocation,
			location,
			lastUpdated: Date.now(),
		});
		const instructor = await InstructorModel.findOneAndUpdate(
			lookupQuery,
			updateQuery,
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({ data: instructor }));
	} catch (err) {
		return resolve(ResponseUtility.SUCCESS());
	}
});
