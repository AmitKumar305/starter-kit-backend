import {
	ResponseUtility,
	PropsValidationUtility,
} from 'appknit-backend-bundle';
import FavouritesModel from '../../schemas/favourites';

const validProps = ['ref', 'entityType'];
/**
 * @description This service model function handles the toggling of the favourites
 * item.
 * @author gaurav sharma
 * @since 9th November 2018
 *
 * @param {String} id
 * @param {String} ref, reference to the entity being marked for toggle favourite.
 * it could be instructor id, club id or the hotel id.
 * @param {Number} entityType, number representing the entity type instrcutor, club or hotel.
 * @param {Boolean} isZebra alias for favourite indicating whether to mark as favourite or remove.
 * true by default.
 */
export default ({
	id,
	ref,
	entityType,
	isZebra = true,
}) => new Promise(async (resolve, reject) => {
	const { code, message } = await PropsValidationUtility({
		validProps,
		sourceDocument: { ref, entityType },
	});
	if (code !== 100) {
		return reject(ResponseUtility.MISSING_PROPS({ message }));
	}
	const lookupQuery = { ref, entityType, entity: id };
	if (!isZebra) {
		await FavouritesModel.remove(lookupQuery);
		return resolve(ResponseUtility.SUCCESS());
	}
	const updated = await FavouritesModel.findOneAndUpdate(
		lookupQuery,
		lookupQuery,
		{ upsert: true, new: true },
	);
	return resolve(ResponseUtility.SUCCESS({ data: updated }));
});
