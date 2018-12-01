import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import VenueModel from '../../schemas/venue';
import { FavouritesModel, BookingsModel } from '..';
import {
	CLUB_TYPE,
	MUSIC_TYPE,
	PAGINATION_LIMIT,
	FARAYA_LAT,
	FARAYA_LONG,
	FAVOURITE_ENTITY,
} from '../../constants';

const MAPPED_ALL_MUSIC_TYPES = Object.keys(MUSIC_TYPE).map(key => MUSIC_TYPE[key]);
const MAPPED_ALL_CLUB_TYPES = Object.keys(CLUB_TYPE).map(key => CLUB_TYPE[key]);

/**
 * @description
 * This service model function handles the listing of the venues as per the filter
 * @author gaurav sharma
 * @since 9th November 2018
 *
 * @param {Number} venueType defaults to bar
 * @param {Number} musicType defaults to tecnhno electronic
 * @param {Number} minDistance represents the minimum distance from faraya
 * @param {Number} maxDistance represents the maximum distance of venue from faraya
 * @param {Number} minBudget represents the minimum venue for a budget
 * @param {Number} maxBudget represents the maximum budget for the venue
 * @param {Boolean} dance representing whether the venue has the dance floor or not. true by default
 * @param {Number} page for pagination. defaults to 1
 * @param {Number} limit for pagination. defaults to 30
 * @param {Boolean} favourites property indicating whether fetching the favourites for venues.
 * If true then it will neglect the filter values and send the favourites list instead.
 */
export default ({
	id,
	venueType = CLUB_TYPE.ANY,
	musicType = MUSIC_TYPE.ANY,
	minDistance = 0,
	maxDistance = 100,
	minBudget = 0,
	maxBudget = 10000,
	dance = [true, false],
	page = 1,
	limit = Number(PAGINATION_LIMIT) || 30,
	favourites = false,
	bookings = false,
}) => new Promise(async (resolve, reject) => {
	const requestParams = {
		id,
		entityType: FAVOURITE_ENTITY.VENUE,
		page,
		limit,
	};
	if (favourites) {
		const favouriteVenues = await FavouritesModel.FavouritesListService(requestParams);
		return resolve(favouriteVenues);
	}
	if (bookings) {
		const bookedVenues = await BookingsModel.BookingsListService(requestParams);
		return resolve(bookedVenues);
	}
	const skip = limit * (page - 1);
	const options = { skip, limit };

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
		venueType: (venueType === CLUB_TYPE.ANY)
			? { $in: MAPPED_ALL_CLUB_TYPES }
			: venueType,
		musicType: (musicType === MUSIC_TYPE.ANY)
			? { $in: MAPPED_ALL_MUSIC_TYPES }
			: musicType,
		'budget.from': { $gte: minBudget },
		'budget.to': { $lte: maxBudget },
		isDancingAvailable: { $in: dance },
	};
	const projection = { __v: 0 };

	try {
		const venues = await VenueModel.find(lookupQuery, projection, options);
		const refactoredResponses = [];
		venues.map(venue => refactoredResponses.push(Object.assign({}, {
			...venue._doc,
			location: venue._doc.address && venue._doc.address.location,
			coordinates: venue._doc.address && [venue._doc.address.coordinates[1], venue._doc.address.coordinates[0]],
			minimumBudget: venue._doc.budget.from,
			maxBudget: venue._doc.budget.to,
			budget: undefined,
			address: undefined,
		})));
		return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: refactoredResponses, page, limit }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Error looking for venues.', error: err }));
	}
});
