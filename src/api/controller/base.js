'use strict';
import cet from 'ling-cet-decoder';
import request from 'request-promise';
import iconv from 'iconv-lite';
import cheerio from 'cheerio';

const searchUrl = 'http://find.cet.99sushe.com/search';
async function api99Sushe(name, ticket) {
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
      all = listening + writing + reading;
  if (all == scoreArr[4]) {
    return {
      listening: listening,
      writing: writing,
      reading: reading,
      all: all
    }
  } else {
    return false;
  }
}
async function apiChsi(name, ticket) {
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
    return {
      listening: listening,
      writing: writing,
      reading: reading,
      all: all
    }
  } else {
    return false;
  }
}


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
    let bodyBuf = await request({
      method: 'POST',
      url: searchUrl,
      encoding: null,
      body: cet.getEncryptReqBody(cetType, school, name)
    });
    return cet.decryptResBody(bodyBuf).toString();
  }

  /**
   *
   * @param name
   * @param ticket
   * @returns {{reading: number, listening: number, writing: number, all: number}}
     */
  async queryGrade(name, ticket) {
    //let choose = Math.floor(Math.random() * apis.length);
    return await apiChsi(name, ticket);
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