/* eslint-disable import/named */
/*
* This is the controller for Notifications
* @author Abhinav Sharma
* @since 10 March, 2021
*/
import { NotificationModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	list: (req, res) => ModelResolver(req, res, NotificationModel.NotificationListService),
	broadcast: (req, res) => ModelResolver(req, res, NotificationModel.NotificationBroadcastService),
};
