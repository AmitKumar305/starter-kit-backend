import { ResponseUtility } from 'appknit-backend-bundle';
import InstructorModel from '../../schemas/instructor';
import { BookingsModel } from '..';
import { FAVOURITE_ENTITY } from '../../constants';
/**
 * @description this service model function will send the details of the instructor.
 * This can send the self instructor details as well as while viewing profile of other
 * instrutors.
 * @author gaurav sharma
 * @since 24th October 2018
 *
 * @param {String} id of the session user
 * @param {String} entityId if fetching the details of instructor
 * @param {Boolean} review flag indicating whether to populate the reviews with details or not.
 */
export default ({
	id,
	entityId,
}) => new Promise(async (resolve, reject) => {
	const lookupQuery = entityId ? { ref: entityId } : { ref: id };
	const projection = {
		__v: 0,
		useLocation: 0,
		verification: 0,
		mobile: 0,
	};
	if (entityId) {
		projection.businessActivated = 0;
	}
	const instructor = await InstructorModel.findOne(lookupQuery, projection);
	if (!instructor) {
		return reject(ResponseUtility.NO_USER());
	}
	const inst = instructor._doc;
	const refactoredInstructor = Object.assign({}, {
		...inst,
		hourlyPricing: inst.pricing && inst.pricing.hourly,
		halfDayPricing: inst.pricing && inst.pricing.halfDay,
		fullDayPricing: inst.pricing && inst.pricing.fullDay,
		seasonalPricing: inst.pricing && inst.pricing.seasonal,
		minPreferredAge: inst.studentPreferredAge && inst.studentPreferredAge.from,
		maxPreferredAge: inst.studentPreferredAge && inst.studentPreferredAge.to,
		pricing: undefined,
		studentPreferredAge: undefined,
	});
	if (id !== entityId) {
		const { found, status } = await BookingsModel.BookingsActiveService({
			id,
			entityType: FAVOURITE_ENTITY.INSTRUCTOR,
			entityId: instructor._id.toString(),
		});
		if (found) {
			refactoredInstructor.bookingStatus = status;
		}
	}
	/**
	 * @todo handle image manipulation
	 * @todo handle the reviews aggregation along with the responses
	 */
	return resolve(ResponseUtility.SUCCESS({ data: refactoredInstructor }));
});
