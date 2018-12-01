import { ResponseUtility } from 'appknit-backend-bundle';
import VenueModel from '../../schemas/venue';
import EventModel from '../../schemas/events';
/**
 * @description service model function to delete an event from the database
 * @author gaurav sharma
 * @since 26th November 2018
 */
export default ({
	id,
	eventId,
}) => new Promise(async (resolve, reject) => {
	if (!eventId) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property eventId.' }));
	}
	// check if event exists
	const eventExists = await EventModel.findOne({ _id: eventId });
	if (!eventExists) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Requested event does not exists.' }));
	}
	// check if venue is editable
	const venueEditable = await VenueModel.findOne({ _id: eventExists.ref, ref: id });
	if (!venueEditable) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'You are not authorized to remove this event.' }));
	}

	await EventModel.remove({ _id: eventId });
	return resolve(ResponseUtility.SUCCESS());
});
