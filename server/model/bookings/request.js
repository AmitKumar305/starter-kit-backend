import moment from 'moment';
import {
	PropsValidationUtility,
	ResponseUtility,
} from 'appknit-backend-bundle';
import BookingsModel from '../../schemas/booking';
import InstructorModel from '../../schemas/instructor';
import VenueModel from '../../schemas/venue';
import RoomsModel from '../../schemas/room';
import { FAVOURITE_ENTITY, BOOKING_STATUS } from '../../constants';

const validProps = ['ref', 'entityType'];
/**
 * @description
 * Service model function to request for booking an instructor
 * @author gaurav sharma
 * @since 9th November 2018
 */
export default ({
	id,
	ref,
	entityType,
	// bookingType,
	slots,
	bookingDay,
	bookingMonth,
	bookingYear,
	checkoutDay,
	checkoutMonth,
	checkoutYear,
	roomsRef,
}) => new Promise(async (resolve, reject) => {
	const { code, message } = await PropsValidationUtility({
		validProps,
		sourceDocument: { ref, entityType },
	});
	if (code !== 100) {
		return reject(ResponseUtility.MISSING_PROPS({ message }));
	}
	let bookingObject;
	let lookupModel;
	let lookupQuery;

	// check if booking already exists
	const booking = await BookingsModel.findOne({
		entityType,
		ref,
		entity: id,
		status: BOOKING_STATUS.PENDING,
	});
	if (booking) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Booking already exists. Cannot send multiple booking requests.' }));
	}
	switch (entityType) {
		case FAVOURITE_ENTITY.INSTRUCTOR:
			if (!(slots)) {
				return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required "slots" or "bookingType" property.' }));
			}
			lookupModel = InstructorModel;
			lookupQuery = { _id: ref };
			bookingObject = new BookingsModel({
				ref,
				entityType,
				entity: id,
				slots,
				status: BOOKING_STATUS.PENDING,
			});
			break;
		case FAVOURITE_ENTITY.HOTEL:
			if (!(bookingDay && bookingMonth && bookingYear && checkoutDay
				&& checkoutMonth && checkoutYear && roomsRef)) {
				return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required check in, checkout dates or roomsRef.' }));
			}
			lookupModel = RoomsModel;
			lookupQuery = { _id: roomsRef, ref };
			bookingObject = new BookingsModel({
				ref,
				entityType,
				entity: id,
				bookingDate: {
					day: bookingDay,
					month: bookingMonth,
					year: bookingYear,
				},
				bookingTimestamp: moment(`${bookingDay}-${bookingMonth}-${bookingYear}`, 'DD-MM-YYYY').unix() * 1000,
				checkoutDate: {
					day: checkoutDay,
					month: checkoutMonth,
					year: checkoutYear,
				},
				checkoutTimestamp: moment(`${checkoutDay}-${checkoutMonth}-${checkoutYear}`, 'DD-MM-YYYY').unix() * 1000,
				roomsRef,
				status: BOOKING_STATUS.PENDING,
			});
			break;
		case FAVOURITE_ENTITY.VENUE:
			if (!(bookingDay && bookingMonth && bookingYear)) {
				return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required booking date.' }));
			}
			lookupModel = VenueModel;
			lookupQuery = { _id: ref };
			bookingObject = new BookingsModel({
				ref,
				entityType,
				entity: id,
				bookingDate: {
					day: bookingDay,
					month: bookingMonth,
					year: bookingYear,
				},
				bookingTimestamp: moment(`${bookingDay}-${bookingMonth}-${bookingYear}`, 'DD-MM-YYYY').unix() * 1000,
				status: BOOKING_STATUS.PENDING,
			});
			break;
		default:
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid entity type.' }));
	}

	/**
	 * @todo check the entity exitence using lookupModel and lookupQuery
	 */
	const entityExists = await lookupModel.findOne(lookupQuery);
	if (!entityExists) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Requested entity not found.' }));
	}
	await bookingObject.save();
	return resolve(ResponseUtility.SUCCESS());
});
