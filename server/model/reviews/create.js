import moment from 'moment';
import {
	ResponseUtility,
	PropsValidationUtility,
	SchemaMapperUtility,
} from 'appknit-backend-bundle';
import ReviewsModel from '../../schemas/reviews';
import BookingsModel from '../../schemas/booking';
import InstructorModel from '../../schemas/instructor';
import VenueModel from '../../schemas/venue';
import HotelModel from '../../schemas/hotel';
import { FAVOURITE_ENTITY, BOOKING_STATUS } from '../../constants';

const validProps = ['ref', 'rating', 'review'];
/**
 * @description
 * service model function to handle the reate review functonality for instructor,
 * venue and hotle rooms
 * @author gaurav sharma
 * @since 10th November 2018
 *
 * @param {String} id
 * @param {String} ref the reference to the booking. Booking schema contains all
 * the details about the entityType and references.
 * @param {Number} rating the rating given by the user.
 * @param {String} review the review given by user.
 */
export default ({
	id,
	ref,
	rating,
	review,
}) => new Promise(async (resolve, reject) => {
	const { code, message } = await PropsValidationUtility({
		validProps,
		sourceDocument: {
			ref,
			rating,
			review,
		},
	});
	if (code !== 100) {
		return reject(ResponseUtility.MISSING_PROPS({ message }));
	}
	// check if booking exists and is confirmed.
	// check if the booking exists and is made for the user.
	const lookupBooking = { _id: ref, entity: id };
	const booking = await BookingsModel.findOne(lookupBooking);
	if (!booking) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Requested booking not found.' }));
	}
	if (booking.status !== BOOKING_STATUS.CONFIRMED) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Cannot review the booking that are still pending or declined.' }));
	}
	/**
	 * good to go..
	 */
	const { _doc: { entityType, roomsRef } } = booking;
	const entityRef = booking._doc.ref;

	// check if reviwe alreadt exists
	const alreadyReviewLookup = { ref: entityRef, entity: id };
	const alreadyReviewed = await ReviewsModel.findOne(alreadyReviewLookup);
	if (alreadyReviewed) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Booking already reviewed.' }));
	}

	const mapping = await SchemaMapperUtility({
		entityType,
		ref: entityRef,
		entity: id,
		roomsRef,
		rating,
		review,
		reviewedOn: {
			day: moment().date(),
			month: moment().month() + 1,
			year: moment().year(),
		},
		timestamp: Date.now(),
	});
	const reviewObject = new ReviewsModel(mapping);
	let entityModel;
	let existsLookup;

	switch (entityType) {
		case FAVOURITE_ENTITY.INSTRUCTOR:
			entityModel = InstructorModel;
			existsLookup = { _id: entityRef };
			break;
		case FAVOURITE_ENTITY.VENUE:
			entityModel = VenueModel;
			existsLookup = { _id: entityRef };
			break;
		case FAVOURITE_ENTITY.HOTEL:
			entityModel = HotelModel;
			existsLookup = { _id: entityRef };
			break;
		default:
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid entity type.' }));
	}
	// check if entity exists
	const entityExists = await entityModel.findOne(existsLookup);
	if (!entityExists) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Requested entity does not exists.' }));
	}
	await reviewObject.save();
	/**
	 * @todo process to update the avergae rating.
	 */
	// considering the hotel review for now rather than the room wise.
	const { _doc: { averageRating = 0 } } = entityExists;
	const updatedRating = (averageRating + rating) / 2;
	const entity = await entityModel.update(existsLookup, { averageRating: updatedRating });
	return resolve(ResponseUtility.SUCCESS({ data: entity }));
});
