/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility, SchemaMapperUtility,
} from 'appknit-backend-bundle';
import { AppDetailModel } from '../../schemas';

/**
* @description a common service model function to add/update app details.
* @author Abhinav Sharma
* @since 22 December, 2020
*/

export default ({
	aboutUs,
	privacyPolicy,
	termsAndConditions,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!(aboutUs || privacyPolicy || termsAndConditions)) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Kindly provide one out of three: aboutUs or privacyPolicy or termsAndConditions' }));
		}
		const updateAppDetails = await SchemaMapperUtility({
			aboutUs,
			aboutUsUpdatedOn: aboutUs ? new Date() : undefined,
			privacyPolicy,
			privacyPolicyUpdatedOn: privacyPolicy ? new Date() : undefined,
			termsAndConditions,
			termsAndConditionsUpdatedOn: termsAndConditions ? new Date() : undefined,
			$min: { createdOn: new Date() },
		});
		const appDetails = await AppDetailModel.findOneAndUpdate({ createdOn: { $exists: true } }, updateAppDetails, { upsert: true, setDefaultsOnInsert: true, new: true });
		return resolve(ResponseUtility.SUCCESS({ data: appDetails, message: 'App Details updated!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
