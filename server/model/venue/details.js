import { ResponseUtility } from 'appknit-backend-bundle';
import VenueModel from '../../schemas/venue';
import { BookingsModel } from '..';
import { EventsListService } from '../events';
import { FAVOURITE_ENTITY } from '../../constants';
/**
 * @description service model function to fetch the venue details.
 * @author gaurav sharma
 * @since 24th October 2018
 */
export default ({
	id,
	venueId,
}) => new Promise(async (resolve, reject) => {
	// if (!venueId) {
	// 	return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property venueId.' }));
	// }
	const lookupQuery = venueId ? { _id: venueId } : { ref: id };
	const projection = { __v: 0 };
	const venue = await VenueModel.findOne(lookupQuery, projection);
	if (!venue) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Venue not found.' }));
	}
	/**
	 * @todo use aggregation to map the upcoming events
	 * @todo handle image manipulation
	 * @todo use aggregation to map the reviews
	 * @todo handle the booking confirmation/requested/book now option.
	 */
	// check if venue is already booked
	const { found, status } = await BookingsModel.BookingsActiveService({
		id,
		entityType: FAVOURITE_ENTITY.VENUE,
		entityId: venue._id.toString(),
	});
	const events = await EventsListService({ id, venueId: venue._id });
	return resolve(ResponseUtility.SUCCESS({
		data: {
			... venue._doc,
			minBudget: venue._doc.budget && venue._doc.budget.from,
			maxBudget: venue._doc.budget && venue._doc.budget.to,
			budget: undefined,
			location: venue._doc.address && venue._doc.address.location,
			coordinates: venue._doc.address && [venue._doc.address.coordinates[1], venue._doc.address.coordinates[0]],
			address: undefined,
			events: events.data,
			bookingStatus: found ? status : undefined,
		},
	}));
});
