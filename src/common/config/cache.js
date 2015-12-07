/**
 * Created at 15/12/6.
 * @Author Ling.
 * @Email i@zeroling.com
 */
export default {
    useCache: true,
    type: "redis", //缓存类型
    timeout: 2 * 3600, //失效时间，单位：秒
    adapter: { //不同 adapter 下的配置
        redis: {
            prefix: "cetb_"
        }
    }
};