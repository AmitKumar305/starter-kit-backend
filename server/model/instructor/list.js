import moment from 'moment';
import {
	ResponseUtility,
	PropsValidationUtility,
} from 'appknit-backend-bundle';
import InstructorModel from '../../schemas/instructor';
import {
	FavouritesModel,
	BookingsModel,
} from '..';
import {
	FAVOURITE_ENTITY,
	SPORTS_TYPE,
	BUSINESS_TYPE,
	EDUCATION_LEVEL,
	GENDER,
	LANGUAGES_SPEAK,
	SLOPE_TYPE,
} from '../../constants';

const MAP_ALL_SPORTS_TYPES = Object.keys(SPORTS_TYPE).map(key => SPORTS_TYPE[key]);
const MAP_ALL_BUSINESS_TYPES = Object.keys(BUSINESS_TYPE).map(key => BUSINESS_TYPE[key]);
const MAP_ALL_EDUCATION_LEVEL_TYPES = Object.keys(EDUCATION_LEVEL).map(key => EDUCATION_LEVEL[key]);
const MAP_ALL_GENDER_TYPE = Object.keys(GENDER).map(key => GENDER[key]);
const MAP_ALL_LANGUAGE_TYPES = Object.keys(LANGUAGES_SPEAK).map(key => LANGUAGES_SPEAK[key]);
const MAP_ALL_SLOPE_TYPES = Object.keys(SLOPE_TYPE).map(key => SLOPE_TYPE[key]);

const validProps = [
	'sportsType',
	'schoolType',
	'ageFrom',
	'ageTo',
	'genders',
	'languages',
	'slopes',
	'experienceFrom',
	'experienceTo',
	'education',
];
/**
 * @description
 * service model function to list down the instructors based upon the
 * provided filters.
 * @author gaurav sharma
 * @since 30th October 2018
 *
 * @param {Boolean} favourites indicating whether fetching the favourites listing of instructors
 * all other filters will be ignored if fetching the instructors listing.
 * Allowing to use the same API. Defaults to false.
 */
export default ({
	id,
	sportsType = SPORTS_TYPE.ANY,
	schoolType = BUSINESS_TYPE.ANY,
	ageFrom,
	ageTo,
	genders = [], // array
	languages = [],
	slopes = [],
	experienceFrom, // number
	experienceTo,
	education = EDUCATION_LEVEL.ANY,
	page = 1,
	limit = 30,
	seasonal = false, // set the slope type
	favourites = false,	// whether fetching the instructors for the favourites screnn.
	bookings = false, // whether fetching the instructor for the bookings hostory.
}) => new Promise(async (resolve, reject) => {
	try {
		if (favourites) {
			/**
			 * @todo parse down the favourites for instructor
			 */
			const favouriteInstructors = await FavouritesModel.FavouritesListService({
				id,
				entityType: FAVOURITE_ENTITY.INSTRUCTOR,
				page,
				limit,
			});
			return resolve(favouriteInstructors);
		}
		if (bookings) {
			const bookedInstructors = await BookingsModel.BookingsListService({
				id,
				entityType: FAVOURITE_ENTITY.INSTRUCTOR,
				page,
				limit,
			});
			return resolve(bookedInstructors);
		}
		const skip = limit * (page - 1);
		const options = { skip, limit };
		const { code, message } = await PropsValidationUtility({
			validProps,
			sourceDocument: {
				sportsType,
				schoolType,
				ageFrom,
				ageTo,
				genders,
				languages,
				slopes,
				experienceFrom,
				experienceTo,
				education,
			},
		});
		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}

		const lookupQuery = {
			sportsType: (sportsType === SPORTS_TYPE.ANY) ? { $in: MAP_ALL_SPORTS_TYPES } : sportsType,
			$or: [
				{
					businessType: (schoolType === BUSINESS_TYPE.ANY)
						? { $in: MAP_ALL_BUSINESS_TYPES }
						: schoolType,
				},
			],
			gender: (genders[0] === GENDER.ANY)
				? { $in: MAP_ALL_GENDER_TYPE }
				: { $in: genders },
			languages: (languages[0] === LANGUAGES_SPEAK.ANY)
				? { $in: MAP_ALL_LANGUAGE_TYPES } : { $in: languages },
			slopes: (slopes[0] === SLOPE_TYPE.ANY)
				? { $in: MAP_ALL_SLOPE_TYPES } : { $in: slopes },
			$and: [
				{ coachingExperience: { $gte: experienceFrom } },
				{ coachingExperience: { $lte: experienceTo } },
				{ 'dob.year': { $gte: moment().year() - ageTo } },
				{ 'dob.year': { $lte: moment().year() - ageFrom } },
			],
			educationLevel: (education === EDUCATION_LEVEL.ANY)
				? { $in: MAP_ALL_EDUCATION_LEVEL_TYPES }
				: { $gte: education },
		};

		const instructors = await InstructorModel.find(lookupQuery, { __v: 0, mobile: 0, verification: 0, useLocation: 0 }, options);
		const refactoredResponses = [];
		const promises = [];
		instructors.map((instructor) => {
			promises.push(new Promise(async (_resolve, _reject) => {
				const inst = instructor._doc;
				const object = Object.assign({}, {
					...inst,
					hourlyPricing: inst.pricing && inst.pricing.hourly,
					halfDayPricing: inst.pricing && inst.pricing.halfDay,
					fullDayPricing: inst.pricing && inst.pricing.fullDay,
					seasonalPricing: inst.pricing && inst.pricing.seasonal,
					minPreferredAge: inst.studentPreferredAge && inst.studentPreferredAge.from,
					maxPreferredAge: inst.studentPreferredAge && inst.studentPreferredAge.to,
					pricing: undefined,
					studentPreferredAge: undefined,
				});
				const { found, status } = await BookingsModel.BookingsActiveService({
					id,
					entityType: FAVOURITE_ENTITY.INSTRUCTOR,
					entityId: inst._id.toString(),
				});
				if (found) {
					object.bookingStatus = status;
				}
				refactoredResponses.push(object);
				return _resolve();
			}));
		});
		await Promise.all(promises);
		/**
		 * @todo aggregate reviews
		 */
		return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: refactoredResponses, page, limit }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'There was some error with the request.', error: err }));
	}
});
