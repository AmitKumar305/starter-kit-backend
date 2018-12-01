import { ResponseUtility } from 'appknit-backend-bundle';
import BookingsModel from '../../schemas/booking';
/**
 * @description
 * Service model function to act on the booking request.
 * This admin service function will handle the acceptance
 * and decline request for a the booking request.
 * @since 15th November 2018
 * @author gaurav sharma
 */
export default ({
	bookingId,
	status,
}) => new Promise(async (resolve, reject) => {
	if (!bookingId || !status) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required property bookingId or action.' }));
	}
	const lookupQuery = { _id: bookingId };
	const updateQuery = { status };

	try {
		await BookingsModel.findOneAndUpdate(lookupQuery, updateQuery);
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Error while updating booking.' }));
	}
	return resolve(ResponseUtility.SUCCESS());
});
