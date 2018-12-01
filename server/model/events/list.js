import moment from 'moment';
import { ResponseUtility } from 'appknit-backend-bundle';
import EventsModel from '../../schemas/events';
/**
 * @description this service model function to list all the events under a venue.
 * @author gaurav sharma
 * @since 24th October 2018
 */
export default ({
	id,
	venueId,
	page = 1,
	limit = 30,
}) => new Promise(async (resolve, reject) => {
	if (!venueId) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property venueId.' }));
	}
	const lookupQuery = { ref: venueId, eventTimestamp: { $gt: moment().unix() * 1000 } };
	const projection = { __v: 0 };
	const options = { skip: limit * (page - 1), limit, sort: { timestamp: -1 } };

	const events = await EventsModel.find(lookupQuery, projection, options);
	const refactoredResponses = [];
	events.map(event => refactoredResponses.push(Object.assign({}, {
		...event._doc,
		eventDay: event._doc.date && event._doc.date.day,
		eventMonth: event._doc.date && event._doc.date.month,
		eventYear: event._doc.date && event._doc.date.year,
		eventHours: event._doc.time && event._doc.time.hours,
		eventMinutes: event._doc.time && event._doc.time.minutes,
		date: undefined,
		time: undefined,
	})))
	return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: refactoredResponses, page, limit }));
});
