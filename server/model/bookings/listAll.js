import { ResponseUtility } from 'appknit-backend-bundle';
import BookingsModel from '../../schemas/booking';
import UsersModel from '../../schemas/user';
import InstructorModel from '../../schemas/instructor';
import VenueModel from '../../schemas/venue';
import HotelModel from '../../schemas/hotel';
/**
 * @description
 * service model function to list down all the active bookings
 * @since 15th November 2018
 * @author gaurav sharma
 */
export default ({
	page = 1,
	limit = 30,
}) => new Promise(async (resolve, reject) => {
	const options = { skip: limit * (page - 1), sort: { bookingTimestamp: -1 } };
	const populateUser = { path: 'user', model: UsersModel, select: ['name', 'picture'] };
	const populateHotel = { path: 'hotel', model: HotelModel, select: ['images', 'name'] };
	const populateInstructor = { path: 'instructor', model: InstructorModel, select: ['name', 'images'] };
	const populateVenue = { path: 'venue', model: VenueModel, select: ['name', 'images'] };

	const bookings = await BookingsModel.find({}, { __v: 0 }, options)
		.populate(populateUser)
		.populate(populateHotel)
		.populate(populateInstructor)
		.populate(populateVenue);

	// const refactoredResponses = [];
	return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: bookings, page, limit }));
});
