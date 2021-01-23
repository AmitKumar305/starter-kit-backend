/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import {
	FaqModel,
} from '../../schemas';
import { PAGINATION_LIMIT } from '../../constants';
/**
* @description service model function to handle the listing of all faqs.
* @author Abhinav Sharma
* @since 22 December, 2020
*/

export default ({
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		const faqList = await FaqModel.find({ deleted: false }, { __v: 0 }).skip((page - 1) * limit).limit(limit);
		const total = await FaqModel.countDocuments({ deleted: false });
		return resolve(ResponseUtility.SUCCESS({
			data: {
				list: faqList,
				total,
				page,
				limit,
				size: faqList.length,
				hasMore: faqList.length === limit,
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
