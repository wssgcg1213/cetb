/**
 * cet api version 2.0 2015-12-02
 * author Ling/
 */

'use strict';

import Base from './base.js';

export default class extends Base {
  /**
   * index action
   * 不允许访问
   */
  indexAction () {
    this.fail('METHOD_NOT_ALLOWED');
  }

  /**
   * fuck action
   * for redirect
   */
  fuckAction () {
    this.fail('FUCK');
  }

  /**
   * public action
   * /api/v2/basic
   * 基本查询
   * @param: 姓名, 准考证号
   * @return 考试成绩
   */
  basicAction () {
    this.success("ok");
  }

  /**
   * public action
   * /api/v2/noticket
   * 无准考证查询
   * @param: 姓名, 学校
   * @return 考试成绩
   */
  noticketAction () {
    this.success("ok");
  }
}