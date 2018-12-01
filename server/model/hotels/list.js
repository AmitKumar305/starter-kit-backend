import { ResponseUtility } from 'appknit-backend-bundle';
import HotelsModel from '../../schemas/hotel';
import {
	FavouritesModel,
	BookingsModel,
} from '..';
import {
	PAGINATION_LIMIT,
	ACCOMODATION_TYPE,
	FARAYA_LONG,
	FARAYA_LAT,
	FAVOURITE_ENTITY,
} from '../../constants';

const MAP_ALL_ACCOMODATION_TYPES =
	Object.keys(ACCOMODATION_TYPE).map(key => ACCOMODATION_TYPE[key]);
/**
 * @description
 * Service model function to list down all the hotels based upon the provided filters.
 * @author gaurav sharma
 * @since 9th November 2018
 *
 * @param {String} id
 * @param {Number} hotelType represents the accomodation type
 * @param {Number} minDistance from the slopes. Defaults to 0
 * @param {Number} maxDistance from the slopes. Defalts to 100km.
 * @param {Number} guestsCount number of guests
 * @param {Number} minBudget minimum price. Defaults to 0.
 * @param {Number} maxBudget maximum price, defaults to 10000.
 * @param {Number} page for pagination
 * @param {Number} limit for pagination
 * @param {Boolean} favourites indicating whether to fetch the favourites
 * rather than filtered list of items. False by default.
 */
export default ({
	id,
	hotelType = ACCOMODATION_TYPE.ANY,
	minDistance = 0,
	maxDistance = 100,
	guestsCount = 2,
	minBudget = 0,
	maxBudget = 10000,
	page = 1,
	limit = Number(PAGINATION_LIMIT) || 30,
	favourites = false,
	bookings = false,
}) => new Promise(async (resolve, reject) => {
	const requestParams = {
		id,
		entityType: FAVOURITE_ENTITY.HOTEL,
		page,
		limit,
	};
	if (favourites) {
		const favouriteHotels = await FavouritesModel.FavouritesListService(requestParams);
		return resolve(favouriteHotels);
	}
	if (bookings) {
		const bookedHotels = await BookingsModel.BookingsListService(requestParams);
		return resolve(bookedHotels);
	}
	const options = { skip: limit * (page - 1), limit };
	const lookupQuery = {
		address: {
			$nearSphere: {
				$geometry: {
					type: 'Point',
					coordinates: [FARAYA_LONG, FARAYA_LAT],
				},
				$maxDistance: maxDistance * 1000,
				$minDistance: minDistance * 1000,
			},
		},
		hotelType: (hotelType === ACCOMODATION_TYPE.ANY)
			? { $in: MAP_ALL_ACCOMODATION_TYPES }
			: hotelType,
		'budget.from': { $gte: minBudget },
		'budget.to': { $lte: maxBudget },
	};
	const projection = { __v: 0 };

	try {
		const hotels = await HotelsModel.find(lookupQuery, projection, options);
		const refactoredRespnses = [];

		const bookingPromises = [];
		hotels.map(async hotel => bookingPromises.push(new Promise(async (_resolve, _reject) => {
			const { found, status } = await BookingsModel.BookingsActiveService({
				id,
				entityType: FAVOURITE_ENTITY.HOTEL,
				entityId: hotel._id.toString(),
			});
			refactoredRespnses.push(Object.assign({}, {
				...hotel._doc,
				location: hotel._doc.address && hotel._doc.address.location,
				coordinates: hotel._doc.address && [
					hotel._doc.address.coordinates[1],
					hotel._doc.address.coordinates[0],
				],
				minimumBudget: hotel._doc.budget.from,
				maxBudget: hotel._doc.budget.to,
				budget: undefined,
				address: undefined,
				bookingStatus: found ? status : undefined,
			}));
			return _resolve();
		})));

		await Promise.all(bookingPromises);
		return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: refactoredRespnses, page, limit }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Error fetching hotels.', error: err }));
	}
});
