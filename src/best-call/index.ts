import * as jssip from "jssip";
import { URI } from "jssip";
import { v4 as uuidv4 } from "uuid";
import {
  EndEvent,
  HoldEvent,
  IceCandidateEvent,
  IncomingEvent,
  OutgoingEvent,
  PeerConnectionEvent,
  RTCSession,
} from "jssip/lib/RTCSession";
import {
  IncomingMessageEvent,
  IncomingRTCSessionEvent,
  OutgoingMessageEvent,
  OutgoingRTCSessionEvent,
} from "jssip/lib/UA";
import {
  InitConfig,
  StunConfig,
  CallDirection,
  NetworkLatencyStat,
  StateListenerMessage,
  CallEndEvent,
  LatencyStat,
  CallDirectionEnum,
  State,
  CallExtraParam,
} from "./index.d";
import { version } from "../../package.json";
console.log("当前版本:", version);

export default class BestCall {
  //媒体控制
  private constraints = {
    audio: true,
    video: false,
  };
  //创建audio控件，播放声音的地方
  private audioView = document.createElement("audio");
  private ua: jssip.UA;
  private socket: jssip.WebSocketInterface;
  // 是否监测麦克风权限
  private checkMic: boolean;
  //当前坐席号码
  private localAgent: String;
  //对方号码
  // @ts-ignore
  private otherLegNumber: String | undefined;

  //呼叫中session:呼出、呼入、当前
  private outgoingSession: RTCSession | undefined;
  private incomingSession: RTCSession | undefined;
  private currentSession: RTCSession | undefined;

  //呼叫方向 outbound:呼出/inbound:呼入
  private direction: CallDirection | undefined;
  //当前通话uuid
  private currentCallId: String | undefined;

  //当前通话的网络延迟统计定时器(每秒钟获取网络情况)
  private currentLatencyStatTimer: number | undefined;
  private currentStatReport!: NetworkLatencyStat;

  private stunConfig: StunConfig | undefined;
  //回调函数
  private stateEventListener: Function | undefined;
  constructor(config: InitConfig) {
    this.localAgent = config.extNo;
    this.stunConfig = config.stun;
    this.checkMic = config.checkMic;
    if (config.stateEventListener !== null) {
      this.stateEventListener = config.stateEventListener;
    }
    if (config.checkMic) {
      this.micCheck();
    }
    const fsUrl = config.fsPort
      ? `${config.fsHost}:${config.fsPort}`
      : config.fsHost;

    this.socket = new jssip.WebSocketInterface(fsUrl);
    if (config.viaTransport) this.socket.via_transport = config.viaTransport;
    const uri = new URI("sip", config.extNo, config.host, config.port);
    // @ts-ignore
    jssip.C.SESSION_EXPIRES = 120;
    // @ts-ignore
    jssip.C.MIN_SESSION_EXPIRES = 120;
    const configuration = {
      sockets: [this.socket],
      // uri: `sip:${config.extNo}@${config.host}:${config.port}`,
      uri: uri.toString(),
      password: config.extPwd,
      register_expires: config.registerExpires || 300, // 注册过期时间，默认300秒
      session_timers: false,
      user_agent: "JsSIP 3.10.1",
      contact_uri: "",
      connection_recovery_max_interval: 2,
      connection_recovery_min_interval: 30,
      heartbeat_interval: 10,
    };
    uri.setParam("transport", "ws");
    configuration.contact_uri = uri.toString();
    if (config.debug) {
      jssip.debug.enable("JsSIP:*");
    } else {
      jssip.debug.disable();
    }
    this.ua = new jssip.UA(configuration);
    // websocket连接成功
    this.ua.on("connected", (_e) => {
      this.onChangeState(State.CONNECTED, null);
    });
    // websocket连接失败
    this.ua.on("disconnected", (e) => {
      this.ua.stop();
      if (e.error) {
        this.onChangeState(State.DISCONNECTED, {
          msg: "websocket连接失败,请检查地址或网络",
        });
      }
    });
    // 注册成功
    this.ua.on("registered", (_data) => {
      this.onChangeState(State.REGISTERED, { localAgent: this.localAgent });
    });
    // 取消注册
    this.ua.on("unregistered", (_e) => {
      this.ua.stop();
      this.onChangeState(State.UNREGISTERED, { localAgent: this.localAgent });
    });
    // 注册失败
    this.ua.on("registrationFailed", (e) => {
      this.onChangeState(State.REGISTER_FAILED, { msg: "注册失败" + e.cause });
    });
    // 注册到期前几秒触发
    this.ua.on("registrationExpiring", () => {
      this.ua.register();
    });
    // 电话事件监听
    this.ua.on(
      "newRTCSession",
      (data: IncomingRTCSessionEvent | OutgoingRTCSessionEvent) => {
        console.log("🚀 ~ BestCall ~ constructor ~ newRTCSession:", data);

        const session = data.session;
        let currentEvent: String;

        if (data.originator === "remote") {
          // 远程来电
          this.incomingSession = data.session;
          this.currentSession = this.incomingSession;
          this.direction = CallDirectionEnum.INBOUND;
          currentEvent = State.INCOMING_CALL;
        } else {
          // 外呼
          this.direction = CallDirectionEnum.OUTBOUND;
          currentEvent = State.OUTGOING_CALL;
        }
        session.on("peerconnection", (evt: PeerConnectionEvent) => {
          // 处理媒体流
          this.handleAudio(evt.peerconnection);
        });

        session.on("connecting", () => {
          console.log("connecting");
        });

        // 确保 ICE 候选者的正确处理
        let iceCandidateTimeout: number;
        session.on("icecandidate", (evt: IceCandidateEvent) => {
          if (iceCandidateTimeout) {
            clearTimeout(iceCandidateTimeout);
          }
          // srflx:stun服务发现的候选者,relay:turn服务发现的候选者
          if (
            evt.candidate.type === "srflx" ||
            evt.candidate.type === "relay"
          ) {
            evt.ready();
          }
          iceCandidateTimeout = setTimeout(evt.ready, 1000);
        });
        // 来电振铃
        session.on("progress", (_evt: IncomingEvent | OutgoingEvent) => {
          this.onChangeState(currentEvent, {
            direction: this.direction,
            otherLegNumber: data.request.from.uri.user,
            // @ts-ignore
            callId: data.request.call_id,
            calleeNumber: data.request.getHeader("Callee-Number"),
            callerNumber: data.request.getHeader("Caller-Number"),
            callerUuid: data.request.getHeader("Caller-Uuid"),
            queue: data.request.getHeader("Cc-Queue"),
            isTransfer: data.request.getHeader("X-Is-From-Transfer"),
          });
        });
        // 来电接通
        session.on("accepted", () => {
          this.onChangeState(State.IN_CALL, null);
        });
        // 来电挂断
        session.on("ended", (evt: EndEvent) => {
          const evtData: CallEndEvent = {
            answered: true,
            cause: evt.cause,
            // @ts-ignore
            code: evt.message?.status_code ?? 0,
            originator: evt.originator,
          };
          this.cleanCallingData();
          this.onChangeState(State.CALL_END, evtData);
        });
        // 来电失败
        session.on("failed", (evt: EndEvent) => {
          const evtData: CallEndEvent = {
            answered: false,
            cause: evt.cause,
            // @ts-ignore
            code: evt.message?.status_code ?? 0,
            originator: evt.originator,
          };
          this.cleanCallingData();
          this.onChangeState(State.CALL_END, evtData);
        });
        // 通话保持
        session.on("hold", (_evt: HoldEvent) => {
          this.onChangeState(State.HOLD, null);
        });
        // 通话恢复
        session.on("unhold", (_evt: HoldEvent) => {
          this.onChangeState(State.IN_CALL, null);
        });
      }
    );
    this.ua.on(
      "newMessage",
      (data: IncomingMessageEvent | OutgoingMessageEvent) => {
        switch (data.message.direction) {
          case "incoming":
            const body = data.request.body;
            if (!body) return;
            this.onChangeState(State.MESSAGE_INCOMING, body);
        }
      }
    );
    //启动UA
    this.ua.start();
  }
  // 清除通话数据
  private cleanCallingData() {
    this.outgoingSession = undefined;
    this.incomingSession = undefined;
    this.currentSession = undefined;
    this.direction = undefined;
    this.otherLegNumber = "";
    this.currentCallId = "";
    clearInterval(this.currentLatencyStatTimer);
    this.currentLatencyStatTimer = undefined;
    this.currentStatReport = {
      outboundPacketsSent: 0,
      outboundLost: 0,
      inboundLost: 0,
      inboundPacketsSent: 0,
    };
  }
  // 状态改变
  private onChangeState(
    event: String,
    data:
      | StateListenerMessage
      | CallEndEvent
      | LatencyStat
      | string
      | null
      | undefined
  ) {
    if (undefined === this.stateEventListener) {
      return;
    }
    this.stateEventListener(event, data);
  }

  // 处理媒体流
  private handleAudio(pc: RTCPeerConnection) {
    this.audioView.autoplay = true;
    // 网络情况统计
    this.currentStatReport = {
      outboundPacketsSent: 0,
      outboundLost: 0,
      inboundLost: 0,
      inboundPacketsSent: 0,
    };
    this.currentLatencyStatTimer = setInterval(() => {
      pc.getStats().then((stats) => {
        stats.forEach((report) => {
          if (report.type == "media-source") {
            this.currentStatReport.outboundAudioLevel = report.audioLevel;
          }
          if (
            report.type != "remote-inbound-rtp" &&
            report.type != "inbound-rtp" &&
            report.type != "remote-outbound-rtp" &&
            report.type != "outbound-rtp"
          ) {
            return;
          }
          switch (report.type) {
            case "outbound-rtp": // 客户端发送的-上行
              this.currentStatReport.outboundPacketsSent = report.packetsSent;
              break;
            case "remote-inbound-rtp": //服务器收到的-对于客户端来说也就是上行
              this.currentStatReport.outboundLost = report.packetsLost;
              //延时(只会在这里有这个)
              this.currentStatReport.roundTripTime = report.roundTripTime;
              break;
            case "inbound-rtp": //客户端收到的-下行
              this.currentStatReport.inboundLost = report.packetsLost;
              this.currentStatReport.inboundAudioLevel = report.audioLevel;
              break;
            case "remote-outbound-rtp": //服务器发送的-对于客户端来说就是下行
              this.currentStatReport.inboundPacketsSent = report.packetsSent;
              break;
          }
        });
        let ls: LatencyStat = {
          latencyTime: 0,
          upLossRate: 0,
          downLossRate: 0,
          downAudioLevel: 0,
          upAudioLevel: 0,
        };

        if (this.currentStatReport.inboundAudioLevel != undefined) {
          ls.downAudioLevel = this.currentStatReport.inboundAudioLevel;
        }
        if (this.currentStatReport.outboundAudioLevel != undefined) {
          ls.upAudioLevel = this.currentStatReport.outboundAudioLevel;
        }

        if (
          this.currentStatReport.inboundLost &&
          this.currentStatReport.inboundPacketsSent
        ) {
          ls.downLossRate =
            this.currentStatReport.inboundLost /
            this.currentStatReport.inboundPacketsSent;
        }
        if (
          this.currentStatReport.outboundLost &&
          this.currentStatReport.outboundPacketsSent
        ) {
          ls.upLossRate =
            this.currentStatReport.outboundLost /
            this.currentStatReport.outboundPacketsSent;
        }
        if (this.currentStatReport.roundTripTime != undefined) {
          ls.latencyTime = Math.floor(
            this.currentStatReport.roundTripTime * 1000
          );
        }
        console.debug(
          "上行/下行(丢包率):" +
            (ls.upLossRate * 100).toFixed(2) +
            "% / " +
            (ls.downLossRate * 100).toFixed(2) +
            "%",
          "延迟:" + ls.latencyTime.toFixed(2) + "ms"
        );
        this.onChangeState(State.LATENCY_STAT, ls);
      });
    }, 1000);

    if ("addTrack" in pc) {
      pc.ontrack = (media) => {
        if (media.streams.length > 0 && media.streams[0].active) {
          this.audioView.srcObject = media.streams[0];
        }
      };
    } else {
      // @ts-ignore
      pc.onaddstream = (media: { stream: any }) => {
        const remoteStream = media.stream;
        if (remoteStream.active) {
          this.audioView.srcObject = remoteStream;
        }
      };
    }
  }
  // 检查当前通话是否可用
  private checkCurrentCallIsActive(): boolean {
    if (!this.currentSession || !this.currentSession.isEstablished()) {
      this.onChangeState(State.ERROR, {
        msg: "当前通话不存在或已销毁，无法执行该操作。",
      });
      return false;
    }
    return true;
  }
  //注册请求
  public register() {
    if (this.ua.isConnected()) {
      this.ua.register();
    } else {
      this.onChangeState(State.ERROR, {
        msg: "websocket尚未连接，请先连接ws服务器.",
      });
    }
  }
  //取消注册
  public unregister() {
    if (this.ua && this.ua.isConnected() && this.ua.isRegistered()) {
      this.ua.unregister({ all: true });
    } else {
      this.onChangeState(State.ERROR, { msg: "尚未注册，操作禁止." });
    }
  }
  // 清理
  public cleanSdk() {
    this.cleanCallingData();
    this.ua.stop();
  }
  // 发送消息
  public sendMessage = (target: string, content: string) => {
    let options = {
      contentType: "text/plain",
    };
    this.ua.sendMessage(target, content, options);
  };
  // ICE 服务器的设置
  public getCallOptionPcConfig(): RTCConfiguration | undefined {
    if (this.stunConfig && this.stunConfig.type && this.stunConfig.host) {
      if ("turn" === this.stunConfig.type) {
        return {
          iceTransportPolicy: "all",
          iceServers: [
            {
              username: this.stunConfig.username,
              // @ts-ignore
              credentialType: "password",
              credential: this.stunConfig.password,
              urls: [this.stunConfig.type + ":" + this.stunConfig.host],
            },
          ],
        };
      } else {
        return {
          iceTransportPolicy: "all",
          iceServers: [
            {
              urls: [this.stunConfig.type + ":" + this.stunConfig.host],
            },
          ],
        };
      }
    } else {
      return undefined;
    }
  }
  // 呼叫事件
  public call(phone: string, param: CallExtraParam = {}) {
    this.checkMic && this.micCheck();
    this.currentCallId = uuidv4();
    if (this.ua && this.ua.isRegistered()) {
      const extraHeaders: string[] = ["X-JCallId: " + this.currentCallId];
      if (param) {
        if (param.businessId) {
          extraHeaders.push("X-JBusinessId: " + param.businessId);
        }
        if (param.outNumber) {
          extraHeaders.push("X-JOutNumber: " + param.outNumber);
        }
      }
      this.outgoingSession = this.ua.call(phone, {
        eventHandlers: {
          peerconnection: (e: { peerconnection: RTCPeerConnection }) => {
            this.handleAudio(e.peerconnection);
          },
        },
        mediaConstraints: this.constraints,
        extraHeaders,
        sessionTimersExpires: 120,
        pcConfig: this.getCallOptionPcConfig(),
      });
      this.currentSession = this.outgoingSession;
      this.otherLegNumber = phone;
      return this.currentCallId;
    } else {
      this.onChangeState(State.ERROR, { msg: "请在注册成功后再发起外呼请求." });
      return "";
    }
  }
  // 应答事件
  public answer() {
    const time = new Date();
    console.log("currentSession:", this.currentSession, time);
    if (this.currentSession) {
      console.log("currentSession statusStart:", this.currentSession.status, time);
      console.log("isInProgress:", this.currentSession.isInProgress(), time);
      console.log("isEnded:", this.currentSession.isEnded(), time);
    }
    if (this.currentSession && this.currentSession.isInProgress()) {
      this.currentSession.answer({
        mediaConstraints: this.constraints,
        pcConfig: this.getCallOptionPcConfig(),
      });
      console.log("currentSession statusEnd:", this.currentSession.status, time);
    } else {
      this.onChangeState(State.ERROR, {
        msg: "非法操作，通话尚未建立或状态不正确，请勿操作",
      });
    }
  }
  // 挂断
  public hangup() {
    if (this.currentSession && !this.currentSession.isEnded()) {
      this.currentSession.terminate();
    } else {
      this.onChangeState(State.ERROR, {
        msg: "当前通话不存在，无法执行挂断操作。",
      });
    }
  }

  // 保持
  public hold() {
    if (!this.currentSession || !this.checkCurrentCallIsActive()) {
      return;
    }
    this.currentSession.hold();
  }
  //取消保持
  public unhold() {
    if (!this.currentSession || !this.checkCurrentCallIsActive()) {
      return;
    }
    if (!this.currentSession.isOnHold()) {
      return;
    }
    this.currentSession.unhold();
  }
  // 静音
  public mute() {
    if (!this.currentSession || !this.checkCurrentCallIsActive()) {
      return;
    }
    this.currentSession.mute();
    this.onChangeState(State.MUTE, null);
  }
  //取消静音
  public unmute() {
    if (!this.currentSession || !this.checkCurrentCallIsActive()) {
      return;
    }
    this.currentSession.unmute();
    this.onChangeState(State.UNMUTE, null);
  }
  //转接
  public transfer(phone: string) {
    if (!this.currentSession || !this.checkCurrentCallIsActive()) {
      return;
    }
    this.currentSession.refer(phone);
  }
  //发送按键
  public sendDtmf(tone: string) {
    if (this.currentSession) {
      this.currentSession.sendDTMF(tone, {
        duration: 160,
        interToneGap: 1200,
        extraHeaders: [],
      });
    }
  }
  // 检测麦克风
  public micCheck() {
    if (!navigator.mediaDevices) {
      this.onChangeState(State.MIC_ERROR, {
        msg: "麦克风检测异常,请检查麦克风权限是否开启,是否在HTTPS站点",
      });
      return;
    }
    navigator.mediaDevices
      .getUserMedia(this.constraints)
      .then((_) => {
        console.log("麦克风获取成功");
        _.getTracks().forEach((track) => {
          track.stop();
        });
      })
      .catch(() => {
        // 拒绝
        this.onChangeState(State.MIC_ERROR, {
          msg: "麦克风检测异常,请检查麦克风",
        });
      });
  }
}
