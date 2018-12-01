import { ResponseUtility } from 'appknit-backend-bundle';
import HotelModel from '../../schemas/hotel';
import { RoomsListService } from '../rooms';
import { BookingsModel } from '..';
import { FAVOURITE_ENTITY } from '../../constants';
/**
 * @description fetch the hotel details
 * @author gaurav sharma
 * @since 24th October 2018
 */
export default ({
	id,
	hotelId,
}) => new Promise(async (resolve, reject) => {
	// if (!hotelId) {
	// 	return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property hotelId.' }));
	// }
	const lookupQuery = hotelId ? { _id: hotelId } : { ref: id };
	const projection = { __v: 0 };
	const hotel = await HotelModel.findOne(lookupQuery, projection);
	if (!hotel) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Requested hotel not found.' }));
	}
	/**
	 * @todo handle projection of reviews and count.
	 * @todo handle the Book now confirmed and rejected flag
	 * @todo handle image manipulation
	 */
	const { found, status } = await BookingsModel.BookingsActiveService({
		id,
		entityType: FAVOURITE_ENTITY.HOTEL,
		entityId: hotel._id.toString(),
	});
	const rooms = await RoomsListService({ id, hotelId: hotel._id });
	return resolve(ResponseUtility.SUCCESS({
		data: {
			...hotel._doc,
			budgetFrom: hotel._doc.budget && hotel._doc.budget.from,
			budgetTo: hotel._doc.budget && hotel._doc.budget.to,
			minimumBudget: hotel._doc.budget && hotel._doc.budget.from,
			maxBudget: hotel._doc.budget && hotel._doc.budget.to,
			location: hotel._doc.address.location || undefined,
			coordinates: (hotel._doc.address.coordinates
				&& [hotel._doc.address.coordinates[1], hotel._doc.address.coordinates[0]]) || undefined,
			address: undefined,
			budget: undefined,
			rooms: rooms.data,
			bookingStatus: found ? status : undefined,
		},
	}));
});
