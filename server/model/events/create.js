import moment from 'moment';
import {
	ResponseUtility,
	PropsValidationUtility,
	SchemaMapperUtility,
	S3Services,
} from 'appknit-backend-bundle';
import VenueModel from '../../schemas/venue';
import EventsModel from '../../schemas/events';
import { S3_BUCKET, NODE_ENV } from '../../constants';

const validProps = [
	'description',
	'day',
	'month',
	'year',
	'hours',
	'minutes',
	'entryFees',
];
/**
 * @description this service model function handles the creation of the  events for
 * the venues.
 * @author gaurav sharma
 * @since 24th October 2018
 *
 * @param {String} eventId if editing the event
 * @param {Number} day of event
 * @param {Number} month of event
 * @param {Number} year of event
 * @param {Number} hour timing for event
 * @param {Number} minutes timming for event
 * @param {String} description about the event
 * @param {String} dressCode for the event
 * @param {Number} entryFess for th event in $
 * @param {Array<Buffer>} images buffer array containing the images
 * @param {Boolean} update representing whether or not updating the event. False by default.
 * @todo handle images after configuring s3
 */
export default ({
	id,
	eventId,
	day,
	month,
	year,
	hours,
	minutes,
	description,
	dressCode,
	entryFees,
	images = [],
	update = false,
}) => new Promise(async (resolve, reject) => {
	if (!update) {
		const { code, message } = await PropsValidationUtility({
			validProps,
			sourceDocument: {
				day,
				month,
				year,
				description,
				hours,
				minutes,
				entryFees,
			},
		});
		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}
		const venueLookupQuery = { ref: id };
		const venue = await VenueModel.findOne(venueLookupQuery);
		if (!venue) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Cannot add a event without a venue. Venue is not registered.' }))
		}
		const venueId = venue._doc._id;
		const eventTimestamp = moment(`${day}-${month}-${year} ${hours}:${minutes}`, 'DD-MM-YYYY HH:mm').unix() * 1000;

		const updateImages = [];
		const uploadImagePromises = [];
		images.map(image => uploadImagePromises.push(new Promise(async (_resolve, _reject) => {
			const Key = `event_${Date.now()}`;
			const Bucket = `${S3_BUCKET}/${NODE_ENV}/events`;
			await S3Services.uploadToBucket({ Key, Bucket, data: image });

			updateImages.push(Key);
			return _resolve();
		})));

		await Promise.all(uploadImagePromises);


		const event = new EventsModel({
			ref: venueId,
			images: updateImages,
			description,
			date: { day, month, year },
			eventTimestamp,
			timestamp: Date.now(),
			time: { hours, minutes },
			dressCode,
			entryFees,
		});
		await event.save();
		return resolve(ResponseUtility.SUCCESS({ data: event }));
	}
	if (!id || !eventId || !((day && month && year)
		|| (hours && minutes) || description || dressCode || entryFees
		|| (images && images.length))) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing either of the required properties.' }));
	}
	const eventExists = await EventsModel.findOne({ _id: eventId });
	if (!eventExists) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Requested event does not exists.' }));
	}

	const venueEditable = await VenueModel.findOne({ _id: eventExists.ref, ref: id });
	if (!venueEditable) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'You are not authorized to edit this event.' }));
	}

	const updateImages = new Array(...eventExists.images);
	const uploadImagePromises = [];

	images.map(image => uploadImagePromises.push(new Promise(async (_resolve, _reject) => {
		if (updateImages.length <= 2) {
			const Key = `event_${Date.now()}`;
			const Bucket = `${S3_BUCKET}/${NODE_ENV}/rooms`;

			await S3Services.uploadToBucket({ Key, Bucket, data: image });
			updateImages.push(Key);
		}
		return _resolve();
	})));

	await Promise.all(uploadImagePromises);

	const newDay = day || eventExists.date.day || new Date().getUTCDate() + 1;
	const newMonth = month || eventExists.date.month || new Date().getUTCMonth() + 1;
	const newYear = year || eventExists.date.year || new Date().getUTCFullYear();
	const newHours = hours || eventExists.time.hours || 12;
	const newMinutes = minutes || eventExists.time.minutes || 0;

	const lookupQuery = { _id: eventId };
	const updateQuery = await SchemaMapperUtility({
		date: (day && month && year) ? {
			day, month, year,
		} : undefined,
		time: (hours && minutes) ? { hours, minutes } : undefined,
		eventTimestamp: moment(`${newDay}-${newMonth}-${newYear} ${newHours}:${newMinutes}`, 'DD-MM-YYYY HH:mm').unix() * 1000,
		description,
		dressCode,
		entryFees,
		images: updateImages,
	});

	await EventsModel.update(lookupQuery, updateQuery);
	return resolve(ResponseUtility.SUCCESS());
});
