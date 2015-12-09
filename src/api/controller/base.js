'use strict';
import cet from 'ling-cet-decoder';
import request from 'request-promise';
import iconv from 'iconv-lite';
import cheerio from 'cheerio';

const searchUrl = 'http://find.cet.99sushe.com/search';
const cacheEnable = (think.config('cache') || {useCache: false})['useCache'];
const nth = think.config().nth;

async function api99Sushe(name, ticket) {
  console.log("remote api call through 99Sushe", name, ticket);
  const url = "http://cet.99sushe.com/find";
  let nameGBK = iconv.encode(name.slice(0, 2), 'gbk')
      .toJSON().data
      .map(d => "%" + d.toString(16).toUpperCase())
      .join('');

  let bodyBuf = await request({
    method: "POST",
    uri: url,
    body: `id=${ticket}&name=${nameGBK}`,
    headers: {
      'Referer': 'http://cet.99sushe.com/',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.10 Safari/537.36'
    },
    encoding: null
  });
  let scoreArr = iconv.decode(bodyBuf, 'GBK').split(',');
  let listening = parseFloat(scoreArr[1]),
      writing = parseFloat(scoreArr[2]),
      reading = parseFloat(scoreArr[3]),
      all = listening + writing + reading,
      school = scoreArr[5];
  if (all == scoreArr[4]) {
    return [school, {
      listening: listening,
      writing: writing,
      reading: reading,
      all: all
    }];
  } else {
    return false;
  }
}
async function apiChsi(name, ticket) {
  console.log("remote api call through chsi.com.cn", name, ticket);
  const _url = `http://www.chsi.com.cn/cet/query?zkzh=${ticket}&xm=${encodeURIComponent(name.slice(0, 3))}`;
  const bodyBuf = await request({
    uri:_url,
    gzip: true,
    headers: {
      'Referer': 'http://www.chsi.com.cn/cet/',
      'Accept-Encoding': 'gzip'
    }
  });
  let $ = cheerio.load(bodyBuf);
  let school = $('.cetTable tr:nth-child(2) td').text();
  let _rawStrArr = $('.cetTable tr:last-child').html().split("<br>");
  let scoreArr = _rawStrArr.map(s => {
    return (s.replace('color666', '')
        .replace(/[\t\n\r]*/g, '')
        .replace(/&#([^;]+)/g, '')
        .match(/([0-9]+)/g) || [false])[0];
  });
  let all = parseFloat(scoreArr[0]),
      listening = parseFloat(scoreArr[1]),
      reading = parseFloat(scoreArr[2]),
      writing = parseFloat(scoreArr[3]);
  if (all === listening + reading + writing) {
    return [school, {
      listening: listening,
      writing: writing,
      reading: reading,
      all: all
    }];
  } else {
    return false;
  }
}
let apiSources = [
  api99Sushe, apiChsi
];

export default class extends think.controller.base {
  /**
   * some base method in here
   */

  /**
   * 检查school名称合法性
   * @param school
   * @returns {boolean}
     */
  checkSchoolValid(school) {
    return !!cet.getProvinceCodeFromSchoolName(school);
  }

  /**
   * 无准考证查询准考证号
   * @param cetType
   * @param name
   * @param school
   * @returns {string}
     */
  async noTicketQuery(cetType, name, school) {
    const ticketCacheKey = `ticket-${cetType}-${name}-${school}`;
    if (cacheEnable) {
      let cachedTicket = await this.cache(ticketCacheKey);
      if (cachedTicket && cachedTicket.length === 15 && cachedTicket.substr(6, 3) == nth) {
        return cachedTicket;
      }
    }

    let modelNoTicket = this.model('no_ticket');
    let dbData = await modelNoTicket.where({name: name, school: school, cetType: cetType, nth: nth}).find().catch(()=> false);
    let id = dbData && dbData.id;
    if (dbData && dbData.ticket) {
      if (cacheEnable) {
        await this.cache(ticketCacheKey, dbData.ticket);
      }
      return dbData.ticket;
    }

    let bodyBuf = await request({
      method: 'POST',
      url: searchUrl,
      encoding: null,
      body: cet.getEncryptReqBody(cetType, school, name)
    });
    let ticket = cet.decryptResBody(bodyBuf).toString();

    if (ticket && ticket.length === 15) {
      if (cacheEnable) {
        await this.cache(ticketCacheKey, ticket);
      }
      if (id) {
        await modelNoTicket.where({id: id}).update({name: name, school: school, cetType: cetType, ticket: ticket, nth: nth}).catch(()=>false);
      } else {
        await modelNoTicket.add({name: name, school: school, cetType: cetType, ticket: ticket, nth: nth}).catch(()=>false);
      }

      return ticket;
    } else {
      return false;
    }
  }

  /**
   * 选择具体的源
   * @param name
   * @param ticket
   * @returns {{reading: number, listening: number, writing: number, all: number}}
     */
  async queryGrade(name, ticket, school) {
    //cache
    const gradeCacheKey = `grade-${name}-${ticket}`;
    if (cacheEnable) {
      let cachedGrade = await this.cache(gradeCacheKey);
      if (cachedGrade) {
        return cachedGrade;
      }
    }

    //database
    let modelCet = this.model('cet');
    let dbData = await modelCet.where({ticket: ticket}).find().catch(()=>false);
    let gradeObj = {
      all: dbData && dbData.all,
      reading: dbData && dbData.reading,
      writing: dbData && dbData.writing,
      listening: dbData && dbData.listening
    };
    let returnObj = [dbData && dbData.school, gradeObj];
    if (dbData && dbData.all != null) {
      if (cacheEnable) {
        await this.cache(gradeCacheKey, returnObj);
      }
      return returnObj;
    }

    //remote
    let choose = Math.floor(Math.random() * apiSources.length);
    let _api = apiSources[choose];
    let _remoteGradeObj = await _api(name, ticket);
    if ('object' !== typeof _remoteGradeObj) {
      return false;
    }
    let remoteGradeObj = _remoteGradeObj[1];
    school = school || _remoteGradeObj[0];

    if (remoteGradeObj && remoteGradeObj.all != null) {
      if (cacheEnable) {
        await this.cache(gradeCacheKey, _remoteGradeObj);
      }
      await modelCet.add({
        ticket: ticket,
        name: name,
        all: remoteGradeObj.all,
        listening: remoteGradeObj.listening,
        reading: remoteGradeObj.reading,
        writing: remoteGradeObj.writing,
        school: school
      }).catch(()=>{});

      return _remoteGradeObj;
    } else {
      return false;
    }
  }

  rc4 (data, key) {
    let seq = new Array(256); //int
    let das = new Array(data.length); //code of data
    let i, j = "", x, temp, k;
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
}