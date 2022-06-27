import grpc from 'k6/net/grpc';
import exec from 'k6/execution';
import { Trend } from 'k6/metrics';
import { check } from 'k6';
import http from 'k6/http';

let body = readlocalFile(__ENV.body)
let proto_path = __ENV.proto_path
let proto_file = __ENV.proto_file

const client = new grpc.Client();
client.load(proto_path.split(','), proto_file);
const grpcReqConnectingTrend = new Trend('grpc_req_connecting', true);

export function setup() {
  body = body || readRemoteFile(__ENV.body)
  let url = __ENV.url
  let address = __ENV.address

  return {body,url,address}
}

export const options = {
  // discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)', 'count'],
};


export default (data) => {

  if (__ITER == 0) {

    let startTime = new Date() - new Date(exec.scenario.startTime);
    client.connect(data.address, {
      plaintext: true // 鏈嶅姟鍣ㄦ病鏈夐厤缃瘉涔﹂渶瑕佸皢plaintext璁句负true,榛樿鏄痜alse
    });
    let endTime = new Date() - new Date(exec.scenario.startTime);

    grpcReqConnectingTrend.add(endTime - startTime);
  }

  const response = client.invoke(data.url, data.body);

  check(response, {
    'status is OK': (r) => r && r.status === grpc.StatusOK,
  });
};


export function teardown () {
  client.close();
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
