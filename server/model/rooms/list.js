import { ResponseUtility } from 'appknit-backend-bundle';
import RoomsModel from '../../schemas/room';
/**
 * @description service model function to handle the listing of rooms under a hotel
 * @author gaurav sharma
 * @since 25th October 2018
 *
 * @param {String} hotelId to fetch the rooms under a hotel
*/
export default ({
	id,
	hotelId,
	page = 1,
	limit = 30,
}) => new Promise(async (resolve, reject) => {
	if (!hotelId) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'MIssing required property hotelId.' }));
	}
	const lookupQuery = { ref: hotelId };
	const options = { skip: limit * (page - 1), limit };
	const projection = { __v: 0, timestamp: 0 };

	const rooms = await RoomsModel.find(lookupQuery, projection, options);
	return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: rooms, page, limit }));
});
