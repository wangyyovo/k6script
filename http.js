import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

let url = __ENV.api;
let method = __ENV.method;
let body = JSON.parse(open(__ENV.file));
let type = __ENV.type

// export const options = {
//   vus: 60, 			// 模拟10个虚拟用户(VU)
//   duration: '2s', 	// 连续压测30秒
//   //iterations: 10000,
// };
export const options = {

  // thresholds: {
  //   http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
  // },
};

export function setup() {
  if (url == undefined || url == '') {
    exec.test.abort('api参数没有设置');
  }

  if (type == undefined || type == '') {
    type = 'application/json';
  }

  return {url,method,body,type}
}

export default function (data) {

  const headers = { 'Content-Type': `${data.type}` };

  let res;
  switch(method) {
    case 'get':
      res = http.get(data.url, JSON.stringify(data.body), { headers: headers });
      break;
    case 'post':
      res = http.post(data.url, JSON.stringify(data.body), { headers: headers });
      break;
    case 'put':
      res = http.put(data.url, JSON.stringify(data.body), { headers: headers });
      break;
    case 'patch':
      res = http.patch(data.url, JSON.stringify(data.body), { headers: headers });
      break;
    case 'del':
      res = http.del(data.url, JSON.stringify(data.body), { headers: headers });
      break;

    default:
      exec.test.abort('method参数错误');
  } 

  check(res, {
    'response code was 200': (res) => res.status == 200,
    'err': (res) => res.body.includes('"result":10000'),
  });
}

