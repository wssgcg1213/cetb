'use strict';
/**
 * model
 */
export default class extends think.model.base {
    init(...args){
        super.init(...args);
        this.pk = "ticket"; //将主键字段设置为 ticket
    }
}