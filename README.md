# best-call

基于 JsSIP 实现的 webrtc 电话条，用于 web 端语音通话

### 安装

```bash
npm install best-call
```

#### 初始化

初始化加载 sdk 的参数说明：

| 参数               | 类型     | 说明                                                      | 是否必填               |
| ------------------ | -------- | --------------------------------------------------------- | ---------------------- |
| host               | string   | sip 服务器地址                                            | 必填项                 |
| port               | number   | sip 服务器端口                                            | 必填项                 |
| fsHost             | string   | freeswitch 服务器地址                                     | 必填项                 |
| fsPort             | number   | freeswitch 服务器地址服务器端口                           | 必填项                 |
| extNo              | string   | 分机账号                                                  | 必填项                 |
| extPwd             | string   | 分机密码                                                  | 必填项                 |
| checkMic           | boolean  | 麦克风检测                                                | 必填项                 |
| stun               | Object   | stun 服务器配置                                           | 选填项                 |
| stateEventListener | Function | 状态回调函数方法 参照文档下方 stateEventListener 详细说明 | 必填项，需注入状态回调 |

```javascript
import BestCall, { InitConfig } from "best-call";

const bestCall: BestCall;

/**
 * @description: 回调函数，所有状态都会通过这个函数返回
 * @param {string} event 事件状态名称,通过类型文件里的State枚举获取
 * @param {object} data 事件数据,一些报错信息或页面需要用到的数据
 */
const stateEventListener = (event, data) => {
  switch (event) {
    case "ERROR":
      break;
    case "CONNECTED":
      break;
    default:
  }
};
// 初始化配置信息(详情请看InitConfig类型定义)
  enum StunType {
    STUN = "stun",
    TURN = "turn",
  }
const config: InitConfig = {
  host: "127.0.0.1",
  port: "5066",
  fsHost:"127.0.0.1",
  fsPort: "5066",
  extNo: "1001",
  extPwd: "1234",
  stun:{
    type: StunType.STUN,
    host: "stun.l.google.com:19302"
  },
  checkMic: true,
  stateEventListener: stateEventListener,
};
// 初始化
this.bestCall = new BestCall(config);
```

#### 接听

```javascript
this.bestCall.answer();
```

#### 退出

```javascript
this.bestCall.unregister();
this.bestCall.cleanSdk();
```

## 流程说明

### 1、初始化

1、检查麦克风权限

2、调用初始化方法
this.bestCall = new BestCall(config)，建议用户登录业务系统的时候就进行初始化，要求全局唯一，切记不能每次拨打电话的时候都初始化一次。

3、收到回调事件「REGISTERED」表示注册成功。错误处理：监听事件，收到「DISCONNECTED」、「REGISTER_FAILED」做出相应提示

## 文档说明

提供如下方法：

| 函数       | 调用方式                  | 说明                                                      |
| ---------- | ------------------------- | --------------------------------------------------------- |
| 初始化     | new BestCall(config)      |                                                           |
| 销毁 SDK   | cleanSDK()                |                                                           |
| 检查麦克风 | micCheck()                | 异步接口，若麦克风异常会回调 MIC_ERROR 事件               |
| 注册       | register()                |                                                           |
| 取消注册   | unregister()              |                                                           |
| 呼叫请求   | call(phone,extraParam={}) | phone 为外呼号码，extraParam 为可选的扩展参数（可以不传） |
| 挂断电话   | hangup()                  |                                                           |
| 应答接听   | answer()                  |                                                           |
| 保持       | hold()                    |                                                           |
| 取消保持   | unhold()                  |                                                           |
| 转接通话   | transfer(phone)           |                                                           |
| 按键       | sendDtmf(tone)            | 按键或二次拨号                                            |

### 状态回调（stateEventListener）

前端注入状态回调函数，通过状态回调 控制页面按钮显示

stateEventListener 回调参数为 event, data

| Event 事件列表              | 返回值                                                                                                                                                             | 状态说明           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| MIC_ERROR                   | {msg: xxxx}                                                                                                                                                        | 麦克风检测异常     |
| ERROR                       | {msg: xxxx}                                                                                                                                                        | 错误异常           |
| CONNECTED                   | {localAgent: '1001'}                                                                                                                                               | 连接成功           |
| DISCONNECTED                | 无返回值                                                                                                                                                           | websocket 连接失败 |
| REGISTERED                  | 无返回值                                                                                                                                                           | 注册成功           |
| UNREGISTERED                | 无返回值                                                                                                                                                           | 取消注册           |
| REGISTER_FAILED             | {msg: xxxx}                                                                                                                                                        | 注册失败           |
| INCOMING_CALL/OUTGOING_CALL | {direction: 'inbound', otherLegNumber: '138xxxxxxxx', 'callId': 'xxxxxxx'} 说明：direction 为呼叫方向：inbound 呼入，outbound 呼出；otherLegNumber：第三方呼叫记录 | 呼入振铃/外呼响铃  |
| IN_CALL                     | 无返回值                                                                                                                                                           | 通话中             |
| HOLD                        | 无返回值                                                                                                                                                           | 保持中             |
| CALL_END                    | CallEndEvent                                                                                                                                                       | 通话结束           |

### CallEndEvent

| 属性       | 必须 | 类型    | 说明                                              |
| ---------- | ---- | ------- | ------------------------------------------------- |
| answered   | 是   | boolean | 是否接通(以后端为准)                              |
| originator | 是   | string  | 发起方(挂断方):local 本地(自己),remote 远程(对方) |
| cause      | 是   | string  | 挂断原因                                          |
| code       | 否   | number  | 当 originator=remote，且 answered=false 时存在    |
