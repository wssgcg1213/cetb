/**
 * cet api version 2.0 2015-12-02
 * author Ling/
 */

'use strict';

import Base from './base.js';
const rc4Pwd = "合作请联系i@zeroling.com ";

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
  async noticketAction () {
    let name = this.post('name'),
        school = this.post('school'),
        cetType = this.post('cetType') || 1;//1 = CET4, 2 = CET6

    //name = this.rc4(name, rc4Pwd);
    //school = this.rc4(school, rc4Pwd);

    //检查学校合法性
    if (!this.checkSchoolValid(school)) {
      this.fail('SCHOOL_NOT_VALID');
      return;
    }

    //防止名字超长越界
    if (!name || name.length > 15) {
      this.fail('NAME_NOT_VALID');
      return;
    }

    let ticket, grade;
    try {
      ticket = await this.noTicketQuery(cetType, name, school);
      if(!ticket) {
        return this.fail('TICKET_NOT_FOUND');
      }

      grade = await this.queryGrade(name, ticket);
    } catch(e) {
      console.log("错误!", e);
      this.fail("INTERNAL_ERROR");
      return;
    }

    if (!grade) {
      this.fail('GRADE_NOT_FOUND');
      return;
    }

    this.success({
      name: name,
      school: school,
      ticket: this.rc4(ticket, rc4Pwd),
      grade: this.rc4(JSON.stringify(grade), rc4Pwd)
    }, rc4Pwd);
  }

}