import RedisServer from 'redis';
import { promisify } from 'util';
import {
	REDIS_HOST,
	REDIS_PORT,
	REDIS_PASSWORD,
} from '../constants';


const redisClient = RedisServer.createClient(
	{ port: REDIS_PORT, host: REDIS_HOST },
);
redisClient.auth(REDIS_PASSWORD);
class Redis {
	constructor() {
		global.logger.info('initializing redis');
	}

	static async get(keyPattern) {
		const getPromisified = promisify(redisClient.get).bind(redisClient);
		return new Promise((resolve, reject) => {
			getPromisified(keyPattern).then((result) => {
				resolve(result);
			}, (error) => {
				reject(error);
			});
		});
	}

	static async keys(keyPattern) {
		const getPromisified = promisify(redisClient.keys).bind(redisClient);
		return new Promise((resolve, reject) => {
			getPromisified(keyPattern).then((result) => {
				resolve(result);
			}, (error) => {
				reject(error);
			});
		});
	}

	static async set(key, value) {
		const setPromisified = promisify(redisClient.set).bind(redisClient);
		return new Promise((resolve, reject) => {
			setPromisified(key, value).then((result) => {
				resolve(result);
			}, (error) => {
				reject(error);
			});
		});
	}

	static async expire(key, seconds) {
		const expirePromisified = promisify(redisClient.expire).bind(redisClient);

		return new Promise((resolve, reject) => {
			expirePromisified(key, seconds).then((result) => {
				resolve(result);
			}, (error) => {
				reject(error);
			});
		});
	}

	static async expireat(key, expireUnixTimestampSeconds) {
		const expireatPromisified = promisify(redisClient.expireat).bind(redisClient);
		global.logger.info('setting expire unixtimestamp for', key);
		return new Promise(expireatPromisified(key, expireUnixTimestampSeconds));
	}

	static async del(key) {
		const deletePromisified = promisify(redisClient.del).bind(redisClient);
		global.logger.info('deleting key', key);
		return new Promise((resolve, reject) => {
			deletePromisified(key).then((result) => {
				resolve(result);
			}, (error) => {
				reject(error);
			});
		});
	}
}

export default Redis;
