// node_modules/.pnpm/@vkontakte+vk-bridge@3.0.2/node_modules/@vkontakte/vk-bridge/dist/index.js
function createCounter() {
  return {
    current: 0,
    next() {
      return ++this.current;
    }
  };
}
function createRequestResolver(instanceId) {
  const counter = createCounter();
  const promiseControllers = {};
  return {
    add(controller, customId) {
      const id = null != customId ? customId : `${counter.next()}_${instanceId}`;
      promiseControllers[id] = controller;
      return id;
    },
    resolve(requestId, data, isSuccess) {
      const requestPromise = promiseControllers[requestId];
      if (requestPromise) {
        if (isSuccess(data)) requestPromise.resolve(data);
        else requestPromise.reject(data);
        promiseControllers[requestId] = null;
      }
    }
  };
}
function promisifySend(sendEvent, subscribe, instanceId) {
  const requestResolver = createRequestResolver(instanceId);
  subscribe((event) => {
    if (!event.detail?.data || "object" != typeof event.detail.data) return;
    if ("request_id" in event.detail.data) {
      const { request_id: requestId, ...data } = event.detail.data;
      if (requestId) requestResolver.resolve(requestId, data, (data2) => !("error_type" in data2));
    }
  });
  return function(method, props = {}) {
    return new Promise((resolve, reject) => {
      const requestId = requestResolver.add({
        resolve,
        reject
      }, props.request_id);
      sendEvent(method, {
        ...props,
        request_id: requestId
      });
    });
  };
}
function createInstanceId() {
  const allNumbersAndLetters = 36;
  const positionAfterZeroAnDot = 2;
  const keyLength = 3;
  return Math.random().toString(allNumbersAndLetters).substring(positionAfterZeroAnDot, positionAfterZeroAnDot + keyLength);
}
var IS_CLIENT_SIDE = "u" > typeof window;
var IS_ANDROID_WEBVIEW = Boolean(IS_CLIENT_SIDE && window.AndroidBridge);
var IS_IOS_WEBVIEW = Boolean(IS_CLIENT_SIDE && window.webkit?.messageHandlers?.VKWebAppClose);
var IS_REACT_NATIVE_WEBVIEW = Boolean(IS_CLIENT_SIDE && window.ReactNativeWebView && "function" == typeof window.ReactNativeWebView.postMessage);
var IS_WEB = IS_CLIENT_SIDE && !IS_ANDROID_WEBVIEW && !IS_IOS_WEBVIEW;
var IS_MVK = IS_WEB && /(^\?|&)vk_platform=mobile_web(&|$)/.test(location.search);
var IS_DESKTOP_VK = IS_WEB && !IS_MVK;
var EVENT_TYPE = IS_WEB ? "message" : "VKWebAppEvent";
var DESKTOP_METHODS = [
  "VKWebAppInit",
  "VKWebAppGetCommunityAuthToken",
  "VKWebAppAddToCommunity",
  "VKWebAppAddToHomeScreenInfo",
  "VKWebAppClose",
  "VKWebAppCopyText",
  "VKWebAppCreateHash",
  "VKWebAppGetUserInfo",
  "VKWebAppSetLocation",
  "VKWebAppSendToClient",
  "VKWebAppGetClientVersion",
  "VKWebAppGetPhoneNumber",
  "VKWebAppGetEmail",
  "VKWebAppGetGroupInfo",
  "VKWebAppGetGeodata",
  "VKWebAppGetCommunityToken",
  "VKWebAppGetConfig",
  "VKWebAppGetLaunchParams",
  "VKWebAppSetTitle",
  "VKWebAppGetAuthToken",
  "VKWebAppCallAPIMethod",
  "VKWebAppJoinGroup",
  "VKWebAppLeaveGroup",
  "VKWebAppAllowMessagesFromGroup",
  "VKWebAppDenyNotifications",
  "VKWebAppAllowNotifications",
  "VKWebAppOpenPayForm",
  "VKWebAppOpenApp",
  "VKWebAppShare",
  "VKWebAppShowWallPostBox",
  "VKWebAppScroll",
  "VKWebAppShowOrderBox",
  "VKWebAppShowLeaderBoardBox",
  "VKWebAppShowInviteBox",
  "VKWebAppShowRequestBox",
  "VKWebAppAddToFavorites",
  "VKWebAppShowStoryBox",
  "VKWebAppStorageGet",
  "VKWebAppStorageGetKeys",
  "VKWebAppStorageSet",
  "VKWebAppFlashGetInfo",
  "VKWebAppSubscribeStoryApp",
  "VKWebAppOpenWallPost",
  "VKWebAppCheckAllowedScopes",
  "VKWebAppCheckBannerAd",
  "VKWebAppHideBannerAd",
  "VKWebAppShowBannerAd",
  "VKWebAppCheckNativeAds",
  "VKWebAppShowNativeAds",
  "VKWebAppRetargetingPixel",
  "VKWebAppConversionHit",
  "VKWebAppShowSubscriptionBox",
  "VKWebAppCheckSurvey",
  "VKWebAppShowSurvey",
  "VKWebAppScrollTop",
  "VKWebAppScrollTopStart",
  "VKWebAppScrollTopStop",
  "VKWebAppShowSlidesSheet",
  "VKWebAppTranslate",
  "VKWebAppRecommend",
  "VKWebAppAddToProfile",
  "VKWebAppGetFriends",
  ...IS_DESKTOP_VK ? [
    "VKWebAppResizeWindow",
    "VKWebAppAddToMenu",
    "VKWebAppShowInstallPushBox",
    "VKWebAppShowCommunityWidgetPreviewBox",
    "VKWebAppCallStart",
    "VKWebAppCallJoin",
    "VKWebAppCallGetStatus"
  ] : [
    "VKWebAppShowImages"
  ]
];
var supportedHandlers;
var androidBridge = IS_CLIENT_SIDE ? window.AndroidBridge : void 0;
var iosBridge = IS_IOS_WEBVIEW ? window.webkit.messageHandlers : void 0;
var webBridge = IS_WEB ? parent : void 0;
function createVKBridge(version) {
  let webFrameId;
  const subscribers = [];
  const instanceId = createInstanceId();
  function send(method, props) {
    if (androidBridge?.[method]) androidBridge[method](JSON.stringify(props));
    else if (iosBridge?.[method] && "function" == typeof iosBridge[method].postMessage) iosBridge[method].postMessage?.(props);
    else if (IS_REACT_NATIVE_WEBVIEW) window.ReactNativeWebView.postMessage(JSON.stringify({
      handler: method,
      params: props
    }));
    else if (webBridge && "function" == typeof webBridge.postMessage) webBridge.postMessage({
      handler: method,
      params: props,
      type: "vk-connect",
      webFrameId,
      connectVersion: version
    }, "*");
  }
  function subscribe(listener) {
    subscribers.push(listener);
  }
  function unsubscribe(listener) {
    const index = subscribers.indexOf(listener);
    if (index > -1) subscribers.splice(index, 1);
  }
  function supportsInner(method) {
    if (IS_ANDROID_WEBVIEW) return !!(androidBridge && "function" == typeof androidBridge[method]);
    if (IS_IOS_WEBVIEW) return !!(iosBridge?.[method] && "function" == typeof iosBridge[method].postMessage);
    if (IS_WEB) return DESKTOP_METHODS.includes(method);
    return false;
  }
  function supports(method) {
    console.warn("bridge.supports method is deprecated. Use bridge.supportsAsync instead.");
    return supportsInner(method);
  }
  function isWebView() {
    return IS_IOS_WEBVIEW || IS_ANDROID_WEBVIEW;
  }
  function isIframe() {
    return IS_WEB && window.parent !== window;
  }
  function isEmbedded() {
    return isWebView() || isIframe();
  }
  function isStandalone() {
    return !isEmbedded();
  }
  function handleEvent(event) {
    if (IS_IOS_WEBVIEW || IS_ANDROID_WEBVIEW) return [
      ...subscribers
    ].map((fn) => fn.call(null, event));
    let bridgeEventData = event?.data;
    if (!IS_WEB || !bridgeEventData) return;
    if (IS_REACT_NATIVE_WEBVIEW && "string" == typeof bridgeEventData) try {
      bridgeEventData = JSON.parse(bridgeEventData);
    } catch {
    }
    const { type, data, frameId } = bridgeEventData;
    if (!type) return;
    if ("VKWebAppSettings" === type) {
      webFrameId = frameId;
      return;
    }
    [
      ...subscribers
    ].map((fn) => fn({
      detail: {
        type,
        data
      }
    }));
  }
  if (IS_REACT_NATIVE_WEBVIEW && /(android)/i.test(navigator.userAgent)) document.addEventListener(EVENT_TYPE, handleEvent);
  else if ("u" > typeof window && "addEventListener" in window) window.addEventListener(EVENT_TYPE, handleEvent);
  const sendPromise = promisifySend(send, subscribe, instanceId);
  async function supportsAsync(method) {
    if (IS_ANDROID_WEBVIEW || IS_IOS_WEBVIEW) return supportsInner(method);
    if (supportedHandlers) return supportedHandlers.has(method);
    try {
      const response = await sendPromise("SetSupportedHandlers");
      supportedHandlers = new Set(response.supportedHandlers);
    } catch (_error) {
      supportedHandlers = /* @__PURE__ */ new Set([
        "VKWebAppInit"
      ]);
    }
    return supportedHandlers.has(method);
  }
  subscribe((event) => {
    if (!event.detail) return;
    switch (event.detail.type) {
      case "SetSupportedHandlers":
        supportedHandlers = new Set(event.detail.data.supportedHandlers);
    }
  });
  return {
    send: sendPromise,
    sendPromise,
    subscribe,
    unsubscribe,
    supports,
    supportsAsync,
    isWebView,
    isIframe,
    isEmbedded,
    isStandalone
  };
}
var package_namespaceObject = {
  rE: "3.0.2"
};
var src_bridge = createVKBridge(package_namespaceObject.rE);
var dist_default = src_bridge;

// platform-entry.js
var VK_APP_ID = 54626490;
var launch = new URLSearchParams(location.search);
var inVK = launch.has("vk_app_id") || launch.has("api_id") || window.parent !== window;
if (inVK) {
  dist_default.send("VKWebAppInit").catch(() => {
  });
  if (launch.has("api_id") && launch.has("viewer_id")) {
    const sdk = document.createElement("script");
    sdk.src = "https://vk.com/js/api/xd_connection.js?2";
    sdk.async = true;
    sdk.onload = () => window.VK?.init(() => {
    }, () => {
    }, "5.199");
    document.head.append(sdk);
  }
}
async function inviteVK() {
  if (!inVK) throw new Error("\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F \u0412\u041A \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u043F\u0440\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0435 \u0438\u0433\u0440\u044B \u0432\u043D\u0443\u0442\u0440\u0438 \u0412\u041A.");
  return Promise.race([dist_default.send("VKWebAppShowInviteBox", {}), new Promise((_, reject) => setTimeout(() => reject(new Error("\u0412\u041A \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B. \u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439 \u0441\u0441\u044B\u043B\u043A\u0443 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F.")), 1e4))]);
}
function inviteLink(kind, code) {
  const value = kind + "=" + encodeURIComponent(code);
  return inVK ? "https://vk.ru/app" + VK_APP_ID + "#" + value : location.origin + location.pathname + "?" + value;
}
function launchValue(key) {
  const hash = new URLSearchParams(location.hash.slice(1)), request = new URLSearchParams(launch.get("request_key") || "");
  return launch.get(key) || hash.get(key) || request.get(key);
}
export {
  VK_APP_ID,
  inVK,
  inviteLink,
  inviteVK,
  launchValue
};
