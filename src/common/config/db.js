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
  nums_per_page: 10,
  log_sql: true,
  log_connect: true
};