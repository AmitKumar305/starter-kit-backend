import {
	ResponseUtility,
	SchemaMapperUtility,
	S3Services,
	PropsValidationUtility,
} from 'appknit-backend-bundle';
import HotelModel from '../../schemas/hotel';
import {
	S3_BUCKET,
	NODE_ENV,
	ACCOMODATION_TYPE,
} from '../../constants';
const validProps = [
	'name',
	'description',
	'hotelType',
	'budgetFrom',
	'budgetTo',
	'location',
	'coordinates',
];
/**
 * @description Service Model function to create an
 * @author gaurav sharma
 * @since 23rd October
 */
export default ({
	id,
	name,
	description,
	hotelType = ACCOMODATION_TYPE.HOTEL,
	budgetFrom = 0,
	budgetTo = 10000,
	location,
	coordinates,
	update = false, // injected via PropsInjectionService
	images = [],	// one image at a time
}) => new Promise(async (resolve, reject) => {
	if (!update) {
		const { code, message } = await PropsValidationUtility({
			validProps,
			sourceDocument: {
				name,
				description,
				hotelType,
				budgetFrom,
				budgetTo,
				location,
				coordinates,
			},
		});
		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}

		// check if there is a hotel already registered.
		const hotel = await HotelModel.findOne({ ref: id });
		if (hotel) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Hotel already exists. Cannot create multiple hotels.' }));
		}

		const updateImages = [];
		const uploadImagePromises = [];
		images.map(image => uploadImagePromises.push(new Promise(async (_resolve) => {
			const Key = `hotel_${Date.now()}`;
			const Bucket = `${S3_BUCKET}/${NODE_ENV}/hotels`;
			await S3Services.uploadToBucket({ Key, Bucket, data: image });
			updateImages.push(Key);

			return _resolve();
		})));

		await Promise.all(uploadImagePromises);
		const hotelObject = new HotelModel({
			name,
			ref: id,
			description,
			hotelType,
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
			images: updateImages,
			averageRating: 0,
		});

		await hotelObject.save();
		return resolve(ResponseUtility.SUCCESS({ data: hotelObject }));
	}
	if (!id || !(name || description || hotelType
		|| budgetFrom || budgetTo || location || coordinates
		|| images)) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing either of the required properties.' }));
	}
	// hotel must exist to update
	const hotelExists = await HotelModel.findOne({ ref: id });
	if (!hotelExists) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Cannot update a hotel that does not exists.' }));
	}
	const updateImages = new Array(...hotelExists.images);
	const uploadImagePromises = [];
	images.map(image => uploadImagePromises.push(new Promise(async (_resolve) => {
		const Key = `hotel_${Date.now()}`;
		const Bucket = `${S3_BUCKET}/${NODE_ENV}/hotels`;
		await S3Services.uploadToBucket({ Key, Bucket, data: image });
		updateImages.push(Key);

		return _resolve();
	})));

	await Promise.all(uploadImagePromises);
	/**
	 * @todo handle images
	 */
	const lookupQuery = { ref: id };
	const updateQuery = await SchemaMapperUtility({
		name,
		ref: id,
		images: updateImages,
		description,
		hotelType,
		budget: (budgetFrom !== undefined && budgetTo !== undefined) ? {
			from: budgetFrom,
			to: budgetTo,
		} : undefined,
		address: (location && coordinates) ? {
			location,
			coordinates: [coordinates[1], coordinates[0]],
			type: 'Point',
		} : undefined,
		timestamp: Date.now(),
		averageRating: 0,
	});
	const options = { upsert: true, new: true };
	const hotel = await HotelModel.findOneAndUpdate(lookupQuery, updateQuery, options);
	return resolve(ResponseUtility.SUCCESS({ data: hotel }));
});
