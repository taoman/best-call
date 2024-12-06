import "./style.css";
// import typescriptLogo from "./typescript.svg";
// import { setupCounter } from "../lib/main";
import { InitConfig } from "./sipCall/index.d";
import SipCall from "./sipCall";
// src/main.ts
const { createApp, ref } = Vue;

const App = {
  template: `<div>
               <button @click="changeMessage">签入</button>
             </div>`,
  setup() {
    const message = ref("Hello, Vue 3!");
    const stateEventListener = (event: String, data: any) => {
      console.log("event:", event, data);
    };
    const configuration: InitConfig = {
      host: "172.17.132.95",
      port: 5080,
      fsHost: "ws://172.17.132.95",
      fsPort: 5066,
      extNo: "1001",
      extPwd: "1234",
      stun: { type: "stun" },
      checkMic: true,
      stateEventListener,
    };

    const changeMessage = () => {
      // message.value = "你点击了按钮!";
      const sipClient = new SipCall(configuration);
      console.log("sipClient:", sipClient);
    };

    return { message, changeMessage, stateEventListener };
  },
};

createApp(App).mount("#app");
