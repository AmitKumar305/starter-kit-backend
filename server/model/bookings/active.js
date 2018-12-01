import moment from 'moment';
import { ResponseUtility } from 'appknit-backend-bundle';
import BookingsModel from '../../schemas/booking';
import { FAVOURITE_ENTITY, BOOKING_STATUS } from '../../constants';
/**
 * @description
 * this service model function represents whether there is any
 * active booking.
 * @author gaurav sharma
 * @since 10th November 2018
 */
export default ({
	id,	// my id
	entityType,
	entityId,	// instructor id
}) => new Promise(async (resolve, reject) => {
	if (!entityType || !entityId) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing either of the required propert entityType or entityId.' }));
	}
	let timelineCheck;
	const day = moment().date();
	const month = moment().month() + 1;
	const year = moment().year();
	switch (entityType) {
		case FAVOURITE_ENTITY.INSTRUCTOR:
			timelineCheck = {
				/**
				 * @todo handle this
				 */
				$or: [
					{ slots: { $elemMatch: { 'bookingDate.year': { $gt: year } } } },
					{
						$and: [
							{ slots: { $elemMatch: { 'bookingDate.month': { $gt: month } } } },
							{ slots: { $elemMatch: { 'bookingDate.year': { $gte: year } } } },
						],
					},
					{
						$and: [
							{
								slots: { $elemMatch: { 'bookingDate.day': { $gte: day } } },
							},
							{ slots: { $elemMatch: { 'bookingDate.month': { $gte: month } } } },
							{ slots: { $elemMatch: { 'bookingDate.year': { $gte: year } } } },
						],
					},
				],
			};
			break;
		case FAVOURITE_ENTITY.VENUE:
			timelineCheck = {
				bookingTimestamp: { $gte: moment(moment().format('DD-MM-YYYY'), 'DD-MM-YYYY').unix() * 1000 },
			};
			break;
		case FAVOURITE_ENTITY.HOTEL:
			timelineCheck = {
				checkoutTimestamp: { $gte: moment(moment().format('DD-MM-YYYY'), 'DD-MM-YYYY').unix() * 1000 },
			};
			break;
		default:
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid entity type.' }));
	}
	const bookingLookupQuery = {
		entityType,
		entity: id,
		ref: entityId,
		status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
		...timelineCheck,
	};
	const bookingFound = await BookingsModel.findOne(bookingLookupQuery);
	if (bookingFound) {
		return resolve({ found: true, status: bookingFound.status });
	}
	return resolve({ found: false });
});
