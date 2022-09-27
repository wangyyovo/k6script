import grpc from 'k6/net/grpc';
import exec from 'k6/execution';
import { Trend } from 'k6/metrics';
import crypto from 'k6/crypto';
import { check } from 'k6';
import http from 'k6/http';
import { htmlReport } from "https://ghproxy.com/raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

let body = readlocalFile(__ENV.body);
let proto_path = __ENV.proto_path;
let proto_file = __ENV.proto_file;

const client = new grpc.Client();
client.load(parseProtoPath(proto_path), proto_file);
const grpcReqConnectingTrend = new Trend('grpc_req_connecting', true);

export function setup() {
  body = body || readRemoteFile(__ENV.body);
  let url = __ENV.url;
  let address = __ENV.address;

  let timestamp =  Math.floor(new Date().getTime() / 1000).toString()
  let username = __ENV.un
  let method = "/"+__ENV.op
  let passwd = __ENV.pd
  let hash = crypto.md5(method+JSON.stringify(body)+timestamp+username+passwd, 'hex');

  let params = {
      metadata: {
          'x-md-local-username': username,
          'x-md-local-method': method,
          'x-md-local-time': timestamp,
          'x-md-local-hash': hash
      },
  };

  return {body,url,address,params}
}

export const options = {
  // discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)', 'count'],
};


export default (data) => {

  if (__ITER == 0) {

    let startTime = new Date() - new Date(exec.scenario.startTime);
    client.connect(data.address, {
      plaintext: true // 服务器没有配置证书需要将plaintext设为true,默认是false
    });
    let endTime = new Date() - new Date(exec.scenario.startTime);

    grpcReqConnectingTrend.add(endTime - startTime);
  }

  const response = client.invoke(data.url, data.body,data.params);

  check(response, {
    'status is OK': (r) => r && r.status === grpc.StatusOK,
  });
};


export function teardown () {
  client.close();
}


function readlocalFile(fileName) {
  let body;
  fileName = `${__ENV.test_dir}/${fileName}`
  if ((fileName.indexOf("http://")==-1) && (fileName.indexOf("https://")==-1)) {
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

function parseProtoPath(paths) {
  let result = [];
  let dirs = paths.split(',');

  for (let index = 0; index < dirs.length; index++) {
    result[index] = __ENV.test_dir + "/" + dirs[index];
  }

  return result;
}


export function handleSummary(data) {
  return {
    'result.html': htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
