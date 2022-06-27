import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

let body = readlocalFile(__ENV.body)

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
  body = body || readRemoteFile(__ENV.body)
  const type = __ENV.type
  const method = __ENV.method;
  const url = __ENV.url;

  if (url == undefined || url == '') {
    exec.test.abort('api参数没有设置');
  }

  if (type == undefined || type == '') {
    type = 'application/json';
  }

  const headers = { 'Content-Type': `${type}` };

  return {url,method,body,type,headers}
}

export default function (data) {

  let res;
  switch(data.method) {
    case 'get':
      res = http.get(data.url, JSON.stringify(data.body), { headers: data.headers });
      break;
    case 'post':
      res = http.post(data.url, JSON.stringify(data.body), { headers: data.headers });
      break;
    case 'put':
      res = http.put(data.url, JSON.stringify(data.body), { headers: data.headers });
      break;
    case 'patch':
      res = http.patch(data.url, JSON.stringify(data.body), { headers: data.headers });
      break;
    case 'del':
      res = http.del(data.url, JSON.stringify(data.body), { headers: data.headers });
      break;

    default:
      exec.test.abort('method参数错误');
  } 

  check(res, {
    'response code was 200': (res) => res.status == 200,
    'err': (res) => res.body.includes('"result":10000'),
  });
}


function readlocalFile(fileName) {
  let body;
  if ((fileName.indexOf("http://")==-1) && (fileName.indexOf("https://")==-1)) {
    body = JSON.parse(open(fileName));
  }
  return body
}

function readRemoteFile(fileName) {
  let body;
  if ((fileName.indexOf("http://")!=-1) || (fileName.indexOf("https://")!=-1)) {
    const resp = http.get('https://jslib.k6.io/httpx/0.0.6/index.js');
    body = resp.body;
  }
  return body
}
