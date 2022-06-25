import grpc from 'k6/net/grpc';
import exec from 'k6/execution';
import { Trend } from 'k6/metrics';
import { check } from 'k6';



let body = JSON.parse(open(__ENV.file));
let proto_path = __ENV.proto_path
let proto_file = __ENV.proto_file
let url = __ENV.url
let address = __ENV.address

const client = new grpc.Client();
client.load(proto_path.split(','), proto_file);
const grpcReqConnectingTrend = new Trend('grpc_req_connecting', true);





export function setup() {
 return {body,url,address}
}

export const options = {
  discardResponseBodies: true,
  // scenarios: {
  //   contacts: {
  //     executor: 'constant-vus',
  //     vus: 1,
  //     duration: '2s',
  //     gracefulStop: '3s',
  //   },

  // },
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

  // request data
  // const data = {
  //   amount: 30,
  //   area_id: 1,
  //   buy_count: 3,
  //   extend_info: {
  //     Body: "2088102104143406",
  //     Subject: "充值卡"
  //   },
  //   merchandise_code: "10095",
  //   no_split: true,
  //   order_type: 0,
  //   pay_id: 1181,
  //   pay_service_id: 1181,
  //   server_id: 11,
  //   sign: {
  //     app: "app",
  //     sign: "exercitation in non",
  //     time: "sunt irure ullamco"
  //   },
  //   store_orderSerial: "111111111111",
  //   user_ip: "192.168.249.34",
  //   user_name: "qatest220407000010"
  // };

  const response = client.invoke(data.url, data.body);

  check(response, {
    'status is OK': (r) => r && r.status === grpc.StatusOK,
  });

  // console.log(JSON.stringify(response.message));
  // client.close();
};


// export function teardown () {
//   client.close();
// }


