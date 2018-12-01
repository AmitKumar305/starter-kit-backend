import { ResponseUtility } from 'appknit-backend-bundle';
import RoomsModel from '../../schemas/room';
import HotelModel from '../../schemas/hotel';
/**
 * @description
 * Service model function to delete a room.
 * @author Gaurav Sharma
 * @since 26th November 2018
 */
export default ({
	id,
	roomId,
}) => new Promise(async (resolve, reject) => {
	if (!roomId) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing required property roomId.' }));
	}
	/**
	 * @todo check if roomId is present
	 * check if roomId corresponds to a hotel that has been created by the user.
	 */
	const roomExists = await RoomsModel.findOne({ _id: roomId });
	if (!roomExists) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'No such room exists.' }));
	}
	// check if hotel is created by the user
	const hotelExists = await HotelModel.findOne({ _id: roomExists.ref, ref: id });
	if (!hotelExists) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'You are not authorized to delete this room.' }));
	}
	await RoomsModel.remove({ _id: roomId });
	return resolve(ResponseUtility.SUCCESS());
});
