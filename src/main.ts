import "./style.css";
// import typescriptLogo from "./typescript.svg";
// import { setupCounter } from "../lib/main";
import { InitConfig } from "./best-call/index.d";
import BestCall from "./best-call";
// src/main.ts
const { createApp, ref, markRaw } = Vue;

const App = {
  template: `<div>
               <button @click="login">签入</button>
             </div>`,
  setup() {
    const sipClient = ref();
    const stateEventListener = (event: String, data: any) => {
      console.log("event:", event, data);
      switch (event) {
        case "CONNECTED":
          console.log("连接成功");
          // sipClient.value.register()
          break;
        case "REGISTERED":
          console.log("注册成功");
      }
    };
    const configuration: InitConfig = {
      host: "172.17.132.95",
      port: 5060,
      fsHost: "ws://172.17.132.95",
      fsPort: 5066,
      extNo: "1001",
      extPwd: "1001",
      stun: { type: "stun", host: "stun.l.google.com:19302" },
      checkMic: true,
      stateEventListener,
    };

    const login = () => {
      sipClient.value = markRaw(new BestCall(configuration));
      console.log("login", sipClient.value);
    };

    return { login, stateEventListener };
  },
};

createApp(App).mount("#app");
