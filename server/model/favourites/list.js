import { ResponseUtility } from 'appknit-backend-bundle';
import FavouritesModel from '../../schemas/favourites';
import InstructorModel from '../../schemas/instructor';
import HotelModel from '../../schemas/hotel';
import VenueModel from '../../schemas/venue';
import { BookingsModel } from '..';
import { PAGINATION_LIMIT, FAVOURITE_ENTITY } from '../../constants';

/**
 * @description
 * The listing of the favourite entities. The response format must
 * comply with the instructor listing, hotels listing and venue listing
 * because same API will be used to parse these responses.
 * @author gaurav sharma
 * @since 9th November 2018
 *
 * @param {String} id
 * @param {Number} type representing the entity type to list.
 * @param {Number} page for pagination.
 * @param {Number} limit for pagination.
 */
export default ({
	id,
	entityType,
	page = 1,
	limit = Number(PAGINATION_LIMIT),
}) => new Promise(async (resolve, reject) => {
	if (!entityType) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property entityType.' }));
	}
	const lookupQuery = { entity: id, entityType };
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
			populateQuery = { path: lookupKey, model: HotelModel };
			break;
		case FAVOURITE_ENTITY.VENUE:
			lookupKey = 'venue';
			populateQuery = { path: lookupKey, model: VenueModel };
			break;
		default:
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid entity type. See mapping for possible values.' }));
	}

	const entities = await FavouritesModel.find(lookupQuery, projection, options)
		.populate(populateQuery);
	const refactoredResponses = [];
	const bookingStatusPromises = [];
	entities.map(entity => bookingStatusPromises.push(new Promise(async (_resolve, _reject) => {
		if (entity[lookupKey]) {
			const indexedEntity = entity[lookupKey]._doc;
			if (indexedEntity) {
				const { found, status } = await BookingsModel.BookingsActiveService({
					id,
					entityType,
					entityId: indexedEntity._id,
				});
				refactoredResponses.push(Object.assign({}, {
					...indexedEntity,
	// 					// for instructors
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
					bookingStatus: found ? status : undefined,
				}));
			}
		}
		return _resolve();
	})));
	// entities.map((entity) => { 
	// 	if (entity[lookupKey]) {
	// 		const indexedEntity = entity[lookupKey]._doc;
	// 		if (indexedEntity) {
	// 			/**
	// 			 * @todo can skip this step..Can use the common mapping to handle
	// 			 * this process for all entity types.
	// 			 */
	// 			if (entityType !== FAVOURITE_ENTITY.INSTRUCTOR) {
	// 				refactoredResponses.push(Object.assign({}, {
	// 					...indexedEntity,
	// 					// for instructors
	// 					hourlyPricing: indexedEntity.pricing && indexedEntity.pricing.hourly,
	// 					halfDayPricing: indexedEntity.pricing && indexedEntity.pricing.halfDay,
	// 					fullDayPricing: indexedEntity.pricing && indexedEntity.pricing.fullDay,
	// 					seasonalPricing: indexedEntity.pricing && indexedEntity.pricing.seasonal,
	// 					minPreferredAge: indexedEntity.studentPreferredAge && indexedEntity.studentPreferredAge.from,
	// 					maxPreferredAge: indexedEntity.studentPreferredAge && indexedEntity.studentPreferredAge.to,

	// 					location: indexedEntity.address && indexedEntity.address.location,
	// 					coordinates: indexedEntity.address && [indexedEntity.address.coordinates[1], indexedEntity.address.coordinates[0]],
	// 					minimumBudget: indexedEntity.budget && indexedEntity.budget.from,
	// 					maxBudget: indexedEntity.budget && indexedEntity.budget.to,
	// 					// exclude from response.
	// 					budget: undefined,
	// 					address: undefined,
	// 					pricing: undefined,
	// 					studentPreferredAge: undefined,
	// 				}));
	// 			} else {
	// 				refactoredResponses.push(Object.assign({}, {
	// 					...indexedEntity,
	// 					hourlyPricing: indexedEntity.pricing && indexedEntity.pricing.hourly,
	// 					halfDayPricing: indexedEntity.pricing && indexedEntity.pricing.halfDay,
	// 					fullDayPricing: indexedEntity.pricing && indexedEntity.pricing.fullDay,
	// 					seasonalPricing: indexedEntity.pricing && indexedEntity.pricing.seasonal,
	// 					minPreferredAge: indexedEntity.studentPreferredAge && indexedEntity.studentPreferredAge.from,
	// 					maxPreferredAge: indexedEntity.studentPreferredAge && indexedEntity.studentPreferredAge.to,

	// 					pricing: undefined,
	// 					studentPreferredAge: undefined,
	// 				}));
	// 			}
	// 		}
	// 	}
	// });
	await Promise.all(bookingStatusPromises);
	return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: refactoredResponses, page, limit }));
});
