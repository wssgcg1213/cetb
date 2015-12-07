'use strict';
/**
 * db config
 * @type {Object}
 */
export default {
  type: 'mysql',
  host: '127.0.0.1',
  port: '3306',
  name: 'cetb',
  user: 'local',
  pwd: 'local',
  prefix: '',
  encoding: 'utf8',
  connectionLimit: 10,
  nums_per_page: 10,
  log_sql: true,
  log_connect: true,
  cache: {
    on: true,
    type: 'redis',
    timeout: 3600
  },
  adapter: {
    redis: {
      prefix: "cetb_"
    }
  }
};