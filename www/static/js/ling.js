/**
 * Created at 16/1/18.
 * @Author Ling.
 * @Email i@zeroling.com
 */

var api = {
    basic: '/api/v2/basic',
    config: '/api/v2/config',
    noTicket: '/api/v2/noticket'
};

var store = (function (ls) {
    function noop(){}
    if ('object' !== typeof ls) {
        return { set: noop, get: noop, getAll: noop, remove: noop, clear: noop };
    }

    var set = function (key, value) {
        if (undefined == value) {
            remove(key);
        } else {
            ls.setItem(key, JSON.stringify(value));
        }
    };
    var get = function (key) {
        var data = ls.getItem(key);
        if ('string' !== typeof data) {
            return undefined;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            return data || undefined;
        }
    };
    var getAll = function () {
        var ret = {}, _key;
        for (var i = 0; i < ls.length; i++) {
            _key = ls.key(i);
            ret[_key] = get(_key);
        }
        return ret;
    };
    var remove = function (key) {
        return ls.removeItem(key);
    };
    var clear = function () {
        return ls.clear();
    };
    return {
        set: set, get: get, getAll: getAll, remove: remove, clear: clear
    };
})(window.localStorage);
/**
 * swiper handle
 */
!function(){
    var tabsSwiper = new Swiper(".tabs-container", {
        speed: 500,
        onSlideChangeStart: function () {
            $(".tabs .active").removeClass("active");
            $(".tabs li").eq(tabsSwiper.activeIndex).addClass("active");
            $(".footer").css("top", $(".swiper-slide-active").height() + "px")
        }
    });
    $(".tabs").on("touchstart mousedown", 'li', function (e) {
        e.preventDefault();
        $(".tabs .active").removeClass("active");
        $(this).addClass("active");
        tabsSwiper.slideTo($(this).index());
    });
    $("input, select").on("touchstart touchend touchmove mousemove", function (e) {
        e.stopPropagation();
    });
    $('button').on('click', false);
}();

/**
 * main module
 */
!function ($, Vue) {
    var $container = $('.container');
    var $loadingCover = $('.loading-cover');
    function loadingEnd() {
        $container.removeClass('loading');
        $loadingCover.css('display', 'none');
    }

    /**
     * 加解密函数
     * @param data
     * @param key
     * @returns {string}
     */
    function encrypt (data, key) {
        var seq = new Array(256); //int
        var das = new Array(data.length); //code of data
        var i, j = "", x, temp, k;
        for (i = 0; i < 256; i++) {
            seq[i] = i;
            j = (j + seq[i] + key.charCodeAt(i % key.length)) % 256;
            temp = seq[i];
            seq[i] = seq[j];
            seq[j] = temp;
        }

        for (i = 0; i < data.length; i++) {
            das[i] = data.charCodeAt(i)
        }
        for (x = 0; x < das.length; x++) {
            i = (i + 1) % 256;
            j = (j + seq[i]) % 256;
            temp = seq[i];
            seq[i] = seq[j];
            seq[j] = temp;
            k = (seq[i] + (seq[j] % 256)) % 256;
            das[x] = String.fromCharCode(das[x] ^ seq[k]);
        }
        return das.join('');
    }
    var NOT_VALID_CODE = 345783475897349,
        NOT_VALID_DATE = 234232345238452,
        NOT_INIT = 673442364363456;
    function checkCode(code) {
        try {
            if (!window.__config['data']['date']) {return NOT_INIT;}
        } catch (e) {return NOT_INIT;}
        if (code.length !== 15) {
            return NOT_VALID_CODE;
        }
        if (code.substr(6, 3) != window.__config['data']['date']) {
            return NOT_VALID_DATE;
        }
        return true;
    }
    function checkName(name) {
        return !!(name + "").match(/^[\u4e00-\u9fa5]{2,}$/);
    }

    var $$result = new Vue({
        el: "#result",
        data: {
            name: "",
            school: "",
            type: "",
            tid: "",
            time: "",

            all: "",
            listening: "",
            reading: "",
            writing: "",
            show: false
        },
        methods: {
            back: function (e) {
                location.reload();
            }
        }
    });
    $$result.$watch('show', function (newVal) {
        if (newVal) {
            $('.tabs-container, .tabs').hide();
        } else {
            $('.tabs-container, .tabs').show();
        }
    });
    function showResult(resultObj) {
        $$result.name = resultObj.name;
        $$result.school = resultObj.school;
        $$result.time = "20" + resultObj.tid.substr(6, 2) + "年" + (resultObj.tid.substr(8, 1) == 1 ? "6" : "12") + "月";
        $$result.type = resultObj.tid.substr(9, 1) == 1 ? "英语四级" : "英语六级";
        $$result.tid = resultObj.tid;
        $$result.all = resultObj.all;
        $$result.listening = resultObj.listening;
        $$result.reading = resultObj.reading;
        $$result.writing = resultObj.writing;
        $$result.show = true;
    }
    var init = function () {
        loadingEnd();
        var provinces = [{
            text: "请选择省份",
            value: ""
        }];
        var s;
        for (s in window.__config.data.province) {
            provinces.push({text: s, value: s});
        }

        function querySuccessCallback(info) {
            if (!info || info.status != 0) {
                alert(info.info);
                return false;
            }

            var tid = encrypt(info.data.ticket, info.info);
            var realdata = JSON.parse(encrypt(info.data.grade, info.info));

            showResult({
                tid: tid, name: info.data.name, school: info.data.school,
                all: realdata.all, reading: realdata.reading, writing: realdata.writing, listening: realdata.listening
            });
        }

        function errorCallback () {
            alert("网络故障, 请重试");
        }

        var $$query = new Vue({
            el: "#query",
            data: {
                id: "",
                username: "",
                show: true,
                loading: false
            },
            methods: {
                query: function (e) {
                    e.preventDefault();
                    if ($$query.loading) {
                        return;
                    }
                    if (!checkName($$query.username)) {
                        alert("请输入正确的姓名!");
                        return false;
                    }

                    switch (checkCode($$query.id)) {
                        case NOT_INIT: alert("程序还未加载完成!");return false;
                        case NOT_VALID_CODE: alert("请输入正确的准考证号!");return false;
                        case NOT_VALID_DATE: alert("现在仅能查询" + window.__config.data.date.substr(0, 2) + '年' + (window.__config.data.date.substr(2, 1) == 1 ? "6" : "12") + "月的成绩");return false;
                    }

                    var formData = {
                        name: this.username,
                        ticket: this.id
                    };

                    $.ajax({
                        url: api.basic,
                        type: "POST",
                        data: formData,
                        timeout: 3000,
                        success: querySuccessCallback,
                        error: errorCallback,
                        beforeSend: function () {
                            $$query.loading = true;
                        },
                        complete: function () {
                            $$query.loading = false;
                        }
                    });
                }
            }
        });
        var $$noTicketQuery = new Vue({
            el: "#noTicketQuery",
            data: {
                username: "",
                province: "",
                school: "",
                type: "",
                provinces: provinces,
                schools: [{
                    text: "请先选择省份",
                    value: ""
                }],
                loading: false,
                show: true
            },
            methods: {
                query: function (e) {
                    e.preventDefault();
                    if ($$noTicketQuery.loading) {
                        return;
                    }
                    if (!checkName($$noTicketQuery.username)) {
                        alert("请输入正确的姓名!");
                        return false;
                    }

                    if (!$$noTicketQuery.province) {
                        alert("请选择省份!");
                        return false;
                    }

                    if (!$$noTicketQuery.school) {
                        alert("请选择学校!");
                        return false;
                    }

                    var formData = {
                        name: this.username,
                        school: this.school,
                        cetType: this.type
                    };

                    $.ajax({
                        url: api.noTicket,
                        type: "POST",
                        data: formData,
                        timeout: 3000,
                        success: querySuccessCallback,
                        error: errorCallback,
                        beforeSend: function () {
                            $$noTicketQuery.loading = true;
                        },
                        complete: function () {
                            $$noTicketQuery.loading = false;
                        }
                    });
                }
            }
        });
        $$noTicketQuery.$watch("province", function (province) {
            $$noTicketQuery["school"] = "";
            var tmpSchools;
            try {
                tmpSchools = window.__config.data.province[province][1].map(function (province) {
                    return {
                        text: province,
                        value: province
                    }
                });
            } catch (e) {
                return $$noTicketQuery["schools"] = [{
                    text: "请先选择省份",
                    value: ""
                }];
            }
            $$noTicketQuery["schools"] = tmpSchools;
        });
    };

    //init render
    if (store) {
        var storeConfig = store.get('cet-config-store');
        var storeConfigTimeout = !store.get('cet-config-time') && +new Date() - store.get('cet-config-time') > 1000 * 3600 * 24; // timeout 1 day.
        if (storeConfig && !storeConfigTimeout) {
            window.__config = storeConfig;
            init();
            return;
        }
    }

    if (!window.__config) {
        window.init = function () {
            store && store.set('cet-config-store', window.__config);
            store && store.set('cet-config-time', +new Date());
            init();
        };
    } else {
        store && store.set('cet-config-store', window.__config);
        store && store.set('cet-config-time', +new Date());
        init();
    }
}(Zepto, Vue);