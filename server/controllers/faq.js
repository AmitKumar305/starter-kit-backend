/**
*
*/
import { FaqModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	add: (req, res) => ModelResolver(req, res, FaqModel.Add),
	update: (req, res) => ModelResolver(req, res, FaqModel.Update),
	list: (req, res) => ModelResolver(req, res, FaqModel.List),
	delete: (req, res) => ModelResolver(req, res, FaqModel.Delete),
};
