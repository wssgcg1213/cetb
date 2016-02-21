/**
 * cet api version 2.0 2015-12-02
 * author Ling/
 */

'use strict';
import Base from './base.js';
import cet from 'ling-cet-decoder';
const pjson = require(think.ROOT_PATH + '/package.json').config;
const rc4Pwd = "请联系 i@ilcl.me";

export default class extends Base {

  /**
   * 前置方法
   * @return {Promise} []
   */
  async __before(){
    if (this.http.action === "config") {
      return;
    }
    //规则: 30s内只能访问5次
    const whiteList = {
      "127.0.0.1": true
    };
    let ip = this.ip();
    if (true !== whiteList[ip]) { //不在白名单里 查缓存
      let cacheKey = `ip-${ip}`;
      let cachedTimes = await this.cache(cacheKey) || 0;
      if (cachedTimes < 5) {
        await this.cache(cacheKey, cachedTimes + 1, {timeout: 30/* 单位：秒 */});
      } else {
        return this.fail("TOO_MANY_TIMES");
      }
    }
  }

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
  async basicAction () {
    let name = this.post('name').replace("\b", ''),
        ticket = this.post('ticket').replace("\b", '');
    //防止名字超长越界
    if (!name || name.length > 15) {
      this.fail('NAME_NOT_VALID');
      return;
    }

    //防止名字超长越界
    if (!ticket || ticket.length != 15) {
      this.fail('TICKET_NOT_VALID');
      return;
    }

    let gradeResult, grade, school;
    try {
      gradeResult = await this.queryGrade(name, ticket);
      school = gradeResult && gradeResult[0];
      grade = gradeResult && gradeResult[1];
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

  /**
   * public action
   * /api/v2/noticket
   * 无准考证查询
   * @param: 姓名, 学校
   * @return 考试成绩
   */
  async noticketAction () {
    let name = this.post('name').replace("\b", ''),
        school = this.post('school').replace("\b", ''),
        cetType = this.post('cetType').replace("\b", '') || 1;//1 = CET4, 2 = CET6

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

    let ticket, gradeResult, grade;
    try {
      ticket = await this.noTicketQuery(cetType, name, school);
      if(!ticket) {
        return this.fail('TICKET_NOT_FOUND');
      }

      gradeResult = await this.queryGrade(name, ticket, school);
      grade = gradeResult && gradeResult[1];
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

  configAction () {
    this.success({
      province: cet.province,
      date: pjson['enable'],
      enableNoTicket: pjson['enableNoTicket']
    });
  }
}