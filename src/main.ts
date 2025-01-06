import "./style.css";
// import typescriptLogo from "./typescript.svg";
// import { setupCounter } from "../lib/main";
import { InitConfig } from "./best-call/index.d";
import BestCall from "./best-call";
// src/main.ts
const { createApp, ref, markRaw } = Vue;

const App = {
  template: `  
  <div>
  <button type="primary" @click="enter">签入</button>
    <button type="primary" @click="call">外呼</button>
    <button type="primary" @click="out">签出</button>
    <button type="primary" v-if="inCall">通话中</button>
    <button type="primary" @click="answer" v-if="isAnswer && !inCall">
      接听
    </button>
    <button type="primary" @click="mute">
      静音
    </button>
    <button type="primary" @click="unMute">
      取消静音
    </button>
    <button type="primary" @click="hold">
      保持
    </button>
    <button type="primary" @click="unHold">
      取消保持
    </button>
    <button type="primary" @click="hangup">挂断</button>
    </div>
    `,
  setup() {
    const sipClient = ref();
    const isAnswer = ref(false);
    const inCall = ref(false);
    const stateEventListener = (event: string, data: any) => {
      switch (event) {
        case "CONNECTED":
          console.log("连接成功", data);
          break;
        case "DISCONNECTED":
          console.log("连接失败", data);
          break;
        case "REGISTERED":
          console.log("注册成功", data);
          break;
        case "UNREGISTERED":
          console.log("取消注册", data);
          break;
        case "REGISTER_FAILED":
          console.log("注册失败", data);
          break;
        case "INCOMING_CALL":
          console.log("呼入振铃", data);
          isAnswer.value = true;
          break;
        case "OUTGOING_CALL":
          console.log("外呼中", data);
          break;
        case "IN_CALL":
          console.log("通话中", data);
          inCall.value = true;
          break;
        case "CALL_END":
          console.log("通话结束", data);
          isAnswer.value = false;
          inCall.value = false;
          break;
        case "HOLD":
          console.log("保持", data);
          break;
        case "UNHOLD":
          console.log("取消保持", data);
          break;
        case "MUTE":
          console.log("静音", data);
          break;
        case "UNMUTE":
          console.log("取消静音", data);
          break;
        case "LATENCY_STAT":
          console.log("统计", data);
          break;
        case "MIC_ERROR":
          console.log("错误", data);
          break;
      }
    };
    enum StunType {
      STUN = "stun",
      TURN = "turn",
    }
    const init = () => {
      console.log("初始化");
      try {
        const configuration: InitConfig = {
          host: "172.17.132.95",
          port: 5060,
          fsHost: "wss://172.17.132.95",
          fsPort: 7443,
          extNo: "1019",
          extPwd: "1019",
          stun: { type: StunType.STUN, host: "stun.l.google.com:19302" },
          checkMic: true,
          stateEventListener,
        };
        sipClient.value = markRaw(new BestCall(configuration));
      } catch (error) {
        console.log("初始化失败", error);
      }
    };
    const enter = () => {
      init();
    };
    const call = () => {
      sipClient.value?.call("1018");
    };
    const out = () => {
      sipClient.value?.unregister();
      sipClient.value?.cleanSdk();
    };
    const answer = () => {
      sipClient.value?.answer();
    };
    const hangup = () => {
      sipClient.value?.hangup();
    };
    const mute = () => {
      sipClient.value?.mute();
    }
    const unMute = () => {
      sipClient.value?.unmute()
    }
    const hold = () => {
      sipClient.value?.hold();
    }
    const unHold = () => {
      sipClient.value?.unhold();
    }
    return {
      enter,
      call,
      out,
      answer,
      hangup,
      mute,
      unMute,
      hold,
      unHold,
      stateEventListener,
      isAnswer,
      inCall,
    };
  },
};

createApp(App).mount("#app");
