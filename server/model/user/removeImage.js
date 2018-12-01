import { ResponseUtility, S3Services } from 'appknit-backend-bundle';
import {
	FAVOURITE_ENTITY,
	S3_BUCKET,
	NODE_ENV,
} from '../../constants';
import InstructorModel from '../../schemas/instructor';
import HotelModel from '../../schemas/hotel';
import VenueModel from '../../schemas/venue';
import RoomsModel from '../../schemas/room';
import EventsModel from '../../schemas/events';
/**
 * @description service model function to deal with the removing
 * of images from the database as well as S3 bucket.
 * @author gaurav sharma
 * @since 24th November 2018
 *
 * @param {String} id to be injected by the authentication middleware
 * @param {String} entityId the referece to the entity. It could be
 * venueId, hotelId, instructor id, room id or venue id.
 * @param {String} entityType represents the entity type i.e. it could be
 * venue, hotel, instructor, event or room. @see mappings for more details
 * @param {String} imageRef the image identifier to remove from database as well
 * as S3.
 */
export default ({
	id,
	entityId, // _id of the entity to remove image
	entityType,	// to be used to decide the model. Can derive the path from it
	imageRef,	// define the image id to remove
}) => new Promise(async (resolve, reject) => {
	try {
		if (!(entityType && imageRef)) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property entityType and imageRef.' }));
		}
		let lookupModel;
		let path;
		switch (entityType) {
			case FAVOURITE_ENTITY.INSTRUCTOR:
				lookupModel = InstructorModel;
				path = 'profile';
				break;
			case FAVOURITE_ENTITY.HOTEL:
				lookupModel = HotelModel;
				path = 'hotels';
				break;
			case FAVOURITE_ENTITY.VENUE:
				lookupModel = VenueModel;
				path = 'venue';
				break;
			case FAVOURITE_ENTITY.ROOM:
				lookupModel = RoomsModel;
				path = 'rooms';
				break;
			case FAVOURITE_ENTITY.EVENT:
				lookupModel = EventsModel;
				path = 'events';
				break;
			default:
				return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid entityType.' }));
		}
		// check if entity exists and the image also exists in the collection
		const lookupQuery = { _id: entityId, ref: id, images: { $in: [imageRef] } };
		const entity = await lookupModel.findOne(lookupQuery);
		if (entity) {
			const { _doc: { images } } = entity;
			// remove refs from the database;
			const image = images.find(item => item === imageRef);
			if (image) {
				const imageIndex = images.indexOf(image);
				entity.images.splice(imageIndex, 1);
			}
			await lookupModel.update({ _id: entityId }, { images });
		}

		// remove from S3
		const Bucket = `${S3_BUCKET}/${NODE_ENV}/${path}`;
		const Key = `${imageRef}`;
		await S3Services.removeFile({ Bucket, Key });
		return resolve(ResponseUtility.SUCCESS());
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'There was some error.', error: err }));
	}
});
