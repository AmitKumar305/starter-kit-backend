/**
*
*/
import { AppDetailModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	add: (req, res) => ModelResolver(req, res, AppDetailModel.Add),
	list: (req, res) => ModelResolver(req, res, AppDetailModel.List),
};
