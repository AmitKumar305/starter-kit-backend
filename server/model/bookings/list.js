import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import InstructorModel from '../../schemas/instructor';
import HotelsModel from '../../schemas/hotel';
import VenueModel from '../../schemas/venue';
import BookingsModel from '../../schemas/booking';
import { PAGINATION_LIMIT, FAVOURITE_ENTITY, BOOKING_STATUS } from '../../constants';

/**
 * @description
 * service model function to list down the requested bookings for a user.
 * The response format must be same as other listing functionality as the
 * response is accessed via the same API.
 */
export default ({
	id,
	entityType,
	page = 1,
	limit = Number(PAGINATION_LIMIT) || 30,
}) => new Promise(async (resolve, reject) => {
	if (!entityType) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property entityType.' }));
	}
	const lookupQuery = { entityType, entity: id };
	let populateQuery;
	let lookupKey;
	const projection = { __v: 0 };
	const options = { skip: limit * (page - 1), limit };

	switch (entityType) {
		case FAVOURITE_ENTITY.INSTRUCTOR:
			lookupKey = 'instructor';
			populateQuery = { path: lookupKey, model: InstructorModel };
			break;
		case FAVOURITE_ENTITY.HOTEL:
			lookupKey = 'hotel';
			populateQuery = { path: 'hotel', model: HotelsModel };
			break;
		case FAVOURITE_ENTITY.VENUE:
			lookupKey = 'venue';
			populateQuery = { path: 'venue', model: VenueModel };
			break;
		default:
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid entity type.' }));
	}

	const bookings = await BookingsModel.find(lookupQuery, projection, options)
		.populate(populateQuery);
	const refactoredResponses = [];

	bookings.map((entity) => {
		const indexedEntity = Object.assign({}, entity._doc[lookupKey]._doc);
		if (indexedEntity) {
			refactoredResponses.push(Object.assign({}, {
				...indexedEntity,

				hourlyPricing: indexedEntity.pricing && indexedEntity.pricing.hourly,
				halfDayPricing: indexedEntity.pricing && indexedEntity.pricing.halfDay,
				fullDayPricing: indexedEntity.pricing && indexedEntity.pricing.fullDay,
				seasonalPricing: indexedEntity.pricing && indexedEntity.pricing.seasonal,
				minPreferredAge: indexedEntity.studentPreferredAge && indexedEntity.studentPreferredAge.from,
				maxPreferredAge: indexedEntity.studentPreferredAge && indexedEntity.studentPreferredAge.to,
				location: indexedEntity.address && indexedEntity.address.location,
				coordinates: indexedEntity.address && [indexedEntity.address.coordinates[1], indexedEntity.address.coordinates[0]],
				minimumBudget: indexedEntity.budget && indexedEntity.budget.from,
				maxBudget: indexedEntity.budget && indexedEntity.budget.to,
				// exclude from response.
				budget: undefined,
				address: undefined,
				pricing: undefined,
				studentPreferredAge: undefined,

				bookingStatus: entity._doc.status !== BOOKING_STATUS.DECLINED ? entity._doc.status : undefined,
				booking: {
					...entity._doc,
					venue: undefined,
					hotel: undefined,
				},
			}));
		}
	});
	return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: refactoredResponses, page, limit }));
});
