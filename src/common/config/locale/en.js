'use strict';

export default {
    METHOD_NOT_ALLOWED: [404, "this api is not allowed to access"],
    TOO_MANY_TIMES: [503, "you are trying too many times in a while"], //短时间内大量访问限制
    FUCK: [666, "FXXK YOU!"] //呵呵 ban
};