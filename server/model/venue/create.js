import {
	ResponseUtility,
	SchemaMapperUtility,
	PropsValidationUtility,
	S3Services,
} from 'appknit-backend-bundle';
import VenueModel from '../../schemas/venue';
import {
	S3_BUCKET,
	NODE_ENV,
	CLUB_TYPE,
	MUSIC_TYPE,
} from '../../constants';

const validProps = [
	'name',
	'description',
	'venueType',
	'musicType',
	'isDancingAvailable',
	'budgetFrom',
	'budgetTo',
	'coordinates',
	'location',
];
/**
 * @description Adding a venue functionality.
 * Each user can create only one venue.
 * @author gaurav sharma
 * @since 23rd October 2018
 *
 * @todo handle the images upload functionality after setting up s3
 */
export default ({
	id, // the entity id to be derived from the authnetication token
	name,
	description,
	venueType = CLUB_TYPE.BAR,
	musicType = MUSIC_TYPE.TECHNO_ELECTRONIC,
	isDancingAvailable = true,
	budgetFrom = 0,
	budgetTo = 10000,
	coordinates,
	location,
	update = false, // innjected via middleware for update
	images = [],
}) => new Promise(async (resolve, reject) => {
	if (!update) {
		const { code, message } = await PropsValidationUtility({
			validProps,
			sourceDocument: {
				name,
				description,
				venueType,
				isDancingAvailable,
				budgetFrom,
				budgetTo,
				musicType,
				coordinates,
				location,
			},
		});
		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}
	} else if (!id || !(name || description || venueType || musicType || isDancingAvailable ||
		budgetFrom || budgetTo || coordinates || location || images)) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing either of the required properties.'}));
	}
	// check if venue exists.
	const venue = await VenueModel.findOne({ ref: id });
	if (update && !venue) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Venue not found.' }));
	}

	const updateImages = update ? new Array(...venue.images) : [];
	const uploadImagePromises = [];
	images.map(image => uploadImagePromises.push(new Promise(async (_resolve, _reject) => {
		const Key = `venue_${Date.now()}`;
		const Bucket = `${S3_BUCKET}/${NODE_ENV}/venue`;

		await S3Services.uploadToBucket({ Key, Bucket, data: image });
		updateImages.push(Key);

		return _resolve();
	})));

	await Promise.all(uploadImagePromises);

	const lookupQuery = { ref: id };
	const updateQuery = await SchemaMapperUtility({
		name,
		images: updateImages,
		ref: id,
		description,
		venueType,
		musicType,
		isDancingAvailable,
		budget: (budgetFrom && budgetTo) ? {
			from: budgetFrom,
			to: budgetTo,
		} : undefined,
		address: (location && coordinates) ? {
			location,
			type: 'Point',
			coordinates: [coordinates[1], coordinates[0]],
		} : undefined,
		timestamp: Date.now(),
	});
	const options = { upsert: update ? false : true, new: true };
	const newVenueObject = await VenueModel.findOneAndUpdate(lookupQuery, updateQuery, options);
	return resolve(ResponseUtility.SUCCESS({ data: newVenueObject }));
});
