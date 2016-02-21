'use strict';
import Base from './base.js';

export default class extends Base {
  /**
   * public action
   * @return {Promise} []
   */
  publicAction() {
    return this.display();
  }
}