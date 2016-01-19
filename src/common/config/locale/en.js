'use strict';

export default {
    NORMAL: [200, 'ok'],
    SCHOOL_NOT_VALID: [8000, "没有找到该学校, 请检查或者联系i@zeroling.com"],
    NAME_NOT_VALID: [8001, "名字太长不支持"],
    INTERNAL_ERROR: [8002, "系统异常"],
    GRADE_NOT_FOUND: [8003, "没有找到你的成绩, 请检查并重试"],
    TICKET_NOT_FOUND: [8004, "没有找到你的准考证号, 请检查并重试"],
    TICKET_NOT_VALID: [8005, "准考证号非法!"],
    METHOD_NOT_ALLOWED: [404, "this api is not allowed to access"],
    TOO_MANY_TIMES: [503, "你在短时间内尝试了太多次数, 请等待30秒后重试."], //短时间内大量访问限制
    FUCK: [666, "FXXK YOU!"] //呵呵 ban
};