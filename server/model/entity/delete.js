import { ResponseUtility } from 'appknit-backend-bundle';
import EntityModel from '../../schemas/entity';
import UserModel from '../../schemas/user';
import InstructorModel from '../../schemas/instructor';
import HotelsModel from '../../schemas/hotel';
import VenueModel from '../../schemas/venue';
import EventsModel from '../../schemas/events';
import RoomsModel from '../../schemas/room';
import ReviewsModel from '../../schemas/reviews';
import FavouritesModel from '../../schemas/favourites';
/**
 * @description
 * Functionality to delete an entity from the system and associated entities.
 * ADMIN authentication required.
 * @author gaurav sharma
 * @since 13th November 2018
 */
export default ({
	entityId,
}) => new Promise(async (resolve, reject) => {
	if (!entityId) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property entityId.' }));
	}
	await EntityModel.remove({ _id: entityId });
	await UserModel.remove({ ref: entityId });
	await InstructorModel.remove({ ref: entityId });


	/**
	 * @description
	 * trigger deleting the hotel that belongs to the user.
	 * 1. fetch the hotel id.
	 * 2. remove the linked rooms.
	 * 3. remove the hotel.
	 */
	const hotel = await HotelsModel.findOne({ ref: entityId });
	if (hotel) {
		const { _doc: { _id } } = hotel;
		await RoomsModel.remove({ ref: _id });
	}
	await HotelsModel.remove({ ref: entityId });
	/**
	 * @description
	* trigger deleting the venue that belongs to the user.
	* 1. fetch the venuid id.
	* 2. remove the linked events.
	* 3. remove the venue.
	*/
	const venue = await VenueModel.findOne({ ref: entityId });
	if (venue) {
		const { _doc: { _id } } = hotel;
		await EventsModel.remove({ ref: _id });
	}
	await VenueModel.remove({ ref: entityId });

	/**
	 * @description handle the reviews deletion service that is related to this user anyhow.
	 */
	await ReviewsModel.remove({ entity: entityId });

	/**
	 * @description
	 * removing the favourites
	 */
	await FavouritesModel.remove({ entity: entityId });
	return resolve(ResponseUtility.SUCCESS());
});
