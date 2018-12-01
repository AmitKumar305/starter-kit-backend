import {
	ResponseUtility,
	PropsValidationUtility,
	S3Services,
	SchemaMapperUtility,
} from 'appknit-backend-bundle';
import HotelModel from '../../schemas/hotel';
import RoomsModel from '../../schemas/room';
import { S3_BUCKET, NODE_ENV } from '../../constants';

const validProps = [
	'roomType',
	'roomsCount',
	'price',
	'guestsCount',
	'available',
];
/**
 * @description Service model function to handle the addition
 * of a room to a hotel
 * @author gaurav sharma
 * @since 24th October 2018
 */
export default ({
	id,
	roomId,
	roomType = 'Luxury Room',
	roomsCount,
	price,
	guestsCount,
	images = [],
	available = true,
	update = false,
}) => new Promise(async (resolve, reject) => {
	if (!update) {
		const { code, message } = await PropsValidationUtility({
			validProps,
			sourceDocument: {
				roomType,
				roomsCount,
				price,
				guestsCount,
				available,
			},
		});
		if (code !== 100) {
			return reject(ResponseUtility.GENERIC_ERR({ message }));
		}
		/**
	 * @todo handle images
	 */
		const hotelLookupQuery = { ref: id };
		const hotel = await HotelModel.findOne(hotelLookupQuery);
		if (!hotel) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Cannot add a room without a hotel. Hotel is not registered.' }));
		}
		// check if there is a room with same specs
		const roomExists = await RoomsModel.findOne({ ref: hotel._id, roomType });
		if (roomExists) {
			return reject(ResponseUtility.SUCCESS({ message: 'Room of this type already exists.' }));
		}
		// const updateImages = new Array(...roomExists.images);
		const updateImages = [];
		const uploadImagePromises = [];

		images.map(image => uploadImagePromises.push(new Promise(async (_resolve, _reject) => {
			if (updateImages.length <= 2) {
				const Key = `room_${Date.now()}`;
				const Bucket = `${S3_BUCKET}/${NODE_ENV}/rooms`;

				await S3Services.uploadToBucket({ Key, Bucket, data: image });
				updateImages.push(Key);
			}

			return _resolve();
		})));

		await Promise.all(uploadImagePromises);

		const hotelId = hotel._doc._id;
		const room = new RoomsModel({
			ref: hotelId,
			images: updateImages,
			roomType,
			roomsCount,
			price,
			guestsCount,
			available,
			timestamp: Date.now(),
		});

		await room.save();
		return resolve(ResponseUtility.SUCCESS({ data: room }));
	}
	if (!id || !roomId || !(price || guestsCount || roomType || roomsCount
		|| (images && images.length) || roomsCount)) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing either of the required properties.' }));
	}
	const roomExists = await RoomsModel.findOne({ _id: roomId });
	if (!roomExists) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Requested room does not exists.' }));
	}
	// check if hotel is created by the user
	const hotelEditable = await HotelModel.findOne({ ref: id, _id: roomExists._doc.ref });
	if (!hotelEditable) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'You cannot edit the rooms that does not belong to you.' }));
	}
	const updateImages = new Array(...roomExists.images);
	const uploadImagePromises = [];

	images.map(image => uploadImagePromises.push(new Promise(async (_resolve) => {
		if (updateImages.length <= 2) {
			const Key = `room_${Date.now()}`;
			const Bucket = `${S3_BUCKET}/${NODE_ENV}/rooms`;

			await S3Services.uploadToBucket({ Key, Bucket, data: image });
			updateImages.push(Key);
		}
		return _resolve();
	})));

	await Promise.all(uploadImagePromises);

	const lookupQuery = { _id: roomId };
	const updateQuery = await SchemaMapperUtility({
		roomType,
		roomsCount,
		price,
		guestsCount,
		images: updateImages,
		available,
	});
	const options = { upsert: false, new: true };
	const room = await RoomsModel.findOneAndUpdate(lookupQuery, updateQuery, options);
	return resolve(ResponseUtility.SUCCESS({ data: room }));
});
