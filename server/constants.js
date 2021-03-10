/**
* This is the {{app_name}} constant file
* @author {{app_author}}
* @since {{app_date}}
*/

export const {
	HOST = 'http://localhost:3000/api/',
	S3_BUCKET = '',
	// atlas configurations
	ATLAS_USER,
	ATLAS_PASSWORD,
	ATLAS_CLUSTER,
	SECRET_STRING,
	PAGINATION_LIMIT = 30,
	// RabbitMQ configuration
	RABBITMQ_HOST,
	RABBITMQ_USER,
	RABBITMQ_PASSWORD,
	RABBITMQ_HEARTBEAT,
	REDIS_HOST,
	REDIS_PORT,
	REDIS_PASSWORD,
	APP_NAME = 'APP_NAME',
	APP_LOGO_URL = 'https://media-exp1.licdn.com/dms/image/C510BAQHWd-ifRsFWfQ/company-logo_200_200/0/1538203196993?e=1623283200&v=beta&t=8JhGLa7HDjCUoectQPz7CJQ72_tzP9N3F4ee4hdwe4M',
	NODE_ENV = `${APP_NAME}-development`,
	BUSINESS_EMAIL,
	CONTACT_US_EMAIL = BUSINESS_EMAIL,
} = process.env;

const db = process.env.MONGO_DB || '{{app_name}}';

/**
 * @description
 * This is the sample constact specifier for queues
 * The queue names follow follow the "camelcase" naming
 * convention wehere the first letter of the queue will
 * be capital case. The queue channels are defined under server/queues/
 * directory and will be autoloded by directory indexer unless explicitly
 * ignored in skip array in index.js. The sampleQueue.js is a sample
 * channel that is meant to be updated/renamed as per the queue requirements.
 * To know more about the channel convention and design principles
 * @contact sharma02gaurav@gmail.com
 */
export const AMQP_QUEUES = {
	SAMPLE_QUEUE: 'SampleQueue',
};

// export const mongoConnectionString = `mongodb://${host}:${port}/${db}`;
export const mongoConnectionString = `mongodb+srv://${ATLAS_USER}:${ATLAS_PASSWORD}@${ATLAS_CLUSTER}/${db}?retryWrites=true`;

// this string is unique for each project construction
export const secretString = SECRET_STRING;

export const SUCCESS_CODE = 100;

export const MB = 1024 * 1024;

export const GENDER = {
	MALE: 1,
	FEMALE: 2,
	OTHERS: 3,
};

export const S3_IMAGES = {
	SMALL: `${S3_BUCKET}/${NODE_ENV}/images/small`,
	AVERAGE: `${S3_BUCKET}/${NODE_ENV}/images/average`,
	BEST: `${S3_BUCKET}/${NODE_ENV}/images/best`,
	GLOBAL: `${S3_BUCKET}/globalImages`,
};

export const SOCIAL_IDENTIFIER = {
	FB: 1,
	APPLE: 2,
	GOOGLE: 3,
};

export const VERIFICATION_TYPE = {
	CHANGE_PASSWORD: 1,
	EMAIL_VERIFICATION: 2,
};

export const TOKEN_EXPIRATION_TIME = 604800000;

export const ADMIN_USER_ACTIONS = {
	VERIFIED: 1,
	BLOCKED: 2,
	UNBLOCKED: 3,
	DELETED: 4,
};

export const TYPE_OF_NOTIFICATIONS = {
	ADMIN: 1,
	MESSAGE: 2,
};
