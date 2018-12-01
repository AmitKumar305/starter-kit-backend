import { ResponseUtility } from "appknit-backend-bundle";
import EventsModel from '../../schemas/events';
/**
 * @description service model function to fetch the details of an event
 * @author gaurav sharma
 * @since 24th October 2018
 */
export default ({
	id,
	eventId,
}) => new Promise(async (resolve, reject) => {
	if (!eventId) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property eventId.' }));
	}
	const lookupQuery = { _id: eventId };
	const projection = { __v: 0 };
	const event = await EventsModel.findOne(lookupQuery, projection);
	if (!event) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Requested event not found.' }));
	}
	return resolve(ResponseUtility.SUCCESS({
		data: {
			...event._doc,
			eventDay: event._doc.date && event._doc.date.day,
			eventMonth: event._doc.date && event._doc.date.month,
			eventYear: event._doc.date && event._doc.date.year,
			eventHours: event._doc.time && event._doc.time.hours,
			eventMinutes: event._doc.time && event._doc.time.minutes,
			date: undefined,
			time: undefined,
		},
	}));
});
