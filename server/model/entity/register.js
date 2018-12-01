import {
	PropsValidationUtility,
	ResponseUtility,
	VerifyFacebookTokenService,
} from 'appknit-backend-bundle';
import EntityModel from '../../schemas/entity';
import InstructorModel from '../../schemas/instructor';
import UserModel from '../../schemas/user';
import HotelsModel from '../../schemas/hotel';
import VenueModel from '../../schemas/venue';
import { FARAYA_LONG, FARAYA_LAT } from '../../constants';

const validProps = ['firstName', 'lastName', 'email', 'token', 'picture', 'gender'];
/**
 * @description
 * Handle the entity registration process
 * @author gaurav sharma
 * @since 19th October 2018
 */
export default ({
	firstName,
	lastName,
	email,
	token,
	picture,
	gender,
}) => new Promise(async (resolve, reject) => {
	const { code, message } = await PropsValidationUtility({
		validProps,
		sourceDocument: {
			firstName,
			lastName,
			email,
			token,
			picture,
			gender,
		},
	});
	if (code !== 100) {
		return reject(ResponseUtility.MISSING_PROPS({ message }));
	}
	try {
		const facebookVerified = await VerifyFacebookTokenService({ accessToken: token });
		const duplicateUser = await EntityModel.findOne({ facebookId: facebookVerified.data.id });
		if (duplicateUser) {
			if (duplicateUser.blocked) {
				return reject(ResponseUtility.GENERIC_ERR({ message: 'Login access has been revoked. Please contact support.' }));
			}
			if (token === duplicateUser._doc.token) {
				if (duplicateUser._doc.deleted) {
					return reject(ResponseUtility.GENERIC_ERR({ message: 'Login access has been revoked. Please contact support.' }));
				}
				return resolve(ResponseUtility.SUCCESS({ data: { id: duplicateUser._doc._id } }));
			}
			const updateQuery = { token };
			await EntityModel.update({ _id: duplicateUser._doc._id }, updateQuery);
			return resolve(ResponseUtility.SUCCESS({ data: { id: duplicateUser._doc._id } }));
		}
		/**
		 * create a new user
		 */
		const now = Date.now();
		const entity = new EntityModel({
			token,
			facebookId: facebookVerified.data.id,
			timestamp: now,
		});
		await entity.save();

		/**
		 * @todo create a hotel and a venue as well
		 */
		const hotel = new HotelsModel({
			ref: entity._doc._id,
			timestamp: Date.now(),
			averageRating: 0,
			address: {
				location: 'Faraya, Lebanon',
				type: 'Point',
				coordinates: [FARAYA_LONG, FARAYA_LAT],
			},
		});
		const venue = new VenueModel({
			ref: entity._doc._id,
			timestamp: Date.now(),
			averageRating: 0,
			address: {
				location: 'Faraya, Lebanon',
				type: 'Point',
				coordinates: [FARAYA_LONG, FARAYA_LAT],
			},
		});

		await hotel.save();
		await venue.save();

		const instructor = new InstructorModel({
			name: `${firstName} ${lastName}`,
			ref: entity._doc._id,
			hotelRef: hotel._doc._id,
			venueRef: venue._doc._id,
			gender,
			email,
		});
		await instructor.save();

		const user = new UserModel({
			name: `${firstName} ${lastName}`,
			ref: entity._doc._id,
			gender,
			email,
			registeredOn: Date.now(),
		});
		await user.save();

		return resolve(ResponseUtility.SUCCESS({ code: 100, data: { id: entity._id } }));
	} catch (err) {
		console.log(err);
		return reject(ResponseUtility.INVALID_ACCESS_TOKEN);
	}
});
