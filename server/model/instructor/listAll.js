import { ResponseUtility } from 'appknit-backend-bundle';
import InstructorsModel from '../../schemas/instructor';
import EntityModel from '../../schemas/entity';
import HotelModel from '../../schemas/hotel';
import VenueModel from '../../schemas/venue';

export default ({
	page = 1,
	limit = 30,
}) => new Promise(async (resolve, reject) => {
	const options = { skip: limit * (page - 1) };
	const populationQuery = { path: 'userEntity', model: EntityModel };
	const populateHotel = { path: 'hotel', model: HotelModel };
	const populateVenue = { path: 'venue', model: VenueModel };

	const instructors = await InstructorsModel.find({}, { __v: 0 }, options)
		.populate(populationQuery)
		.populate(populateHotel)
		.populate(populateVenue);

	const refactoredResponses = [];
	instructors.map(instructor => refactoredResponses.push(Object.assign({}, {
		...instructor._doc,
		hotel: instructor.$$populatedVirtuals.hotel ? { ...instructor.$$populatedVirtuals.hotel._doc } : undefined,
		venue: instructor.$$populatedVirtuals.venue ? { ...instructor.$$populatedVirtuals.venue._doc } : undefined,
		blocked: instructor.$$populatedVirtuals.userEntity.blocked,
	})));

	return resolve(ResponseUtility.SUCCESS_PAGINATION({ data: refactoredResponses, page, limit }));
});
