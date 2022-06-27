import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

let body = readlocalFile(__ENV.body)

export const options = {

};

export function setup() {
  body = body || readRemoteFile(__ENV.body)
  const method = __ENV.method;
  const url = __ENV.url;
 // const headers = JSON.parse(__ENV.header);

 const headers = {
  "Content-Type":"application/json"
 }

  return {url,method,body,headers}
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
    fileName = `${__ENV.cur_dir}/${fileName}`
    body = JSON.parse(open(fileName));
  }
  return body
}

function readRemoteFile(fileName) {
  let body;
  if ((fileName.indexOf("http://")!=-1) || (fileName.indexOf("https://")!=-1)) {
    const resp = http.get(fileName);
    body = resp.body;
  }
  return body
}
