import { ResponseUtility } from 'appknit-backend-bundle';
import RoomsModel from '../../schemas/room';
/**
 * @description get the details about a hotel room
 * @author gaurav sharma
 * @since 24th October 2018
 */
export default ({
	id,
	roomId,
}) => new Promise(async (resolve, reject) => {
	if (!roomId) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing require property roomId.' }));
	}
	const lookupQuery = { _id: roomId };
	const projection = { __v: 0, timestamp: 0 };
	const room = await RoomsModel.findOne(lookupQuery, projection);
	if (!room) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'No room found.' }));
	}
	/**
	 * @todo handle the requested flag by chekcing whether the user has made a reservation request
	 * for the room.
	 * @todo handle image manipulation
	 */
	return resolve(ResponseUtility.SUCCESS({ data: { ...room._doc } }));
});
