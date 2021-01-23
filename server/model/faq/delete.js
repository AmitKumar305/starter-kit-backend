/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import {
	FaqModel,
} from '../../schemas';
/**
* @description service model function to handle the deletion of a faq.
* @param {String} id the name of the user.
* @param {String} faqRef the _id of the faq.
* @author Abhinav Sharma
* @since 22 December, 2020
*/

export default ({
	id,
	faqRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!faqRef) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing Property faqRef!' }));
		}
		await FaqModel.updateOne({ _id: faqRef, deleted: false }, { deleted: true });
		return resolve(ResponseUtility.SUCCESS({ message: 'Faq has been deleted successfully!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
