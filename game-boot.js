(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };

  // ads-bridge.js
  async function playRewardedAd(bridge) {
    const available = await bridge.send("VKWebAppCheckNativeAds", { ad_format: "reward" });
    if ((available == null ? void 0 : available.result) !== true) throw new Error("\u0421\u0435\u0439\u0447\u0430\u0441 \u043D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0439 \u0440\u0435\u043A\u043B\u0430\u043C\u044B. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u043F\u043E\u0437\u0436\u0435.");
    const shown = await bridge.send("VKWebAppShowNativeAds", { ad_format: "reward" });
    if ((shown == null ? void 0 : shown.result) !== true) throw new Error("\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u043D\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D. \u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u043D\u0435 \u0432\u044B\u0434\u0430\u043D\u0430.");
    return true;
  }
  var init_ads_bridge = __esm({
    "ads-bridge.js"() {
    }
  });

  // ../обитель/node_modules/.pnpm/@vkontakte+vk-bridge@3.0.2/node_modules/@vkontakte/vk-bridge/dist/index.js
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
      var _a2;
      if (!((_a2 = event.detail) == null ? void 0 : _a2.data) || "object" != typeof event.detail.data) return;
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
  function createVKBridge(version) {
    let webFrameId;
    const subscribers = [];
    const instanceId = createInstanceId();
    function send(method, props) {
      var _a2, _b2;
      if (androidBridge == null ? void 0 : androidBridge[method]) androidBridge[method](JSON.stringify(props));
      else if ((iosBridge == null ? void 0 : iosBridge[method]) && "function" == typeof iosBridge[method].postMessage) (_b2 = (_a2 = iosBridge[method]).postMessage) == null ? void 0 : _b2.call(_a2, props);
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
      if (IS_IOS_WEBVIEW) return !!((iosBridge == null ? void 0 : iosBridge[method]) && "function" == typeof iosBridge[method].postMessage);
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
      let bridgeEventData = event == null ? void 0 : event.data;
      if (!IS_WEB || !bridgeEventData) return;
      if (IS_REACT_NATIVE_WEBVIEW && "string" == typeof bridgeEventData) try {
        bridgeEventData = JSON.parse(bridgeEventData);
      } catch (e) {
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
  var IS_CLIENT_SIDE, IS_ANDROID_WEBVIEW, _a, _b, IS_IOS_WEBVIEW, IS_REACT_NATIVE_WEBVIEW, IS_WEB, IS_MVK, IS_DESKTOP_VK, EVENT_TYPE, DESKTOP_METHODS, supportedHandlers, androidBridge, iosBridge, webBridge, package_namespaceObject, src_bridge, dist_default;
  var init_dist = __esm({
    "../\u043E\u0431\u0438\u0442\u0435\u043B\u044C/node_modules/.pnpm/@vkontakte+vk-bridge@3.0.2/node_modules/@vkontakte/vk-bridge/dist/index.js"() {
      IS_CLIENT_SIDE = "u" > typeof window;
      IS_ANDROID_WEBVIEW = Boolean(IS_CLIENT_SIDE && window.AndroidBridge);
      IS_IOS_WEBVIEW = Boolean(IS_CLIENT_SIDE && ((_b = (_a = window.webkit) == null ? void 0 : _a.messageHandlers) == null ? void 0 : _b.VKWebAppClose));
      IS_REACT_NATIVE_WEBVIEW = Boolean(IS_CLIENT_SIDE && window.ReactNativeWebView && "function" == typeof window.ReactNativeWebView.postMessage);
      IS_WEB = IS_CLIENT_SIDE && !IS_ANDROID_WEBVIEW && !IS_IOS_WEBVIEW;
      IS_MVK = IS_WEB && /(^\?|&)vk_platform=mobile_web(&|$)/.test(location.search);
      IS_DESKTOP_VK = IS_WEB && !IS_MVK;
      EVENT_TYPE = IS_WEB ? "message" : "VKWebAppEvent";
      DESKTOP_METHODS = [
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
      androidBridge = IS_CLIENT_SIDE ? window.AndroidBridge : void 0;
      iosBridge = IS_IOS_WEBVIEW ? window.webkit.messageHandlers : void 0;
      webBridge = IS_WEB ? parent : void 0;
      package_namespaceObject = {
        rE: "3.0.2"
      };
      src_bridge = createVKBridge(package_namespaceObject.rE);
      dist_default = src_bridge;
    }
  });

  // platform-entry.js
  async function currentVKUser() {
    if (!inVK) return null;
    try {
      return await withTimeout(dist_default.send("VKWebAppGetUserInfo", {}), "\u0412\u041A \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u043D\u0430 \u0437\u0430\u043F\u0440\u043E\u0441 \u043F\u0440\u043E\u0444\u0438\u043B\u044F.");
    } catch (e) {
      return null;
    }
  }
  async function syncVKFriends(api2) {
    if (!inVK) throw new Error("\u041E\u0442\u043A\u0440\u043E\u0439 \u0438\u0433\u0440\u0443 \u0432\u043D\u0443\u0442\u0440\u0438 VK, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0434\u0440\u0443\u0437\u0435\u0439 VK.");
    const result = await withTimeout(dist_default.send("VKWebAppGetAuthToken", { app_id: VK_APP_ID, scope: "friends" }), "VK \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u043D\u0430 \u0437\u0430\u043F\u0440\u043E\u0441 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u0434\u0440\u0443\u0437\u044C\u044F\u043C.");
    if (!(result == null ? void 0 : result.access_token)) throw new Error("VK \u043D\u0435 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u0438\u043B \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u0434\u0440\u0443\u0437\u044C\u044F\u043C.");
    return api2("friends/vk-sync", { accessToken: result.access_token });
  }
  function inviteLink(kind, code) {
    const value = kind + "=" + encodeURIComponent(code);
    return inVK ? "https://vk.ru/app" + VK_APP_ID + "#" + value : location.origin + location.pathname + "?" + value;
  }
  function launchValue(key2) {
    const hash = new URLSearchParams(location.hash.slice(1)), request = new URLSearchParams(launch.get("request_key") || "");
    return launch.get(key2) || hash.get(key2) || request.get(key2);
  }
  async function showRewardedAd() {
    if (!inVK) throw new Error("\u0420\u0435\u043A\u043B\u0430\u043C\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u043D\u0443\u0442\u0440\u0438 VK");
    return playRewardedAd(dist_default);
  }
  var VK_APP_ID, launch, inVK, withTimeout, canSyncVKFriendsSilently;
  var init_platform_entry = __esm({
    "platform-entry.js"() {
      init_ads_bridge();
      init_dist();
      VK_APP_ID = 54626490;
      launch = new URLSearchParams(location.search);
      inVK = launch.has("vk_app_id") || launch.has("api_id") || dist_default.isEmbedded() || Boolean(window.ReactNativeWebView);
      if (inVK && !window.__obitelVKStarted) {
        window.__obitelVKStarted = true;
        window.__obitelVKState = "waiting";
        dist_default.send("VKWebAppInit").then(() => {
          window.__obitelVKState = "ready";
        }).catch(() => {
          window.__obitelVKState = "failed";
        });
        if (launch.has("api_id") && launch.has("viewer_id")) {
          const sdk = document.createElement("script");
          sdk.src = "https://vk.com/js/api/xd_connection.js?2";
          sdk.async = true;
          sdk.onload = () => {
            var _a2;
            return (_a2 = window.VK) == null ? void 0 : _a2.init(() => {
            }, () => {
            }, "5.199");
          };
          document.head.append(sdk);
        }
      }
      withTimeout = (promise, message) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(message)), 1e4))]);
      canSyncVKFriendsSilently = () => inVK && (launch.get("vk_access_token_settings") || "").split(",").includes("friends");
    }
  });

  // vehicles.js
  var VEHICLES, vehicleFor;
  var init_vehicles = __esm({
    "vehicles.js"() {
      VEHICLES = [
        ["nomad", "\u041A\u043E\u0447\u0435\u0432\u043D\u0438\u043A", "\u0412\u043D\u0435\u0434\u043E\u0440\u043E\u0436\u043D\u0438\u043A", 1, 0, 0, 0, 0, "\u041F\u0435\u0440\u0432\u0430\u044F \u043C\u043E\u0431\u0438\u043B\u044C\u043D\u0430\u044F \u0431\u0430\u0437\u0430. \u041D\u0430\u0434\u0451\u0436\u043D\u044B\u0439 \u043A\u0443\u0437\u043E\u0432 \u0438 \u0432\u0441\u0451 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E\u0435 \u0434\u043B\u044F \u0432\u044B\u043B\u0430\u0437\u043A\u0438."],
        ["spark", "\u0418\u0441\u043A\u0440\u0430", "\u0425\u044D\u0442\u0447\u0431\u0435\u043A", 2, 1200, 2, 0, 3, "\u041B\u0451\u0433\u043A\u0430\u044F \u043C\u0430\u0448\u0438\u043D\u0430 \u0434\u043B\u044F \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0445 \u0440\u0435\u0439\u0441\u043E\u0432 \u0437\u0430 \u043F\u0440\u0438\u043F\u0430\u0441\u0430\u043C\u0438."],
        ["hauler", "\u0414\u043E\u0431\u044B\u0442\u0447\u0438\u043A", "\u041F\u0438\u043A\u0430\u043F", 4, 2600, 0, 3, 6, "\u041E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u043A\u0443\u0437\u043E\u0432 \u0438 \u043A\u0440\u0435\u043F\u043B\u0435\u043D\u0438\u044F \u0434\u043B\u044F \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u0433\u0440\u0443\u0437\u0430."],
        ["medic", "\u0421\u0430\u043D\u0438\u0442\u0430\u0440", "\u041C\u0435\u0434\u0438\u0446\u0438\u043D\u0441\u043A\u0438\u0439 \u0444\u0443\u0440\u0433\u043E\u043D", 6, 4400, 0, 8, 2, "\u0423\u0441\u0438\u043B\u0435\u043D\u043D\u0430\u044F \u0437\u0430\u0449\u0438\u0442\u0430 \u0434\u043B\u044F \u043E\u043F\u0430\u0441\u043D\u044B\u0445 \u0441\u043F\u0430\u0441\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0445 \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u043E\u0432."],
        ["dune", "\u0411\u0430\u0440\u0445\u0430\u043D", "\u0411\u0430\u0433\u0433\u0438", 10, 7200, 7, 0, 4, "\u041B\u0451\u0433\u043A\u0430\u044F \u0440\u0430\u043C\u0430 \u0438 \u043C\u043E\u0449\u043D\u0430\u044F \u043E\u0440\u0443\u0436\u0435\u0439\u043D\u0430\u044F \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u0441\u0442\u0430\u043D\u0446\u0438\u044F."],
        ["trail", "\u0421\u043B\u0435\u0434\u043E\u043F\u044B\u0442", "\u0423\u043D\u0438\u0432\u0435\u0440\u0441\u0430\u043B", 15, 10400, 3, 4, 8, "\u042D\u043A\u0441\u043F\u0435\u0434\u0438\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0431\u0430\u0433\u0430\u0436\u043D\u0438\u043A \u0434\u043B\u044F \u0434\u043E\u043B\u0433\u0438\u0445 \u0441\u0431\u043E\u0440\u043E\u0432 \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432."],
        ["interceptor", "\u041F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A", "\u041F\u0430\u0442\u0440\u0443\u043B\u044C\u043D\u044B\u0439 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044C", 25, 16e3, 9, 4, 0, "\u0411\u043E\u0435\u0432\u043E\u0439 \u0432\u044B\u0435\u0437\u0434: \u0432\u044B\u0441\u043E\u043A\u0438\u0439 \u0443\u0440\u043E\u043D \u043F\u0440\u0438 \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u043E\u043C \u0433\u0440\u0443\u0437\u043E\u0432\u043E\u043C \u043E\u0442\u0441\u0435\u043A\u0435."],
        ["tow", "\u0422\u044F\u0433\u0430\u0447", "\u042D\u0432\u0430\u043A\u0443\u0430\u0442\u043E\u0440", 40, 23200, 2, 7, 10, "\u041B\u0435\u0431\u0451\u0434\u043A\u0430 \u0438 \u0433\u0440\u0443\u0437\u043E\u0432\u0430\u044F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u0434\u043B\u044F \u0442\u044F\u0436\u0451\u043B\u044B\u0445 \u0442\u0440\u043E\u0444\u0435\u0435\u0432."],
        ["ranger", "\u0415\u0433\u0435\u0440\u044C", "\u042D\u043A\u0441\u043F\u0435\u0434\u0438\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0434\u0436\u0438\u043F", 60, 32800, 7, 7, 7, "\u0421\u0431\u0430\u043B\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0431\u0430\u0437\u0430 \u0434\u043B\u044F \u043B\u044E\u0431\u043E\u0433\u043E \u0440\u0430\u0439\u043E\u043D\u0430 \u0433\u043E\u0440\u043E\u0434\u0430."],
        ["vault", "\u0421\u0435\u0439\u0444", "\u0411\u0440\u043E\u043D\u0435\u0444\u0443\u0440\u0433\u043E\u043D", 90, 46e3, 3, 13, 5, "\u0411\u0440\u043E\u043D\u0435\u043F\u043B\u0438\u0442\u044B \u0434\u043B\u044F \u0432\u044B\u0436\u0438\u0432\u0430\u043D\u0438\u044F \u043F\u043E\u0434 \u0434\u0430\u0432\u043B\u0435\u043D\u0438\u0435\u043C \u043E\u0440\u0434\u044B."],
        ["engineer", "\u041C\u043E\u043D\u0442\u0430\u0436\u043D\u0438\u043A", "\u0421\u0435\u0440\u0432\u0438\u0441\u043D\u044B\u0439 \u0433\u0440\u0443\u0437\u043E\u0432\u0438\u043A", 130, 62e3, 5, 7, 13, "\u041C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u0430\u044F \u043D\u0430 \u043A\u043E\u043B\u0451\u0441\u0430\u0445. \u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u043F\u043E\u043B\u0435\u0437\u043D\u043E\u0439 \u0434\u043E\u0431\u044B\u0447\u0438."],
        ["bastion", "\u0411\u0430\u0441\u0442\u0438\u043E\u043D", "\u0411\u0440\u043E\u043D\u0435\u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442\u0451\u0440", 200, 84e3, 10, 14, 3, "\u0428\u0435\u0441\u0442\u044C \u043A\u043E\u043B\u0451\u0441 \u0438 \u0442\u044F\u0436\u0451\u043B\u0430\u044F \u0437\u0430\u0449\u0438\u0442\u0430 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0434\u043E\u0432\u043E\u0439."],
        ["command", "\u041A\u043E\u043C\u0435\u043D\u0434\u0430\u043D\u0442", "\u041A\u043E\u043C\u0430\u043D\u0434\u043D\u044B\u0439 \u0430\u0432\u0442\u043E\u0431\u0443\u0441", 300, 112e3, 12, 10, 10, "\u041F\u043E\u0434\u0432\u0438\u0436\u043D\u044B\u0439 \u0448\u0442\u0430\u0431 \u0434\u043B\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0438\u0440\u0430 \u0443\u0431\u0435\u0436\u0438\u0449\u0430."],
        ["ark", "\u041A\u043E\u0432\u0447\u0435\u0433", "\u042D\u043A\u0441\u043F\u0435\u0434\u0438\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0433\u0440\u0443\u0437\u043E\u0432\u0438\u043A", 450, 152e3, 10, 15, 15, "\u0414\u0430\u043B\u044C\u043D\u0438\u0435 \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u044B \u0438 \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0437\u0430\u043F\u0430\u0441 \u043F\u0440\u043E\u0447\u043D\u043E\u0441\u0442\u0438."]
      ].map(([id, name, type, level, cost, damage, hp, loot2, description], art3) => ({ id, name, type, level, cost, damage, hp, loot: loot2, description, art: art3 }));
      for (const [id, name, type, base, votes] of [
        ["silver", "\u0421\u0435\u0440\u0435\u0431\u0440\u044F\u043D\u044B\u0439 \u0441\u043B\u0435\u0434", "\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043A\u0443\u043F\u0435", 6, 25],
        ["crimson", "\u0411\u0430\u0433\u0440\u043E\u0432\u044B\u0439 \u0437\u0430\u043A\u0430\u0442", "\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043C\u0430\u0441\u043B\u043A\u0430\u0440", 4, 20],
        ["phantom", "\u0424\u0430\u043D\u0442\u043E\u043C", "\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0440\u0430\u043B\u043B\u0438-\u043A\u0430\u0440", 8, 35],
        ["arctic", "\u041F\u043E\u043B\u044F\u0440\u043D\u0438\u043A", "\u0410\u0440\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0433\u0440\u0443\u0437\u043E\u0432\u0438\u043A", 10, 45],
        ["sovereign", "\u0421\u0443\u0432\u0435\u0440\u0435\u043D", "\u0411\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u043B\u0438\u043C\u0443\u0437\u0438\u043D", 11, 55],
        ["horizon", "\u0413\u043E\u0440\u0438\u0437\u043E\u043D\u0442", "\u041C\u043E\u0431\u0438\u043B\u044C\u043D\u0430\u044F \u043B\u0430\u0431\u043E\u0440\u0430\u0442\u043E\u0440\u0438\u044F", 13, 65]
      ]) {
        const v = VEHICLES[base];
        VEHICLES.push({ ...v, id, name, type, cost: 0, votes, base, art: VEHICLES.length, description: "\u041E\u0441\u043E\u0431\u044B\u0439 \u043A\u0443\u0437\u043E\u0432. \u0411\u043E\u043D\u0443\u0441\u044B \u043A\u0430\u043A \u0443 \xAB" + v.name + "\xBB, \u0431\u0435\u0437 \u043F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u0430 \u0437\u0430 \u043E\u043F\u043B\u0430\u0442\u0443." });
      }
      vehicleFor = (s) => VEHICLES.find((v) => v.id === s.vehicle) || VEHICLES[0];
    }
  });

  // balance.js
  function restoreEnergy(s, now = Date.now()) {
    var _a2, _b2;
    s.energy = Math.min(ENERGY_MAX, Math.max(0, (_a2 = s.energy) != null ? _a2 : ENERGY_MAX));
    s.energyAt = Math.min(now, (_b2 = s.energyAt) != null ? _b2 : now);
    if (s.energy >= ENERGY_MAX) {
      s.energyAt = now;
      return s.energy;
    }
    const recovered = Math.floor((now - s.energyAt) / ENERGY_INTERVAL);
    s.energy = Math.min(ENERGY_MAX, s.energy + recovered);
    if (s.energy === ENERGY_MAX) s.energyAt = now;
    else s.energyAt += recovered * ENERGY_INTERVAL;
    return s.energy;
  }
  function sprintStep(stamina, exhausted, wantsRun, moving, dt) {
    if (exhausted && stamina >= 30) exhausted = false;
    const running = wantsRun && moving && !exhausted && stamina > 0;
    stamina = Math.max(0, Math.min(100, stamina + (running ? -24 : 17) * dt));
    if (stamina === 0) exhausted = true;
    return { stamina, exhausted, running: running && stamina > 0, multiplier: running ? 1.65 : 1 };
  }
  function expeditionReward(map, kills, loot2, win, multiplier = 1) {
    const bounded = Math.max(0, Math.min(Math.ceil(kills * 8 / 3), Math.floor(Number(loot2) || 0)));
    return Math.round((win ? MAPS[map].reward / 3 + bounded : bounded * 0.35) * multiplier);
  }
  function expeditionDrop(random = Math.random, healthDropped = 0) {
    const scrap = random() < EXPEDITION_LOOT.scrapChance ? EXPEDITION_LOOT.scrapMin + Math.floor(random() * (EXPEDITION_LOOT.scrapMax - EXPEDITION_LOOT.scrapMin + 1)) : 0;
    const health = healthDropped < EXPEDITION_LOOT.healthLimit && random() < EXPEDITION_LOOT.healthChance;
    return { scrap, health };
  }
  var MAPS, WEAPONS, MAX_LEVEL, weaponUnlocked, expeditionRank, ENERGY_MAX, raidProfile, ENERGY_INTERVAL, BOSS_COST, freshSave, bossUnlocked, xpForLevel, playerLevel, levelProgress, runXP, raidDamage, stats, upgradeCost, unlocked, enemyStats, ARMOR, armorUnlocked, EXPEDITION_LOOT;
  var init_balance = __esm({
    "balance.js"() {
      init_vehicles();
      MAPS = [
        { name: "\u0422\u0438\u0445\u0438\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B", desc: "\u0412 \u043E\u043A\u043D\u0430\u0445 \u0435\u0449\u0451 \u0433\u043E\u0440\u0438\u0442 \u0441\u0432\u0435\u0442. \u041D\u0430 \u0443\u043B\u0438\u0446\u0430\u0445 \u0443\u0436\u0435 \u043D\u0438\u043A\u043E\u0433\u043E \u0436\u0438\u0432\u043E\u0433\u043E.", goal: "\u0417\u0430\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0436\u0438\u043B\u043E\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B", boss: "\u0421\u043C\u043E\u0442\u0440\u0438\u0442\u0435\u043B\u044C", level: 1, palette: ["#6c7660", "#485340", "#8b8870", "#a4a080"], reward: 85, kind: "town" },
        { name: "\u0410\u0417\u0421 \xAB\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F\xBB", desc: "\u0417\u0430\u043F\u0430\u0445 \u0431\u0435\u043D\u0437\u0438\u043D\u0430. \u041F\u0443\u0441\u0442\u044B\u0435 \u0431\u0430\u043A\u0438. \u0418 \u043A\u0442\u043E-\u0442\u043E \u0437\u0430 \u043A\u043E\u043B\u043E\u043D\u043A\u043E\u0439.", goal: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0437\u0430\u043F\u0430\u0441 \u0442\u043E\u043F\u043B\u0438\u0432\u0430", boss: "\u041F\u043E\u0434\u0436\u0438\u0433\u0430\u0442\u0435\u043B\u044C", level: 2, palette: ["#786953", "#514b3a", "#a38d65", "#c5a271"], reward: 110, kind: "gas" },
        { name: "\u0413\u0440\u0443\u0437\u043E\u0432\u043E\u0439 \u0434\u0432\u043E\u0440", desc: "\u041A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u044B \u0437\u0430\u043F\u0435\u0440\u0442\u044B \u0438\u0437\u043D\u0443\u0442\u0440\u0438. \u0421\u0442\u0443\u043A \u043D\u0435 \u043F\u0440\u0435\u043A\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F.", goal: "\u0412\u0441\u043A\u0440\u044B\u0442\u044C \u0441\u043A\u043B\u0430\u0434 \u0441\u043D\u0430\u0431\u0436\u0435\u043D\u0438\u044F", boss: "\u041A\u0440\u0430\u043D\u043E\u0432\u0449\u0438\u043A", level: 3, palette: ["#627272", "#3e5150", "#738886", "#98a5a0"], reward: 140, kind: "yard" },
        { name: "\u0411\u043E\u043B\u044C\u043D\u0438\u0446\u0430 \u2116 6", desc: "\u041A\u0430\u0440\u0430\u043D\u0442\u0438\u043D \u0441\u043D\u044F\u0442. \u041F\u0430\u0446\u0438\u0435\u043D\u0442\u044B \u043E\u0441\u0442\u0430\u043B\u0438\u0441\u044C.", goal: "\u041D\u0430\u0439\u0442\u0438 \u043C\u0435\u0434\u0438\u0446\u0438\u043D\u0441\u043A\u0438\u0439 \u043C\u043E\u0434\u0443\u043B\u044C", boss: "\u0413\u043B\u0430\u0432\u0432\u0440\u0430\u0447", level: 4, palette: ["#687468", "#465b4f", "#8c9a84", "#b0b49b"], reward: 175, kind: "hospital" },
        { name: "\u0427\u0451\u0440\u043D\u044B\u0439 \u043B\u0435\u0441", desc: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0441\u0438\u0433\u043D\u0430\u043B \u043F\u0440\u0438\u0448\u0451\u043B \u043E\u0442\u0441\u044E\u0434\u0430. \u0414\u0430\u043B\u044C\u0448\u0435 \u2014 \u0442\u0438\u0448\u0438\u043D\u0430.", goal: "\u041D\u0430\u0439\u0442\u0438 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0441\u0438\u0433\u043D\u0430\u043B\u0430", boss: "\u041A\u043E\u0440\u043D\u0435\u0432\u043E\u0439", level: 5, palette: ["#525f4a", "#354736", "#71825b", "#94a071"], reward: 220, kind: "forest" },
        { name: "\u0417\u0430\u0442\u043E\u043F\u043B\u0435\u043D\u043D\u043E\u0435 \u043C\u0435\u0442\u0440\u043E", desc: "\u0412\u043E\u0434\u0430 \u0441\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0440\u0435\u043B\u044C\u0441\u044B. \u0412 \u0442\u043E\u043D\u043D\u0435\u043B\u0435 \u0441\u043B\u044B\u0448\u0435\u043D \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u043F\u043E\u0435\u0437\u0434.", goal: "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u044B\u0435 \u043D\u0430\u0441\u043E\u0441\u044B", boss: "\u041C\u0430\u0448\u0438\u043D\u0438\u0441\u0442", level: 6, palette: ["#334c50", "#23373c", "#75908b", "#b4bca2"], reward: 260, kind: "metro" },
        { name: "\u041F\u0440\u043E\u043C\u0437\u043E\u043D\u0430 \xAB\u041F\u0435\u043F\u0435\u043B\xBB", desc: "\u041F\u0435\u0447\u0438 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u044E\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0431\u0435\u0437 \u043B\u044E\u0434\u0435\u0439.", goal: "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0439 \u043A\u043E\u043D\u0432\u0435\u0439\u0435\u0440", boss: "\u041F\u043B\u0430\u0432\u0438\u043B\u044C\u0449\u0438\u043A", level: 7, palette: ["#624535", "#382c26", "#a7794f", "#d9b47e"], reward: 305, kind: "factory" },
        { name: "\u041F\u043E\u0440\u0442 \xAB\u0421\u0435\u0432\u0435\u0440\u043D\u044B\u0439\xBB", desc: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u043A\u043E\u0440\u0430\u0431\u043B\u044C \u043D\u0435 \u043F\u043E\u043A\u0438\u043D\u0443\u043B \u043F\u0440\u0438\u0447\u0430\u043B.", goal: "\u0417\u0430\u0445\u0432\u0430\u0442\u0438\u0442\u044C \u0443\u0437\u0435\u043B \u0434\u0430\u043B\u044C\u043D\u0435\u0439 \u0441\u0432\u044F\u0437\u0438", boss: "\u0410\u0434\u043C\u0438\u0440\u0430\u043B", level: 8, palette: ["#354a5c", "#253647", "#728b9b", "#b2c2c3"], reward: 355, kind: "port" }
      ];
      WEAPONS = [{ name: "\u041F\u0438\u0441\u0442\u043E\u043B\u0435\u0442 \xAB\u0421\u0438\u0433\u043D\u0430\u043B\xBB", damage: 22, rate: 0.48, range: 370, cost: 0, description: "\u0422\u043E\u0447\u043D\u044B\u0439 \u0438 \u043D\u0430\u0434\u0451\u0436\u043D\u044B\u0439. \u0425\u043E\u0440\u043E\u0448 \u0434\u043B\u044F \u043F\u0435\u0440\u0432\u044B\u0445 \u0432\u044B\u043B\u0430\u0437\u043E\u043A." }, { name: "\u041A\u0430\u0440\u0430\u0431\u0438\u043D \xAB\u0420\u0443\u0431\u0435\u0436\xBB", damage: 15, rate: 0.28, range: 430, cost: 360, description: "\u0412\u044B\u0441\u043E\u043A\u0430\u044F \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u0440\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C. \u0414\u0435\u0440\u0436\u0438 \u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u044E." }, { name: "\u0414\u0440\u043E\u0431\u043E\u0432\u0438\u043A \xAB\u0413\u0440\u043E\u043C\xBB", damage: 13, rate: 0.82, range: 240, pellets: 5, cost: 440, description: "\u041F\u044F\u0442\u044C \u0434\u0440\u043E\u0431\u0438\u043D. \u041F\u043E\u0434\u043F\u0443\u0441\u043A\u0430\u0439 \u0431\u043B\u0438\u0436\u0435 \u0438 \u043E\u0442\u0445\u043E\u0434\u0438 \u0431\u0435\u0433\u043E\u043C." }];
      WEAPONS.push(
        { name: "\u0420\u0435\u0432\u043E\u043B\u044C\u0432\u0435\u0440 \xAB\u0421\u0443\u0434\u044C\u044F\xBB", damage: 42, rate: 0.72, range: 400, cost: 850, level: 4, art: 0, pose: 0, description: "\u041C\u043E\u0449\u043D\u044B\u0439 \u0442\u043E\u0447\u043D\u044B\u0439 \u0432\u044B\u0441\u0442\u0440\u0435\u043B, \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u044B\u0439 \u0442\u0435\u043C\u043F." },
        { name: "\u041F\u041F \xAB\u0428\u043E\u0440\u043E\u0445\xBB", damage: 12, rate: 0.18, range: 300, cost: 1500, level: 10, art: 1, pose: 1, description: "\u041A\u043E\u0440\u043E\u0442\u043A\u0438\u0435 \u043E\u0447\u0435\u0440\u0435\u0434\u0438 \u0434\u043B\u044F \u0431\u043B\u0438\u0436\u043D\u0435\u0439 \u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u0438." },
        { name: "\u0412\u0438\u043D\u0442\u043E\u0432\u043A\u0430 \xAB\u0412\u043E\u0440\u043E\u043D\xBB", damage: 84, rate: 1.15, range: 530, cost: 2800, level: 25, art: 2, pose: 1, description: "\u0414\u0430\u043B\u044C\u043D\u0438\u0439 \u0431\u043E\u0439. \u0414\u0435\u0440\u0436\u0438 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0445 \u043D\u0430 \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0438." },
        { name: "\u041F\u0443\u043B\u0435\u043C\u0451\u0442 \xAB\u041E\u043F\u043B\u043E\u0442\xBB", damage: 19, rate: 0.23, range: 390, cost: 5200, level: 60, art: 3, pose: 1, description: "\u041F\u043B\u043E\u0442\u043D\u044B\u0439 \u043E\u0433\u043E\u043D\u044C \u0434\u043B\u044F \u0437\u0430\u0442\u044F\u0436\u043D\u044B\u0445 \u0432\u044B\u043B\u0430\u0437\u043E\u043A." },
        { name: "\u0414\u0440\u043E\u0431\u043E\u0432\u0438\u043A \xAB\u0420\u0430\u0437\u043B\u043E\u043C\xBB", damage: 18, rate: 0.95, range: 265, pellets: 5, cost: 9e3, level: 120, art: 4, pose: 2, description: "\u0423\u0441\u0438\u043B\u0435\u043D\u043D\u044B\u0439 \u0437\u0430\u0440\u044F\u0434. \u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u0443\u0440\u043E\u043D\u0430 \u0432\u0431\u043B\u0438\u0437\u0438." },
        { name: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442 \xAB\u0412\u0435\u043A\u0442\u043E\u0440\xBB", damage: 24, rate: 0.24, range: 450, cost: 16e3, level: 250, art: 5, pose: 1, description: "\u0422\u043E\u0447\u043D\u043E\u0435 \u043E\u0440\u0443\u0436\u0438\u0435 \u0432\u0435\u0442\u0435\u0440\u0430\u043D\u0430." },
        { name: "\xAB\u0412\u0435\u043A\u0442\u043E\u0440: \u041E\u0431\u0441\u0438\u0434\u0438\u0430\u043D\xBB", damage: 24, rate: 0.24, range: 450, cost: 0, level: 250, art: 5, pose: 1, votes: 35, sku: "weapon_obsidian", tint: 155, description: "\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u043D\u043E\u0435 \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435. \u0425\u0430\u0440\u0430\u043A\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043A\u0438 \u043E\u0431\u044B\u0447\u043D\u043E\u0433\u043E \xAB\u0412\u0435\u043A\u0442\u043E\u0440\u0430\xBB." }
      );
      MAX_LEVEL = 500;
      weaponUnlocked = (s, i) => !!WEAPONS[i] && playerLevel(s) >= (WEAPONS[i].level || 1);
      expeditionRank = (s) => Math.floor((playerLevel(s) - 1) / 25);
      ENERGY_MAX = 60;
      raidProfile = (map) => map === 5 ? { hp: 3900, cooldown: 35e3, armor: 0.1, trait: "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0440\u0438\u0442\u043C: \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u0430\u044F \u0430\u0442\u0430\u043A\u0430 \u0447\u0435\u0440\u0435\u0437 35 \u0441\u0435\u043A\u0443\u043D\u0434. \u0411\u0440\u043E\u043D\u044F \u0441\u043D\u0438\u0436\u0430\u0435\u0442 \u0443\u0440\u043E\u043D \u043D\u0430 10%." } : map === 6 ? { hp: 4700, cooldown: 45e3, armor: 0.2, trait: "\u0421\u0442\u0430\u043B\u044C\u043D\u0430\u044F \u043A\u043E\u0436\u0430: \u0432\u0445\u043E\u0434\u044F\u0449\u0438\u0439 \u0443\u0440\u043E\u043D \u0441\u043D\u0438\u0436\u0435\u043D \u043D\u0430 20%." } : map === 7 ? { hp: 6200, cooldown: 5e4, armor: 0.05, trait: "\u041E\u0441\u0430\u0434\u0430: \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0437\u0430\u043F\u0430\u0441 \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u044F, \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u0430\u044F \u0430\u0442\u0430\u043A\u0430 \u0447\u0435\u0440\u0435\u0437 50 \u0441\u0435\u043A\u0443\u043D\u0434." } : { hp: 750 * (1 + map * 0.7), cooldown: 45e3, armor: 0, trait: "\u041F\u043E\u0432\u0442\u043E\u0440\u043D\u0430\u044F \u0430\u0442\u0430\u043A\u0430 \u0447\u0435\u0440\u0435\u0437 45 \u0441\u0435\u043A\u0443\u043D\u0434." };
      ENERGY_INTERVAL = 5 * 60 * 1e3;
      BOSS_COST = 12;
      freshSave = () => ({ version: 1, vehicle: "nomad", ownedVehicles: ["nomad"], armorTier: 0, ownedArmor: [0], bossKills: 0, cloth: 0, scrap: 180, cores: 0, xp: 0, cleared: [], districtRuns: Array(MAPS.length).fill(0), energy: 60, energyAt: Date.now(), weapon: 0, owned: [0], weaponLevel: 0, armor: 0, engine: 0, body: 0, trunk: 0, kills: 0, daily: { date: "", kills: 0, claimed: false } });
      bossUnlocked = (s, i) => {
        var _a2;
        return unlocked(s, i) && (((_a2 = s.districtRuns) == null ? void 0 : _a2[i]) || 0) >= 3 && playerLevel(s) >= MAPS[i].level;
      };
      xpForLevel = (level) => level <= 20 ? Math.round(240 * (level - 1) + 90 * (level - 1) * (level - 2)) : xpForLevel(20) + 3660 * (level - 20) + 12 * (level - 20) * (level - 21);
      playerLevel = (s) => {
        let level = 1;
        while (level < MAX_LEVEL && s.xp >= xpForLevel(level + 1)) level++;
        return level;
      };
      levelProgress = (s) => {
        const level = playerLevel(s);
        if (level === MAX_LEVEL) return { level, current: 0, required: 0, percent: 100, max: true };
        const start2 = xpForLevel(level), next = xpForLevel(level + 1);
        return { level, current: Math.max(0, s.xp - start2), required: next - start2, percent: Math.min(100, (s.xp - start2) / (next - start2) * 100) };
      };
      runXP = (kills, win, map = 0, level = 1) => Math.round((Math.floor(kills * 1.5) + (win ? 24 + map * 8 : 0)) * (1 + Math.floor((Math.min(MAX_LEVEL, level) - 1) / 25) * 0.5));
      raidDamage = (s) => Math.round(stats(s).damage * (WEAPONS[s.weapon].pellets || 1) / WEAPONS[s.weapon].rate * 5 * (WEAPONS[s.weapon].pellets ? 0.72 : 1));
      stats = (s) => {
        var _a2;
        return { hp: Math.round((110 + s.armor * 8 + (((_a2 = ARMOR[s.armorTier || 0]) == null ? void 0 : _a2.hp) || 0)) * (1 + s.body * 0.04) * (1 + vehicleFor(s).hp / 100)), damage: WEAPONS[s.weapon].damage * (1 + s.weaponLevel * 0.08) * (1 + s.engine * 0.04) * (1 + vehicleFor(s).damage / 100), loot: (1 + s.trunk * 0.05) * (1 + vehicleFor(s).loot / 100), speed: 148 };
      };
      upgradeCost = (level) => Math.round(80 * Math.pow(1.42, level));
      unlocked = (s, i) => i === 0 || s.cleared.includes(i - 1);
      enemyStats = (map, wave, type, rank = 0) => ({ hp: (type === "boss" ? 230 : type === "tank" ? 86 : type === "runner" ? 28 : 40) * (1 + map * 0.32) * (1 + (wave - 1) * 0.15) * (1 + rank * 0.1), speed: type === "boss" ? 34 : type === "runner" ? 95 : type === "tank" ? 28 : 47, damage: (type === "boss" ? 23 : type === "tank" ? 17 : 10) * (1 + map * 0.16) * (1 + rank * 0.06) });
      ARMOR = [
        { name: "\u041E\u0434\u0435\u0436\u0434\u0430 \u0432\u044B\u0436\u0438\u0432\u0448\u0435\u0433\u043E", hp: 0, level: 1, bosses: 0, cost: 0, cloth: 0, cores: 0, icon: 3, description: "\u0422\u0432\u043E\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043D\u0430\u044F \u0444\u0443\u0442\u0431\u043E\u043B\u043A\u0430 \u0438 \u0431\u0440\u044E\u043A\u0438. \u0421\u0432\u043E\u0431\u043E\u0434\u0430 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F." },
        { name: "\u0416\u0438\u043B\u0435\u0442 \xAB\u0411\u0430\u0440\u044C\u0435\u0440\xBB", hp: 28, level: 2, bosses: 1, cost: 320, cloth: 8, cores: 0, icon: 4, description: "\u041F\u043B\u0438\u0442\u044B, \u0440\u0435\u043C\u043D\u0438 \u0438 \u043F\u043E\u0434\u0441\u0443\u043C\u043A\u0438. \u041F\u0435\u0440\u0432\u0430\u044F \u0441\u0435\u0440\u044C\u0451\u0437\u043D\u0430\u044F \u0437\u0430\u0449\u0438\u0442\u0430." },
        { name: "\u041A\u043E\u043C\u043F\u043B\u0435\u043A\u0442 \xAB\u0414\u043E\u0437\u043E\u0440\xBB", hp: 60, level: 4, bosses: 3, cost: 780, cloth: 24, cores: 3, icon: 4, description: "\u041F\u043E\u043B\u0435\u0432\u0430\u044F \u043A\u0443\u0440\u0442\u043A\u0430, \u0443\u0441\u0438\u043B\u0435\u043D\u043D\u044B\u0439 \u0436\u0438\u043B\u0435\u0442 \u0438 \u0437\u0430\u0449\u0438\u0442\u0430 \u043F\u043B\u0435\u0447." },
        { name: "\u0411\u0440\u043E\u043D\u044F \xAB\u0426\u0438\u0442\u0430\u0434\u0435\u043B\u044C\xBB", hp: 100, level: 6, bosses: 6, cost: 1600, cloth: 48, cores: 9, icon: 5, description: "\u0422\u044F\u0436\u0451\u043B\u044B\u0435 \u043F\u043B\u0430\u0441\u0442\u0438\u043D\u044B. \u041E\u0442\u043A\u0440\u044B\u0442\u043E\u0435 \u043B\u0438\u0446\u043E, \u0437\u043D\u0430\u043A\u043E\u043C\u044B\u0439 \u0441\u0438\u043B\u0443\u044D\u0442." }
      ];
      ARMOR.push(
        { name: "\u0420\u0430\u0437\u0432\u0435\u0434\u0447\u0438\u043A \xAB\u0422\u0443\u043C\u0430\u043D\xBB", hp: 135, level: 25, bosses: 0, cost: 3e3, cloth: 70, cores: 12, icon: 4, pose: 2, description: "\u0423\u0441\u0438\u043B\u0435\u043D\u043D\u0430\u044F \u043F\u043E\u043B\u0435\u0432\u0430\u044F \u0437\u0430\u0449\u0438\u0442\u0430 \u0440\u0430\u0437\u0432\u0435\u0434\u0447\u0438\u043A\u0430." },
        { name: "\u042D\u043A\u0437\u043E\u043A\u0430\u0440\u043A\u0430\u0441 \xAB\u0411\u0430\u0441\u0442\u0438\u043E\u043D\xBB", hp: 180, level: 75, bosses: 0, cost: 6e3, cloth: 110, cores: 22, icon: 5, pose: 3, description: "\u0411\u0440\u043E\u043D\u0435\u043A\u0430\u0440\u043A\u0430\u0441 \u0434\u043B\u044F \u043E\u043F\u0430\u0441\u043D\u044B\u0445 \u0441\u0435\u043A\u0442\u043E\u0440\u043E\u0432." },
        { name: "\u041A\u043E\u043C\u043F\u043B\u0435\u043A\u0442 \xAB\u0421\u0442\u0440\u0430\u0436\xBB", hp: 235, level: 200, bosses: 0, cost: 11e3, cloth: 180, cores: 40, icon: 5, pose: 3, description: "\u0417\u0430\u0449\u0438\u0442\u0430 \u043E\u043F\u044B\u0442\u043D\u043E\u0433\u043E \u043A\u043E\u043C\u0430\u043D\u0434\u0438\u0440\u0430." },
        { name: "\u0414\u043E\u0441\u043F\u0435\u0445 \xAB\u041B\u0435\u0433\u0435\u043D\u0434\u0430\xBB", hp: 300, level: 400, bosses: 0, cost: 2e4, cloth: 260, cores: 65, icon: 5, pose: 3, description: "\u0412\u044B\u0441\u0448\u0438\u0439 \u043A\u043B\u0430\u0441\u0441 \u0437\u0430\u0449\u0438\u0442\u044B \u0443\u0431\u0435\u0436\u0438\u0449\u0430." },
        { name: "\xAB\u041B\u0435\u0433\u0435\u043D\u0434\u0430: \u042F\u043D\u0442\u0430\u0440\u044C\xBB", hp: 300, level: 400, bosses: 0, cost: 0, cloth: 0, cores: 0, icon: 5, pose: 3, votes: 45, sku: "armor_amber", description: "\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0431\u0440\u043E\u043D\u044F. \u0417\u0430\u0449\u0438\u0442\u0430 \u043E\u0431\u044B\u0447\u043D\u043E\u0439 \xAB\u041B\u0435\u0433\u0435\u043D\u0434\u044B\xBB." }
      );
      armorUnlocked = (s, i) => playerLevel(s) >= ARMOR[i].level || (s.bossKills || 0) >= ARMOR[i].bosses && ARMOR[i].bosses > 0 || i === 0;
      EXPEDITION_LOOT = { scrapChance: 1 / 3, scrapMin: 4, scrapMax: 8, healthChance: 0.05, healthLimit: 2, heal: 28 };
    }
  });

  // rare-raids.js
  var RAID_CAPACITY, RARE_RAIDS, raidAllowed, raidHit;
  var init_rare_raids = __esm({
    "rare-raids.js"() {
      init_balance();
      RAID_CAPACITY = 300;
      RARE_RAIDS = [
        [1e6, 20, 500, 1e4, 15e3],
        [5e6, 40, 700, 17500, 28e3],
        [2e7, 75, 1e3, 3e4, 6e4],
        [1e8, 120, 1400, 49e3, 112e3],
        [5e8, 180, 1900, 76e3, 228e3],
        [1e9, 250, 2500, 112500, 4e5],
        [5e9, 350, 3200, 152e3, 704e3],
        [1e10, 450, 4e3, 2e5, 12e5]
      ].map(([hp, level, hits, scrap, xp], map) => ({ map, hp, level, hits, multiplier: hp / (hits * 1e3), pool: { scrap, xp, cores: hits, cloth: hits * 2 } }));
      raidAllowed = (s, map, rare = false) => bossUnlocked(s, map) && (!rare || s.cleared.includes(map) && playerLevel(s) >= RARE_RAIDS[map].level);
      raidHit = (s, map, rare = false) => Math.max(1, Math.round(raidDamage(s) * (rare ? RARE_RAIDS[map].multiplier : 1 - raidProfile(map).armor)));
    }
  });

  // boss-arena.js
  function arenaContribution(contract, rawDamage, elapsedSeconds) {
    if (!Number.isFinite(rawDamage) || rawDamage < 0 || !Number.isFinite(elapsedSeconds) || elapsedSeconds < ARENA.minSeconds) return 0;
    const bounded = Math.min(rawDamage, contract.rate * Math.min(ARENA.duration, elapsedSeconds) * 1.5);
    return Math.max(0, Math.min(contract.cap, Math.floor(contract.cap * bounded / contract.target)));
  }
  function strikeContains(zone, x, y) {
    return Math.hypot((x - zone.x) / zone.radius, (y - zone.y) / (zone.radius * 0.6)) <= 1;
  }
  function arenaStrike(time, x, y) {
    const phase = arenaPhase(time), radius = phase === 2 ? 68 : 60;
    const zones = [{ x, y, radius }];
    if (phase === 2) zones.push({ x: Math.max(80, Math.min(880, x + (x < 480 ? 150 : -150))), y: Math.max(325, y - 65), radius: 52 });
    return { x, y, radius, zones, t: phase === 2 ? 1.05 : 1.35, total: phase === 2 ? 1.05 : 1.35 };
  }
  function updateArenaBoss(run2, boss, dt) {
    const phase = arenaPhase(run2.time);
    boss.cd -= dt;
    boss.flash = Math.max(0, boss.flash - dt);
    if (!boss.attack && boss.cd <= 0) {
      boss.attack = arenaStrike(run2.time, run2.x, run2.y);
      boss.cd = phase === 2 ? 3.5 : 4.8;
    }
    if (boss.attack) {
      boss.attack.t -= dt;
      if (boss.attack.t <= 0) {
        if (boss.attack.zones.some((z) => strikeContains(z, run2.x, run2.y)) && run2.invulnerable <= 0) {
          run2.hp -= boss.damage * (phase === 2 ? 1.3 : 1);
          run2.hits++;
          run2.invulnerable = 0.65;
        }
        boss.exposedUntil = run2.time + 1.8;
        boss.attack = null;
      }
    } else if (run2.time > 2) {
      const length = Math.hypot(run2.x - boss.x, run2.y - boss.y) || 1;
      if (length > 70) {
        boss.x = Math.max(40, Math.min(920, boss.x + (run2.x - boss.x) / length * 35 * dt));
        boss.y = Math.max(310, Math.min(535, boss.y + (run2.y - boss.y) / length * 28 * dt));
      }
    }
    return phase;
  }
  var ARENA, arenaContract, arenaPhase, ARENA_PHASES, arenaHitMultiplier;
  var init_boss_arena = __esm({
    "boss-arena.js"() {
      init_balance();
      init_rare_raids();
      ARENA = { name: "\u041D\u0443\u043B\u0435\u0432\u0430\u044F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430", duration: 30, cost: BOSS_COST, minSeconds: 1, expiry: 15 * 60 * 1e3, maxBonus: 1.2, exposure: 0.9 };
      arenaContract = (save2, map, rare = false) => ({ duration: ARENA.duration, cost: ARENA.cost, rate: raidDamage(save2) / 5, target: Math.max(1, Math.round(raidDamage(save2) / 5 * ARENA.duration * ARENA.exposure)), cap: Math.max(1, Math.floor(raidHit(save2, map, rare) * ARENA.maxBonus)) });
      arenaPhase = (time) => Math.min(2, Math.floor(Math.max(0, time) / 10));
      ARENA_PHASES = ["\u041D\u0430\u0431\u043B\u044E\u0434\u0435\u043D\u0438\u0435", "\u041F\u043E\u0434\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u0438\u0435", "\u042F\u0440\u043E\u0441\u0442\u044C"];
      arenaHitMultiplier = (run2, boss) => boss.exposedUntil > run2.time ? 1.35 : 0.7;
    }
  });

  // art.js
  function setAppearance(save2) {
    var _a2, _b2, _c, _d, _e, _f;
    appearance = { weapon: (_c = (_b2 = (_a2 = WEAPONS[save2.weapon]) == null ? void 0 : _a2.pose) != null ? _b2 : save2.weapon) != null ? _c : 0, armor: (_f = (_e = (_d = ARMOR[save2.armorTier]) == null ? void 0 : _d.pose) != null ? _e : save2.armorTier) != null ? _f : save2.armor > 0 ? 1 : 0 };
  }
  function loadArtImage(path, ImageType = Image) {
    return new Promise((resolve, reject) => {
      const img = new ImageType();
      let fallback = false;
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (fallback) {
          reject(new Error("ART_LOAD"));
          return;
        }
        fallback = true;
        img.src = path;
      };
      img.src = path.replace(/\.png$/, ".webp");
    });
  }
  async function loadSprite(path) {
    const img = await loadArtImage(path), c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      let r = pixels.data[i], g2 = pixels.data[i + 1], b = pixels.data[i + 2];
      if (r > 120 && b > 120 && g2 < 135 && Math.min(r, b) - g2 > 55) pixels.data[i + 3] = 0;
    }
    ctx.putImageData(pixels, 0, 0);
    return c;
  }
  async function loadArt(onProgress = () => {
  }) {
    let done = 0;
    const total = 14, track = (promise) => promise.then((value) => {
      onProgress(++done, total);
      return value;
    });
    onProgress(0, total);
    await Promise.all([...Array.from({ length: 8 }, (_, i) => track(loadArtImage("assets/district-" + i + ".png").then((img) => environments[i] = img))), track(loadSprite("assets/characters.png").then((c) => spriteAtlas = c)), track(loadSprite("assets/equipment.png").then((c) => equipmentAtlas = c)), track(loadSprite("assets/armor-tiers.png").then((c) => armorAtlas = c)), track(loadSprite("assets/items.png").then((c) => itemAtlas = c)), track(loadSprite("assets/weapons-loot.png").then((c) => weaponAtlas = c)), track(loadSprite("assets/arsenal-expanded.png").then((c) => expandedAtlas = c))]);
  }
  function drawRig(g2, atlas, index, size, time, moving, running, type) {
    const sw = atlas.width / 3, sh = atlas.height / 2, sx = index % 3 * sw, sy = Math.floor(index / 3) * sh, k = size / sw, hip = sh * (type === "runner" ? 0.53 : 0.59), knee = sh * 0.77, phase = time * 8, swing = moving ? Math.sin(phase) * (running ? 0.25 : 0.13) : 0, bob = moving ? Math.abs(Math.sin(phase)) * 2 : 0, originX = -size * 0.5, originY = -size * 0.94 - bob;
    g2.imageSmoothingEnabled = false;
    for (let leg = 0; leg < 2; leg++) {
      const lx = leg * sw / 2, pivot = sw * (leg ? 0.57 : 0.43), angle = swing * (leg ? 1 : -1), bend = moving ? Math.max(0, -Math.sin(phase + (leg ? Math.PI : 0))) * (running ? 0.38 : 0.17) : 0;
      g2.save();
      g2.translate(originX + pivot * k, originY + hip * k);
      g2.rotate(angle);
      g2.drawImage(atlas, sx + lx, sy + hip, sw / 2, knee - hip, (lx - pivot) * k, 0, size / 2, (knee - hip) * k);
      g2.translate(0, (knee - hip) * k);
      g2.rotate(bend);
      g2.drawImage(atlas, sx + lx, sy + knee, sw / 2, sh - knee, (lx - pivot) * k, 0, size / 2, (sh - knee) * k);
      g2.restore();
    }
    g2.drawImage(atlas, sx, sy, sw, hip + 5, originX, originY, size, (hip + 5) * k);
  }
  function scene(c, map = 0, phase = 0) {
    const g2 = c.getContext("2d"), w = c.width, h = c.height;
    g2.save();
    g2.scale(w / 960, h / 600);
    background(g2, map);
    if (phase !== -1) {
      person(g2, 430, 410, "hero", 2.1, phase);
      person(g2, 280, 373, "walker", 1.8, phase);
      person(g2, 765, 443, "tank", 2.1, phase);
      person(g2, 552, 340, "runner", 1.6, phase);
    }
    g2.restore();
  }
  function rect(g2, x, y, w, h, c) {
    g2.fillStyle = c;
    g2.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function poly(g2, points, c) {
    g2.fillStyle = c;
    g2.beginPath();
    points.forEach(([x, y], i) => i ? g2.lineTo(x, y) : g2.moveTo(x, y));
    g2.closePath();
    g2.fill();
  }
  function noise(n) {
    return Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
  }
  function background(g2, map) {
    if (environments[map]) {
      g2.drawImage(environments[map], 0, 0, 960, 600);
      return;
    }
    if (map >= 5) {
      expansionBackground(g2, map);
      return;
    }
    let [dark, mid, light, cream] = palettes[map];
    rect(g2, 0, 0, 960, 600, dark);
    rect(g2, 0, 0, 960, 110, "#89927b");
    for (let i = 0; i < 18; i++) {
      let x = i * 65 - 10, bh = 35 + noise(i) * 70;
      rect(g2, x, 105 - bh, 48, bh, "#63725f");
      rect(g2, x + 10, 96 - bh, 4, 18, "#63725f");
    }
    rect(g2, 0, 105, 960, 495, mid);
    poly(g2, [[0, 268], [960, 186], [960, 520], [0, 600]], light);
    poly(g2, [[0, 280], [960, 202], [960, 235], [0, 317]], cream);
    rect(g2, 0, 545, 960, 55, dark);
    for (let i = 0; i < 15; i++) poly(g2, [[i * 91 - 120, 410], [i * 91 - 73, 406], [i * 91 - 28, 416], [i * 91 - 75, 420]], cream);
    if (map === 0 || map === 3) {
      building(g2, -20, 31, 253, 226, map === 3 ? "#7b8b77" : "#7a7962", map === 3 ? "\u041C\u0415\u0414\u0411\u041B\u041E\u041A" : "\u041F\u0420\u041E\u0414\u0423\u041A\u0422\u042B");
      building(g2, 283, -20, 258, 260, map === 3 ? "#8a967e" : "#979078", map === 3 ? "\u041A\u0410\u0420\u0410\u041D\u0422\u0418\u041D" : "\u0410\u041F\u0422\u0415\u041A\u0410");
      building(g2, 603, 23, 385, 203, "#697462", map === 3 ? "\u0411\u041E\u041B\u042C\u041D\u0418\u0426\u0410 \u2116 6" : "\u042D\u0412\u0410\u041A\u0423\u0410\u0426\u0418\u042F \u2192");
      if (map === 3) {
        rect(g2, 380, 53, 36, 12, "#a75744");
        rect(g2, 392, 41, 12, 36, "#a75744");
        for (let j = 0; j < 3; j++) {
          rect(g2, 70 + j * 52, 334, 37, 17, "#c4c8b3");
          rect(g2, 75 + j * 52, 351, 4, 15, dark);
          rect(g2, 96 + j * 52, 351, 4, 15, dark);
        }
      }
    }
    if (map === 1) {
      building(g2, 540, 20, 380, 210, "#77765e", "\u041C\u0410\u0413\u0410\u0417\u0418\u041D 24");
      rect(g2, 62, 75, 448, 20, "#5d4034");
      rect(g2, 53, 63, 463, 20, "#bd8455");
      rect(g2, 82, 93, 13, 183, "#afa38a");
      rect(g2, 467, 93, 13, 162, "#afa38a");
      for (let i = 0; i < 3; i++) {
        rect(g2, 138 + i * 105, 182, 42, 79, "#b8af8c");
        rect(g2, 141 + i * 105, 185, 36, 16, "#3a4e43");
        rect(g2, 141 + i * 105, 225, 36, 29, "#a66646");
        rect(g2, 182 + i * 105, 193, 6, 43, "#283b30");
      }
      label(g2, "\u041F\u041E\u0421\u041B\u0415\u0414\u041D\u042F\u042F", 180, 56, 22, "#dfc499");
    }
    if (map === 2) {
      for (let i = 0; i < 5; i++) {
        let x = i * 204 - 45, y = 90 + i % 2 * 32;
        rect(g2, x, y, 182, 148, ["#7a6a4d", "#59776c", "#8c7156"][i % 3]);
        for (let k = 0; k < 12; k++) rect(g2, x + 8 + k * 15, y + 4, 3, 138, "#1f373733");
        rect(g2, x, y + 139, 182, 7, dark);
        label(g2, "07 / CARGO", x + 15, y + 47, 13, "#c9cbb0");
      }
      rect(g2, 713, 0, 14, 190, "#323f34");
      rect(g2, 490, 12, 410, 13, "#b49d62");
      for (let k = 0; k < 12; k++) poly(g2, [[498 + k * 32, 12], [514 + k * 32, 0], [529 + k * 32, 12]], "#b49d62");
    }
    if (map === 4) {
      for (let i = 0; i < 26; i++) tree(g2, i * 44 - 30, 100 + noise(i + 50) * 120, 0.7 + noise(i + 10) * 0.7);
      building(g2, 580, 120, 180, 114, "#68664e", "104.8 FM");
      rect(g2, 668, 0, 5, 130, "#8e977a");
      for (let i = 0; i < 6; i++) rect(g2, 653, i * 18, 35, 3, "#8e977a");
      for (let i = 0; i < 9; i++) {
        let x = noise(i + 80) * 960, y = 300 + noise(i + 90) * 200;
        poly(g2, [[x, y], [x + 30, y - 6], [x + 50, y + 8], [x + 5, y + 12]], "#596e48");
      }
    }
    for (let i = 0; i < 160; i++) {
      let x = noise(i + map * 23) * 960, y = 265 + noise(i + 400) * 275;
      rect(g2, x, y, 2 + noise(i + 9) * 7, 2, noise(i) > 0.5 ? dark : cream);
    }
    for (let i = 0; i < 16; i++) {
      let x = noise(i + 5) * 960, y = 310 + noise(i + 100) * 200;
      poly(g2, [[x, y], [x + 19, y - 3], [x + 8, y + 1], [x + 28, y + 8], [x + 23, y + 10]], "#515c484d");
    }
    crate(g2, 82, 298);
    crate(g2, 111, 287);
    crate(g2, 838, 305);
    for (let i = 0; i < 4; i++) {
      rect(g2, 560 + i * 11, 249 - i * 2, 9, 27, "#797e63");
      rect(g2, 560 + i * 11, 260 - i * 2, 9, 7, "#b29a59");
    }
    lamp(g2, 235, 293);
    lamp(g2, 889, 235);
    poly(g2, [[0, 550], [960, 482], [960, 500], [0, 568]], cream);
    for (let i = 0; i < 13; i++) rect(g2, i * 80, 535 - i * 5.5, 3, 44, dark);
    const grad = g2.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, "#122e2b28");
    grad.addColorStop(0.6, "#1c2f1300");
    grad.addColorStop(1, "#10201855");
    g2.fillStyle = grad;
    g2.fillRect(0, 0, 960, 600);
  }
  function label(g2, t, x, y, size = 13, color = "#d3ceb1") {
    g2.fillStyle = color;
    g2.font = `bold ${size}px monospace`;
    g2.fillText(t, x, y);
  }
  function building(g2, x, y, w, h, color, text) {
    rect(g2, x + 12, y + 10, w, h, "#354537");
    rect(g2, x, y, w, h, color);
    rect(g2, x, y, w, 9, "#afb196");
    rect(g2, x + 4, y + h - 14, w - 4, 14, "#4c5847");
    for (let row = 0; row < 2; row++) for (let col = 0; col < Math.floor(w / 67); col++) {
      let wx = x + 18 + col * 65, wy = y + 30 + row * 73;
      rect(g2, wx - 3, wy - 3, 43, 53, "#ada98a");
      rect(g2, wx, wy, 36, 46, "#354c43");
      rect(g2, wx + 3, wy + 3, 29, 16, "#596d56");
      rect(g2, wx + 17, wy, 3, 46, color);
      if ((col + row) % 3 === 1) {
        rect(g2, wx + 1, wy + 31, 35, 7, "#8c8060");
        poly(g2, [[wx, wy + 8], [wx + 4, wy + 5], [wx + 34, wy + 30], [wx + 30, wy + 33]], "#b0a07a");
      }
    }
    rect(g2, x + 10, y + h - 58, w - 20, 26, "#333f32");
    label(g2, text, x + 21, y + h - 40, 15);
    rect(g2, x + w - 59, y + h - 30, 35, 30, "#303f31");
    for (let i = 0; i < 16; i++) rect(g2, x + noise(i + 8) * w, y + noise(i + 24) * h, 6, 3, "#e1d7a927");
  }
  function tree(g2, x, y, s) {
    g2.save();
    g2.translate(x, y);
    g2.scale(s, s);
    poly(g2, [[0, 0], [35, 9], [83, 1], [53, -13]], "#243d3144");
    rect(g2, 21, -73, 11, 81, "#4b4935");
    poly(g2, [[-17, -50], [1, -75], [-7, -82], [16, -115], [38, -113], [62, -79], [54, -70], [73, -45], [48, -20], [1, -24]], "#3b573b");
    poly(g2, [[-11, -58], [6, -84], [22, -106], [42, -89], [53, -61], [23, -43]], "#5b734b");
    rect(g2, 8, -59, 24, 7, "#718457");
    g2.restore();
  }
  function crate(g2, x, y) {
    rect(g2, x + 5, y + 5, 40, 31, "#394a36");
    rect(g2, x, y, 34, 30, "#a1936b");
    rect(g2, x + 3, y + 4, 28, 21, "#6e714e");
    poly(g2, [[x + 3, y + 4], [x + 8, y + 4], [x + 31, y + 24], [x + 26, y + 24]], "#b1a278");
    rect(g2, x + 14, y, 5, 30, "#c3ad79");
  }
  function lamp(g2, x, y) {
    poly(g2, [[x, y], [x + 9, y], [x + 90, y + 35], [x + 67, y + 35]], "#43523e66");
    rect(g2, x, y - 161, 5, 163, "#465448");
    rect(g2, x - 4, y - 164, 45, 5, "#b6b599");
    rect(g2, x + 28, y - 160, 15, 6, "#e5c574");
    rect(g2, x - 5, y - 6, 14, 7, "#55634d");
  }
  function person(g2, x, y, type = "walker", scale = 1, t = 0, face = 1, flash = 0, moving = false, running = false) {
    if (spriteAtlas) {
      const atlas = type === "hero" && equipmentAtlas ? appearance.armor >= 2 && armorAtlas ? armorAtlas : equipmentAtlas : spriteAtlas;
      let index = type === "hero" ? equipmentAtlas ? appearance.weapon + (appearance.armor === 1 || appearance.armor === 3 ? 3 : 0) : 0 : type === "walker" ? 2 : type === "runner" ? 3 : type === "tank" ? 4 : 5;
      const size = 110 * scale;
      g2.save();
      g2.translate(Math.round(x), Math.round(y));
      g2.fillStyle = "#0b140d55";
      g2.beginPath();
      g2.ellipse(0, 0, size * 0.2, size * 0.06, 0, 0, Math.PI * 2);
      g2.fill();
      g2.scale(face, 1);
      if (flash) g2.globalAlpha = 0.65;
      drawRig(g2, atlas, index, size, t, moving, running, type);
      g2.restore();
      return;
    }
    g2.save();
    g2.translate(Math.round(x), Math.round(y));
    g2.scale(scale * face, scale);
    let hero = type === "hero", boss = type === "boss", tank = type === "tank", runner = type === "runner";
    let step = Math.sin(t * 9) * 3;
    poly(g2, [[-10, 2], [7, -1], [26, 5], [6, 9]], "#22332666");
    let coat = hero ? "#bb985b" : boss ? "#70544a" : tank ? "#6c7859" : runner ? "#9b8871" : "#6d8972";
    let skin = hero ? "#c4a889" : "#9aa68b";
    if (flash) coat = skin = "#e8d8aa";
    let width = tank || boss ? 13 : 9;
    rect(g2, -width + 2, -19, width - 2, 19 + step, "#3d493d");
    rect(g2, 2, -18, width - 3, 18 - step, "#45513f");
    rect(g2, -width, -1 + step, 9, 4, "#222f27");
    rect(g2, 2, -1 - step, 10, 4, "#222f27");
    poly(g2, [[-width, -42], [width - 1, -42], [width + 3, -18], [-width - 3, -17]], coat);
    rect(g2, -width + 2, -38, 4, 17, hero ? "#947747" : "#849177");
    rect(g2, -7, -56, 13, 14, skin);
    rect(g2, -9, -57, 14, 6, hero ? "#544534" : "#657364");
    rect(g2, 4, -49, 3, 3, hero ? "#423e2e" : "#d4be77");
    rect(g2, 0, -43, 7, 3, hero ? "#635444" : "#576351");
    if (hero) {
      rect(g2, -14, -39, 7, 20, "#424f3e");
      rect(g2, 4, -36, 17, 6, skin);
      rect(g2, 17, -38, 19, 5, "#2e3830");
      rect(g2, 22, -35, 5, 8, "#2e3830");
      rect(g2, -5, -22, 17, 4, "#4b4a35");
    } else {
      rect(g2, width - 2, -38, 5, 21, coat);
      rect(g2, width, -19, 6, 7, skin);
      rect(g2, -width - 5, -35, 6, 23, coat);
      rect(g2, -width - 5, -13, 5, 5, skin);
      rect(g2, -3, -35, 6, 13, "#775747");
    }
    if (boss) {
      rect(g2, -10, -60, 18, 6, "#b38c5d");
      rect(g2, 17, -34, 6, 29, "#9b9475");
    }
    g2.restore();
  }
  function drawItem(canvas2, index) {
    if (!itemAtlas) return;
    const ctx = canvas2.getContext("2d");
    ctx.clearRect(0, 0, canvas2.width, canvas2.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(itemAtlas, index % 3 * itemAtlas.width / 3, Math.floor(index / 3) * itemAtlas.height / 2, itemAtlas.width / 3, itemAtlas.height / 2, 0, 0, canvas2.width, canvas2.height);
  }
  function drawWeapon(canvas2, index) {
    var _a2;
    const w = WEAPONS[index], atlas = (w == null ? void 0 : w.art) !== void 0 ? expandedAtlas : weaponAtlas;
    if (!atlas) return;
    const ctx = canvas2.getContext("2d");
    ctx.clearRect(0, 0, canvas2.width, canvas2.height);
    ctx.imageSmoothingEnabled = false;
    const cell = (_a2 = w.art) != null ? _a2 : index, sw = atlas.width / 3, sh = atlas.height / 2;
    ctx.save();
    if (w.tint) ctx.filter = "hue-rotate(" + w.tint + "deg)";
    ctx.drawImage(atlas, cell % 3 * sw, Math.floor(cell / 3) * sh, sw, sh, 0, 0, canvas2.width, canvas2.height);
    ctx.restore();
  }
  function loot(g2, x, y, kind, time, amount = 0) {
    const health = kind === "health", size = health ? 35 : 30, bob = Math.sin(time * 3 + x) * 2;
    g2.save();
    g2.translate(x, y);
    g2.fillStyle = "#080e09aa";
    g2.beginPath();
    g2.ellipse(0, 4, 16, 6, 0, 0, Math.PI * 2);
    g2.fill();
    g2.strokeStyle = health ? "#b0d2a580" : "#e4b77380";
    g2.lineWidth = 1;
    g2.beginPath();
    g2.ellipse(0, 3, 18, 7, 0, 0, Math.PI * 2);
    g2.stroke();
    if (weaponAtlas) {
      g2.imageSmoothingEnabled = false;
      g2.drawImage(weaponAtlas, health ? 512 : 0, 512, 512, 512, -size / 2, -size + bob, size, size);
    } else {
      g2.fillStyle = health ? "#a8c794" : "#d6ad6d";
      g2.fillRect(-5, -13, 10, 10);
    }
    if (amount) {
      g2.font = "bold 9px monospace";
      g2.textAlign = "center";
      g2.strokeStyle = "#11190f";
      g2.lineWidth = 3;
      g2.strokeText(amount, 0, 14);
      g2.fillStyle = "#efdab3";
      g2.fillText(amount, 0, 14);
    }
    g2.restore();
  }
  function expansionBackground(g2, map) {
    const colors = map === 5 ? ["#17292d", "#49666a", "#7fa4a0"] : map === 6 ? ["#30251f", "#72513b", "#dd9952"] : ["#1a2938", "#485e70", "#a5bac5"];
    const [dark, mid, light] = colors;
    rect(g2, 0, 0, 960, 600, dark);
    const sky = g2.createLinearGradient(0, 0, 0, 600);
    sky.addColorStop(0, dark);
    sky.addColorStop(1, mid);
    g2.fillStyle = sky;
    g2.fillRect(0, 0, 960, 600);
    if (map === 5) {
      for (let x = 0; x < 960; x += 160) {
        rect(g2, x, 30, 18, 275, mid);
        rect(g2, x, 30, 160, 15, mid);
        rect(g2, x + 30, 65, 100, 150, "#0b171b");
        rect(g2, x + 42, 81, 76, 3, light);
      }
      rect(g2, 0, 258, 960, 35, "#78847a");
      label(g2, "\u041C\u0415\u0422\u0420\u041E / \u0421\u0415\u0412\u0415\u0420\u041D\u0410\u042F", 320, 235, 25, light);
      for (let y = 335; y < 600; y += 85) {
        rect(g2, 0, y, 960, 5, "#8a8e73");
        for (let x = 0; x < 960; x += 45) rect(g2, x, y + 4, 25, 9, "#243333");
      }
      rect(g2, 670, 125, 230, 128, "#5d776d");
      for (let x = 692; x < 890; x += 57) rect(g2, x, 145, 39, 51, "#162b31");
      rect(g2, 670, 232, 230, 12, "#cfb27a");
    } else if (map === 6) {
      for (let x = 30; x < 960; x += 190) {
        building(g2, x, 50, 165, 210, mid, "\u0426\u0415\u0425");
        rect(g2, x + 30, 0, 25, 62, "#624e43");
        rect(g2, x + 45, 144, 70, 105, "#211914");
        rect(g2, x + 54, 182, 53, 65, "#e8923a");
        rect(g2, x + 62, 209, 35, 38, "#f2c46d");
      }
      for (let x = 0; x < 960; x += 100) {
        rect(g2, x, 310, 65, 13, "#c29757");
        rect(g2, x + 15, 323, 15, 28, "#211e1a");
      }
    } else {
      rect(g2, 0, 142, 960, 149, "#345b6c");
      poly(g2, [[155, 182], [620, 182], [564, 260], [220, 260]], "#1a2632");
      building(g2, 315, 89, 180, 94, mid, "\u0421\u0415\u0412\u0415\u0420\u041D\u042B\u0419");
      for (let x = 90; x < 960; x += 310) {
        rect(g2, x, 20, 15, 255, light);
        rect(g2, x - 70, 20, 220, 10, light);
        rect(g2, x + 140, 30, 3, 90, light);
        rect(g2, x + 127, 116, 28, 12, "#dcc48c");
      }
      for (let x = 0; x < 960; x += 40) rect(g2, x, 286, 25, 9, "#a4a390");
    }
    rect(g2, 0, 360, 960, 240, map === 5 ? "#233c40" : "#444b46");
    for (let i = 0; i < 190; i++) {
      let x = noise(i + map * 23) * 960, y = 365 + noise(i + 400) * 230;
      rect(g2, x, y, 3 + noise(i) * 15, 2, noise(i) > 0.6 ? light : dark);
    }
    for (let x = 0; x < 960; x += 165) {
      crate(g2, x + 20, 354);
      lamp(g2, x + 105, 330);
    }
    const shade = g2.createLinearGradient(0, 0, 0, 600);
    shade.addColorStop(0, "#0003");
    shade.addColorStop(0.6, "#0000");
    shade.addColorStop(1, "#0006");
    g2.fillStyle = shade;
    g2.fillRect(0, 0, 960, 600);
  }
  var environments, spriteAtlas, equipmentAtlas, armorAtlas, itemAtlas, weaponAtlas, expandedAtlas, appearance, palettes;
  var init_art = __esm({
    "art.js"() {
      init_balance();
      environments = [];
      spriteAtlas = null;
      equipmentAtlas = null;
      armorAtlas = null;
      itemAtlas = null;
      weaponAtlas = null;
      expandedAtlas = null;
      appearance = { weapon: 0, armor: 0 };
      palettes = [["#4c5b49", "#78826b", "#98967a", "#c0b99a"], ["#5e5846", "#81765c", "#a19373", "#c6b58d"], ["#445958", "#6e8580", "#8d9c90", "#afb7a2"], ["#4b5b4f", "#7d8d75", "#a4ad91", "#c6c8a8"], ["#344d39", "#617453", "#819167", "#a6ac7f"]];
    }
  });

  // vk-profile.js
  function vkPhoto(value) {
    try {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password && (!u.port || u.port === "443") && ["userapi.com", "vkuserphoto.ru", "vkuserlive.ru", "vk.com", "vk.ru", "vk.me"].some((d) => u.hostname === d || u.hostname.endsWith("." + d)) ? u.href : "";
    } catch (e) {
      return "";
    }
  }
  var init_vk_profile = __esm({
    "vk-profile.js"() {
    }
  });

  // ui-icons.js
  var line, accent, symbols, ICON_NAMES, icon, shelterIcon;
  var init_ui_icons = __esm({
    "ui-icons.js"() {
      line = (d) => '<path class="icon-detail" d="' + d + '"/>';
      accent = (d) => '<path class="icon-accent" d="' + d + '"/>';
      symbols = {
        map: line("M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16m6-14v16") + accent("M5 9h2v2H5z"),
        gear: line("M3 9h5l2-3h10v4h2v2H12l-2 5H7l-2 4H2l4-9H3zM11 4h6m-5 8h6v5h-3l-2-5") + accent("M17 7h2v2h-2z"),
        garage: line("M3 11l3-6h12l3 6v8H3zM3 11h18M5 19v2m14-2v2M6 14h2m8 0h2M10 17h4") + accent("M11 7h2v2h-2z"),
        daily: line("M8 4H4v17h16V4h-4M8 2h8v5H8zM8 11h8m-8 4h5") + accent("M15 15h2v2h-2z"),
        raids: line("M12 2l8 4v7c0 4-5 7-8 9-3-2-8-5-8-9V6zM8 9l2-2h4l2 2v5l-2 2h-4l-2-2zm2 7v2m4-2v2") + accent("M9 10h2v2H9zm4 0h2v2h-2z"),
        guide: line("M3 4h6l3 2 3-2h6v16h-6l-3 2-3-2H3zM12 6v16M6 8h3m-3 4h3m6 3h3") + accent("M16 5h2v6h-2z"),
        leaderboard: line("M7 3h10v8l-3 5h-4l-3-5zM7 5H3v4l4 3m10-7h4v4l-4 3M12 16v5m-5 0h10") + accent("M11 6h2v4h-2z"),
        friends: line("M10 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0m10 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0M2 20v-4l2-3h6l2 3v4m2-7h6l2 3v4") + accent("M15 18h2v2h-2z"),
        clans: line("M4 3h16v11l-8 8-8-8zM7 6h10v7l-5 5-5-5z") + accent("M10 8h4v2h-4z"),
        conflict: line("M3 3l4 1 14 16-2 2L3 7zM21 3l-4 1-4 5m-3 4-7 7 2 2 6-5M2 17l5 5m10-5 5 5") + accent("M17 5h2v2h-2z"),
        settings: line("M6 3v18M12 3v18M18 3v18M4 7h4v4H4zm6 8h4v4h-4z") + accent("M16 6h4v4h-4z"),
        medical: line("M3 7h18v14H3zM8 7V3h8v4M10 10h4v3h3v3h-3v3h-4v-3H7v-3h3z") + accent("M19 18h2v2h-2z"),
        energy: line("M13 2L4 14h7l-1 8 10-12h-7z") + accent("M12 10h2v2h-2z"),
        diamond: line("M7 3h10l5 7-10 12L2 10zM2 10h20M7 3l-1 7 6 12 6-12-1-7") + accent("M11 6h2v2h-2z"),
        skull: line("M6 4l6-2 6 2 3 6-2 7-4 2v3H9v-3l-4-2-2-7zM7 8h3v4H7zm7 0h3v4h-3zM10 20v2m4-2v2") + accent("M12 13l2 3h-4z"),
        star: line("M12 2l3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z") + accent("M11 10h2v3h-2z"),
        menu: line("M4 6h16M4 12h11M4 18h16") + accent("M18 11h2v2h-2z"),
        close: line("M6 6l12 12M18 6L6 18"),
        pause: line("M6 4h3v16H6zm9 0h3v16h-3z"),
        repulse: line("M12 2l8 4v8l-8 8-8-8V6zM8 12l4 4 4-4M12 6v10") + accent("M11 18h2v2h-2z"),
        run: line("M16 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4M5 12l5-4 5 1 3 4h4M12 9l-2 6 5 3-1 4m-4-7-4 6H2") + accent("M1 8h3v2H1z"),
        arrow: line("M4 12h16M14 6l6 6-6 6"),
        refresh: line("M20 10a8 8 0 1 0-2 8M20 3v7h-7") + accent("M20 15h2v2h-2z"),
        unknown: line("M8 7a4 4 0 1 1 6 4c-2 1-2 3-2 4m0 4v1")
      };
      ICON_NAMES = Object.freeze(Object.keys(symbols).filter((name) => name !== "unknown"));
      icon = (name) => {
        const key2 = Object.prototype.hasOwnProperty.call(symbols, name) ? name : "unknown";
        return '<svg class="ui-icon obitel-glyph shelter-insignia" data-icon="' + key2 + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + symbols[key2] + "</svg>";
      };
      shelterIcon = icon;
    }
  });

  // profile-ui.js
  function profileEditor(root, profile, api2, toast2, onSave) {
    const panel = document.createElement("section");
    panel.className = "settings-card profile-editor";
    panel.innerHTML = '<span class="eyebrow">\u041B\u0418\u0427\u041D\u041E\u0415 \u0414\u0415\u041B\u041E</span><h2>\u0422\u0432\u043E\u0439 \u043F\u043E\u0437\u044B\u0432\u043D\u043E\u0439.</h2><form><label for="player-name">\u041D\u0438\u043A \u0438\u0433\u0440\u043E\u043A\u0430</label><input id="player-name" name="name" minlength="2" maxlength="32" required autocomplete="nickname"><fieldset><legend>\u0410\u0432\u0430\u0442\u0430\u0440</legend><div class="avatar-picker">' + AVATARS.map((symbol, i) => '<button type="button" class="avatar-option avatar-' + i + '" data-avatar="' + i + '" aria-label="\u0410\u0432\u0430\u0442\u0430\u0440 ' + (i + 1) + '" aria-pressed="' + (i === (profile.avatar || 0)) + '">' + symbol + "</button>").join("") + '</div></fieldset><button class="primary" type="submit">\u0421\u041E\u0425\u0420\u0410\u041D\u0418\u0422\u042C \u041F\u0420\u041E\u0424\u0418\u041B\u042C</button><p role="status" class="profile-status"></p></form>';
    panel.querySelector("input").value = profile.name || "";
    let avatar = profile.avatar || 0;
    panel.querySelectorAll("[data-avatar]").forEach((button) => button.onclick = () => {
      avatar = Number(button.dataset.avatar);
      panel.querySelectorAll("[data-avatar]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    });
    panel.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      const button = panel.querySelector("[type=submit]");
      button.disabled = true;
      try {
        const data = await api2("profile", { name: panel.querySelector("input").value, avatar });
        onSave(data);
        panel.querySelector(".profile-status").textContent = "\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D";
        toast2("\u041F\u043E\u0437\u044B\u0432\u043D\u043E\u0439 \u0438 \u0430\u0432\u0430\u0442\u0430\u0440 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B");
      } catch (error) {
        panel.querySelector(".profile-status").textContent = error.message;
      } finally {
        button.disabled = false;
      }
    };
    root.prepend(panel);
  }
  var AVATARS;
  var init_profile_ui = __esm({
    "profile-ui.js"() {
      init_ui_icons();
      AVATARS = ["medical", "diamond", "clans", "energy", "skull", "star"].map(icon);
    }
  });

  // friends-ui.js
  function friendsUI(root, api2, toast2, openRaid) {
    async function render() {
      var _a2;
      if (pending.has(root)) return;
      pending.add(root);
      try {
        let data = await api2("friends");
        if (data.account === "vk" && canSyncVKFriendsSilently() && !autoSyncAttempted) {
          autoSyncAttempted = true;
          try {
            data = await syncVKFriends(api2);
          } catch (e) {
            toast2(e.message);
          }
        }
        root.innerHTML = `<div class="settings-card social-heading"><span class="eyebrow orange">\u0422\u0412\u041E\u0419 \u041E\u0422\u0420\u042F\u0414 \xB7 ${data.friends.length}</span><h2>\u0414\u0440\u0443\u0437\u044C\u044F \u0432 \u0433\u043E\u0440\u043E\u0434\u0435</h2><p>\u0414\u0440\u0443\u0437\u044C\u044F VK, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0443\u0436\u0435 \u0432\u043E\u0448\u043B\u0438 \u0432 \u0438\u0433\u0440\u0443, \u043F\u043E\u044F\u0432\u043B\u044F\u044E\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438. \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043E\u0434\u043D\u043E\u0433\u043E \u0431\u043E\u0441\u0441\u0430 \u2014 \u0430\u0442\u0430\u043A\u0438 \u043F\u043E\u043F\u0430\u0434\u0430\u044E\u0442 \u0432 \u043E\u0431\u0449\u0438\u0439 \u0440\u0435\u0439\u0434, \u0434\u0430\u0436\u0435 \u0435\u0441\u043B\u0438 \u0432\u044B \u0438\u0433\u0440\u0430\u0435\u0442\u0435 \u0432 \u0440\u0430\u0437\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F.</p>${inVK && data.account === "vk" ? `<button class="primary" id="vk-sync">${data.vkSyncedAt ? "\u041E\u0411\u041D\u041E\u0412\u0418\u0422\u042C \u0414\u0420\u0423\u0417\u0415\u0419 VK" : "\u041F\u041E\u041A\u0410\u0417\u0410\u0422\u042C \u0414\u0420\u0423\u0417\u0415\u0419 VK"}</button><small>VK \u043C\u043E\u0436\u0435\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u044C \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u043D\u0430 \u0441\u043F\u0438\u0441\u043E\u043A \u0434\u0440\u0443\u0437\u0435\u0439. \u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F.</small>` : "<p>\u0414\u043B\u044F \u0434\u0440\u0443\u0437\u0435\u0439 VK \u043E\u0442\u043A\u0440\u043E\u0439 \u0438\u0433\u0440\u0443 \u0432\u043D\u0443\u0442\u0440\u0438 VK. \u0414\u0440\u0443\u0433\u0438\u0445 \u0438\u0433\u0440\u043E\u043A\u043E\u0432 \u043C\u043E\u0436\u043D\u043E \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0438\u0437 \u0422\u041E\u041F\u0430.</p>"}</div>
   <div class="section-title"><h3>\u0412\u0445\u043E\u0434\u044F\u0449\u0438\u0435 \u0437\u0430\u044F\u0432\u043A\u0438 \xB7 ${data.requests.length}</h3><button class="secondary" id="friends-refresh">\u041E\u0411\u041D\u041E\u0412\u0418\u0422\u042C</button></div>
   <div class="social-list">${data.requests.map((p) => `<article class="friend-person">${portrait(p)}<span class="friend-person-info"><b>${esc(p.name)}</b><small>\u0423\u0440\u043E\u0432\u0435\u043D\u044C ${p.level}</small></span><button class="primary" data-accept="${p.code}">\u041F\u0420\u0418\u041D\u042F\u0422\u042C</button><button class="secondary" data-decline="${p.code}">\u041E\u0422\u041A\u041B\u041E\u041D\u0418\u0422\u042C</button></article>`).join("") || '<p class="page-intro">\u041D\u043E\u0432\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A \u043D\u0435\u0442.</p>'}</div>
   <div class="section-title"><h3>\u041C\u043E\u0438 \u0434\u0440\u0443\u0437\u044C\u044F \xB7 ${data.friends.length}</h3></div><div class="social-list">${data.friends.map((p) => `<article class="friend-person">${portrait(p)}<span class="friend-person-info"><b>${esc(p.name)}</b><small>${p.vk ? "VK \xB7 " : ""}${p.online ? "\u0412 \u0441\u0435\u0442\u0438" : "\u041D\u0435 \u0432 \u0441\u0435\u0442\u0438"} \xB7 \u0443\u0440. ${p.level}${p.raid ? " \xB7 \u0431\u043E\u0441\u0441: " + Math.floor(p.raid.hp).toLocaleString("ru-RU") + " HP" : ""}</small></span>${p.raid ? `<button class="primary" data-raid="${p.raid.id}">\u041A \u0411\u041E\u0421\u0421\u0423</button>` : ""}${!p.vk ? `<button class="secondary" data-remove="${p.code}">\u0423\u0414\u0410\u041B\u0418\u0422\u042C</button>` : ""}</article>`).join("") || '<div class="friends-empty">' + icon("friends") + "<h3>\u041E\u0442\u0440\u044F\u0434 \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442</h3><p>\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u0443\u0439 \u0434\u0440\u0443\u0437\u0435\u0439 VK \u0438\u043B\u0438 \u0434\u043E\u0431\u0430\u0432\u044C \u0438\u0433\u0440\u043E\u043A\u043E\u0432 \u0438\u0437 \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \xAB\u0422\u041E\u041F \u0438\u0433\u0440\u043E\u043A\u043E\u0432\xBB. \u0417\u0434\u0435\u0441\u044C \u043D\u0435\u0442 \u0431\u043E\u0442\u043E\u0432 \u0438 \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0445 \u043F\u0440\u043E\u0444\u0438\u043B\u0435\u0439.</p></div>"}</div>
   <details class="settings-card"><summary>\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E \u0438\u0433\u0440\u043E\u0432\u043E\u043C\u0443 \u043A\u043E\u0434\u0443</summary><p>\u0422\u0432\u043E\u0439 \u043A\u043E\u0434: <strong>${esc(data.code)}</strong></p><form id="friend-form" class="friend-form"><input aria-label="\u041A\u043E\u0434 \u0438\u0433\u0440\u043E\u043A\u0430" maxlength="12" required pattern="[a-fA-F0-9]{12}" placeholder="12 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432"><button class="secondary">\u0414\u041E\u0411\u0410\u0412\u0418\u0422\u042C</button></form></details>`;
        const mutate = async (path, code, button) => {
          button.disabled = true;
          try {
            await api2(path, { code });
            await render();
            toast2("\u0421\u043F\u0438\u0441\u043E\u043A \u0434\u0440\u0443\u0437\u0435\u0439 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D");
          } catch (e) {
            toast2(e.message);
            button.disabled = false;
          }
        };
        root.querySelector("#friends-refresh").onclick = render;
        (_a2 = root.querySelector("#vk-sync")) == null ? void 0 : _a2.addEventListener("click", async (e) => {
          const b = e.currentTarget;
          b.disabled = true;
          try {
            await syncVKFriends(api2);
            await render();
            toast2("\u0414\u0440\u0443\u0437\u044C\u044F VK \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B");
          } catch (err) {
            toast2(err.message);
            b.disabled = false;
          }
        });
        for (const name of ["accept", "decline", "remove"]) root.querySelectorAll("[data-" + name + "]").forEach((b) => b.onclick = () => mutate("friends/" + name, b.dataset[name], b));
        root.querySelectorAll("[data-raid]").forEach((b) => b.onclick = () => openRaid(b.dataset.raid));
        root.querySelector("#friend-form").onsubmit = (e) => {
          e.preventDefault();
          mutate("friends/request", e.target.querySelector("input").value.trim().toLowerCase(), e.target.querySelector("button"));
        };
      } catch (e) {
        root.innerHTML = '<div class="settings-card"><p>' + esc(e.message) + '</p><button class="secondary">\u041F\u041E\u0412\u0422\u041E\u0420\u0418\u0422\u042C</button></div>';
        root.querySelector("button").onclick = render;
      } finally {
        pending.delete(root);
      }
    }
    render();
  }
  var esc, portrait, autoSyncAttempted, pending;
  var init_friends_ui = __esm({
    "friends-ui.js"() {
      init_vk_profile();
      init_profile_ui();
      init_ui_icons();
      init_platform_entry();
      esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      portrait = (p) => '<span class="friend-avatar avatar-' + (Number(p.avatar) || 0) + '" aria-hidden="true">' + (vkPhoto(p.photo) ? '<img src="' + esc(vkPhoto(p.photo)) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : AVATARS[p.avatar] || AVATARS[0]) + "</span>";
      autoSyncAttempted = false;
      pending = /* @__PURE__ */ new WeakSet();
    }
  });

  // raid-view.js
  function tickRaid(root, raid2, save2, offset) {
    const button = root.querySelector("#raid-attack");
    if (!button || !raid2) return;
    const seconds = Math.max(0, Math.ceil((raid2.nextAttack - Date.now() - offset) / 1e3));
    button.disabled = !!raid2.arenaPending || !!raid2.blockedBy || !raid2.joined || !raidAllowed(save2, raid2.map, raid2.rare) || raid2.hp <= 0 || seconds > 0 || save2.energy < BOSS_COST;
    button.textContent = raid2.arenaPending ? "\u0417\u0430\u0432\u0435\u0440\u0448\u0438 \u0430\u0440\u0435\u043D\u0443" : raid2.blockedBy ? "\u0414\u0440\u0443\u0433\u043E\u0439 \u0431\u043E\u0441\u0441 \u0430\u043A\u0442\u0438\u0432\u0435\u043D" : raid2.hp <= 0 ? "\u0411\u043E\u0441\u0441 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D" : seconds ? "\u041D\u0430\u043B\u0451\u0442 \xB7 " + seconds + " \u0441" : save2.energy < BOSS_COST ? "\u041D\u0443\u0436\u043D\u043E 12 \u044D\u043D\u0435\u0440\u0433\u0438\u0438" : "\u041D\u0430\u043B\u0451\u0442 \xB7 12 \u03DF";
    const arena = root.querySelector("#raid-arena");
    if (arena) {
      arena.disabled = raid2.arenaVersion !== 1 || !!raid2.blockedBy || !raid2.joined || !raidAllowed(save2, raid2.map, raid2.rare) || raid2.hp <= 0 || !raid2.arenaPending && (seconds > 0 || save2.energy < BOSS_COST);
      arena.textContent = raid2.arenaVersion !== 1 ? "\u0421\u0435\u0440\u0432\u0435\u0440 \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0435\u0442\u0441\u044F" : raid2.hp <= 0 ? "\u0411\u043E\u0441\u0441 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D" : raid2.arenaPending ? "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0430\u0440\u0435\u043D\u0443" : seconds ? "\u0410\u0440\u0435\u043D\u0430 \xB7 " + seconds + " \u0441" : "\u0410\u0440\u0435\u043D\u0430 \xB7 12 \u03DF";
    }
  }
  function renderRaidView(root, { raid: raid2, save: save2, selected: selected2, rareMode: rareMode2, offset, onMode, onMap, onCreate, onAttack, onArena, onPractice, onJoin, onClaim, onClose, onCopy, onPrepare }) {
    var _a2, _b2, _c, _d, _e, _f;
    const map = raid2 ? raid2.map : selected2, rare = raid2 ? !!raid2.rare : rareMode2, m = MAPS[map], profile = RARE_RAIDS[map], allowed = raidAllowed(save2, map, rare), mine = raid2 == null ? void 0 : raid2.members.find((p) => p.me);
    const reward = (raid2 == null ? void 0 : raid2.reward) || { scrap: m.reward * 2, xp: 45, cores: 3, cloth: 6 };
    const capacity = (raid2 == null ? void 0 : raid2.capacity) || RAID_CAPACITY;
    const arena = arenaContract(save2, map, rare);
    const hit = (_a2 = raid2 == null ? void 0 : raid2.estimatedDamage) != null ? _a2 : raidHit(save2, map, rare);
    const hp = (_b2 = raid2 == null ? void 0 : raid2.hp) != null ? _b2 : rare ? profile.hp : raidProfile(map).hp, maxHp = (_c = raid2 == null ? void 0 : raid2.maxHp) != null ? _c : hp;
    const party = (raid2 == null ? void 0 : raid2.members) || [];
    const requiredLevel = rare ? profile.level : m.level, remaining = Math.max(0, 3 - (save2.districtRuns[map] || 0));
    const accessReason = allowed ? "\u0414\u043E\u0441\u0442\u0443\u043F \u043E\u0442\u043A\u0440\u044B\u0442" : !unlocked(save2, map) ? "\u041F\u043E\u0431\u0435\u0434\u0438 \u0431\u043E\u0441\u0441\u0430 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0433\u043E \u0440\u0430\u0439\u043E\u043D\u0430" : playerLevel(save2) < requiredLevel ? "\u041D\u0443\u0436\u0435\u043D \u0443\u0440\u043E\u0432\u0435\u043D\u044C " + requiredLevel : remaining ? "\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0447\u0438\u0441\u0442\u043E\u043A: " + remaining : rare && !save2.cleared.includes(map) ? "\u041F\u043E\u0431\u0435\u0434\u0438 \u043E\u0431\u044B\u0447\u043D\u0443\u044E \u0432\u0435\u0440\u0441\u0438\u044E" : "\u041D\u0443\u0436\u0435\u043D \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0440\u0430\u0439\u043E\u043D\u0430";
    const oldArena = (_d = root.querySelector(".arena-guide")) == null ? void 0 : _d.open, oldDetails = (_e = root.querySelector(".raid-rules")) == null ? void 0 : _e.open, oldPage = Number(root.dataset.partyPage || 0);
    const same = root.dataset.encounter === ((raid2 == null ? void 0 : raid2.id) || "catalog");
    root.dataset.encounter = (raid2 == null ? void 0 : raid2.id) || "catalog";
    root.dataset.partyPage = String(same ? oldPage : 0);
    root.innerHTML = `<div class="raid-toolbar"><div class="raid-tabs" role="group" aria-label="\u0422\u0438\u043F \u0431\u043E\u0441\u0441\u0430">${raid2 && hp > 0 ? `<span class="raid-active-state">${rare ? "\u0420\u0435\u0434\u043A\u0438\u0439" : "\u041E\u0431\u044B\u0447\u043D\u044B\u0439"} \u0440\u0435\u0439\u0434 \xB7 ${raid2.blockedBy ? "\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440" : "\u0430\u043A\u0442\u0438\u0432\u0435\u043D"}</span>` : `<button class="secondary" data-mode="normal" aria-pressed="${!rare}">\u041E\u0431\u044B\u0447\u043D\u044B\u0435</button><button class="secondary" data-mode="rare" aria-pressed="${rare}">\u0420\u0435\u0434\u043A\u0438\u0435</button>`}</div><div class="raid-picker">${!raid2 ? `<label class="raid-select" for="raid-map">\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0431\u043E\u0441\u0441\u0430</label><select id="raid-map" class="boss-select">${MAPS.map((v, i) => `<option value="${i}" ${map === i ? "selected" : ""}>${v.boss}${rare ? " \xB7 \u0443\u0440. " + RARE_RAIDS[i].level : ""}</option>`).join("")}</select>` : ""}</div></div>


 <article class="boss-encounter ${rare ? "is-rare" : ""}">
 <div class="boss-stage" style="--boss-scene:url('assets/district-${map}.png')"><span class="boss-rarity">${rare ? "\u0420\u0415\u0414\u041A\u0418\u0419" : "\u0411\u041E\u0421\u0421 \u0420\u0410\u0419\u041E\u041D\u0410"} \xB7 ${escape(m.name)}</span><img class="boss-character" src="assets/boss-${BOSS_ART[map]}.png" alt="${escape(m.boss)} \u2014 ${roles[map]}" width="512" height="512" decoding="async"><span class="boss-stage-caption">${roles[map]}</span></div>
 <div class="boss-brief"><span class="eyebrow">${raid2 ? "\u041E\u0411\u0429\u0418\u0419 \u0420\u0415\u0419\u0414" : "\u0414\u041E\u0421\u042C\u0415 \u041F\u0420\u041E\u0422\u0418\u0412\u041D\u0418\u041A\u0410"}</span><h2>${m.boss}</h2><div class="boss-hp-label"><b>${fmt(hp)}</b><span>/ ${fmt(maxHp)} HP</span></div><div class="raid-health" role="progressbar" aria-label="\u0417\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u0431\u043E\u0441\u0441\u0430" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(hp / maxHp * 1e4) / 100}" aria-valuetext="${fmt(hp)} \u0438\u0437 ${fmt(maxHp)} HP"><i style="width:${hp / maxHp * 100}%"></i></div>
 ${raid2 ? `<p class="raid-total">\u041E\u0411\u0429\u0418\u0419 \u0423\u0420\u041E\u041D: <b>${fmt((_f = raid2.totalDamage) != null ? _f : maxHp - hp)}</b> \xB7 \u0422\u0412\u041E\u0419: <b>${fmt(mine == null ? void 0 : mine.damage)}</b></p><p class="page-intro">${raid2.blockedBy ? "\u0423 \u0442\u0435\u0431\u044F \u0443\u0436\u0435 \u0435\u0441\u0442\u044C \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0431\u043E\u0441\u0441. \u0417\u0430\u0432\u0435\u0440\u0448\u0438 \u0435\u0433\u043E, \u0447\u0442\u043E\u0431\u044B \u0432\u0441\u0442\u0443\u043F\u0438\u0442\u044C \u0432 \u044D\u0442\u043E\u0442 \u0440\u0435\u0439\u0434." : hp > 0 ? "\u0410\u0442\u0430\u043A\u0438 \u0432\u0441\u0435\u0445 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u0443\u043C\u0435\u043D\u044C\u0448\u0430\u044E\u0442 \u043E\u0434\u043D\u043E \u043E\u0431\u0449\u0435\u0435 \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u0435." : "\u041E\u0431\u0449\u0430\u044F \u043F\u043E\u0431\u0435\u0434\u0430! \u0417\u0430\u0431\u0435\u0440\u0438 \u0441\u0432\u043E\u044E \u043D\u0430\u0433\u0440\u0430\u0434\u0443."}</p>` : ""}<div class="boss-facts"><div><span>\u0422\u0432\u043E\u044F \u0430\u0442\u0430\u043A\u0430</span><b>${fmt(hit)}</b></div><div><span>\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438</span><b>${party.length} / ${capacity}</b></div><div><span>\u041F\u043E\u0432\u0442\u043E\u0440</span><b>${raidProfile(map).cooldown / 1e3} \u0441\u0435\u043A</b></div></div>
 ${!raid2 ? `<p class="boss-access">\u0423\u0440\u043E\u0432\u0435\u043D\u044C ${rare ? profile.level : m.level} \xB7 3 \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0438${rare ? " \xB7 \u043F\u043E\u0431\u0435\u0434\u0430 \u043D\u0430\u0434 \u043E\u0431\u044B\u0447\u043D\u043E\u0439 \u0432\u0435\u0440\u0441\u0438\u0435\u0439" : ""}<br><span>${accessReason}</span></p>${allowed ? '<button class="primary boss-action" id="create-raid">\u041D\u0430\u0447\u0430\u0442\u044C \u0440\u0435\u0439\u0434</button>' : '<button class="primary boss-action" id="raid-prepare">\u041A \u0440\u0430\u0439\u043E\u043D\u0443</button>'}` : `<div class="raid-actions"><button class="primary boss-action" id="raid-arena">\u0410\u0440\u0435\u043D\u0430 \xB7 12 \u03DF</button><button class="secondary boss-action" id="raid-attack">\u041D\u0430\u043B\u0451\u0442 \xB7 12 \u03DF</button>${!raid2.joined && hp > 0 ? `<button class="secondary boss-action" id="join-raid" ${raid2.blockedBy || !allowed || party.length >= capacity ? "disabled" : ""}>${!allowed ? "\u041D\u0443\u0436\u0435\u043D \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441" : party.length >= capacity ? "\u041E\u0442\u0440\u044F\u0434 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D" : "\u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u044C\u0441\u044F"}</button>` : ""}</div><p class="raid-action-note">\u0410\u0440\u0435\u043D\u0430 \u2014 30 \u0441\u0435\u043A\u0443\u043D\u0434 \u0431\u043E\u044F, \u0434\u043E +20% \u0432\u043A\u043B\u0430\u0434\u0430. \u041D\u0430\u043B\u0451\u0442 \u2014 \u043E\u0431\u044B\u0447\u043D\u0430\u044F \u0430\u0442\u0430\u043A\u0430 \u0431\u0435\u0437 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F.</p>`}
 </div></article>
 <div class="arena-tools"><button class="secondary" id="arena-practice">\u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430</button><p>\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \xB7 \u0431\u0435\u0437 \u043E\u043F\u044B\u0442\u0430 \u0438 \u043D\u0430\u0433\u0440\u0430\u0434</p><details class="arena-guide" ${oldArena && same ? "open" : ""}><summary>\u041E\u0431 \u0430\u0440\u0435\u043D\u0435 \xB7 30 \u0441\u0435\u043A</summary><section class="arena-briefing"><div class="arena-briefing-copy"><span class="eyebrow">\u041D\u041E\u0412\u042B\u0419 \u0411\u041E\u0415\u0412\u041E\u0419 \u0423\u0417\u0415\u041B / 00</span><h3>\u041D\u0443\u043B\u0435\u0432\u0430\u044F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430.</h3><p>\u0423\u0434\u0435\u0440\u0436\u0438 \u043F\u043E\u0437\u0438\u0446\u0438\u044E 30 \u0441\u0435\u043A\u0443\u043D\u0434. \u0423\u0445\u043E\u0434\u0438 \u0438\u0437 \u043E\u0442\u043C\u0435\u0447\u0435\u043D\u043D\u044B\u0445 \u0437\u043E\u043D \u0438 \u0430\u0442\u0430\u043A\u0443\u0439 \u043F\u043E\u0441\u043B\u0435 \u0442\u044F\u0436\u0451\u043B\u043E\u0433\u043E \u0443\u0434\u0430\u0440\u0430 \u0431\u043E\u0441\u0441\u0430.</p><div class="arena-briefing-facts"><span><b>30 \u0441\u0435\u043A</b> \u0422\u0440\u0438 \u0444\u0430\u0437\u044B</span><span><b>12 \u044D\u043D\u0435\u0440\u0433\u0438\u0438</b> \u0426\u0435\u043D\u0430 \u0431\u043E\u044F</span><span><b>\u0414\u043E ${fmt(arena.cap)}</b> \u0412\u043A\u043B\u0430\u0434 \u0432 \u0440\u0435\u0439\u0434</span></div></div><div class="arena-phase-list"><span><b>01</b><i>\u041D\u0430\u0431\u043B\u044E\u0434\u0435\u043D\u0438\u0435<small>\u0423\u043A\u043B\u043E\u043D\u044F\u0439\u0441\u044F \u043E\u0442 \u043E\u0434\u0438\u043D\u043E\u0447\u043D\u043E\u0433\u043E \u0443\u0434\u0430\u0440\u0430</small></i></span><span><b>02</b><i>\u041F\u043E\u0434\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u0438\u0435<small>\u041E\u0442\u043F\u043E\u0440 \u0443\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0445</small></i></span><span><b>03</b><i>\u042F\u0440\u043E\u0441\u0442\u044C<small>\u0414\u0432\u0435 \u0437\u043E\u043D\u044B \u0443\u0434\u0430\u0440\u0430 \u2014 \u043D\u0430\u0439\u0434\u0438 \u0432\u044B\u0445\u043E\u0434</small></i></span></div></section></details></div>
 <section class="raid-loot"><div class="section-title"><h3>${raid2 ? "\u0422\u0432\u043E\u044F \u043D\u0430\u0433\u0440\u0430\u0434\u0430 \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0431\u0435\u0434\u044B" : rare ? "\u041E\u0431\u0449\u0438\u0439 \u0444\u043E\u043D\u0434 \u0440\u0435\u0439\u0434\u0430" : "\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u0437\u0430 \u043F\u043E\u0431\u0435\u0434\u0443"}</h3></div><div class="raid-rewards">${rewards(raid2 ? reward : rare ? profile.pool : reward)}</div>${rare ? "<p>\u0424\u043E\u043D\u0434 \u0434\u0435\u043B\u0438\u0442\u0441\u044F \u043F\u043E \u043D\u0430\u043D\u0435\u0441\u0451\u043D\u043D\u043E\u043C\u0443 \u0443\u0440\u043E\u043D\u0443. \u0411\u0435\u0437 \u0443\u0447\u0430\u0441\u0442\u0438\u044F \u0432 \u0430\u0442\u0430\u043A\u0435 \u043D\u0430\u0433\u0440\u0430\u0434\u044B \u043D\u0435\u0442.</p>" : "<p>\u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u0440\u0430\u0441\u0442\u0451\u0442 \u0441 \u0442\u0432\u043E\u0438\u043C \u0432\u043A\u043B\u0430\u0434\u043E\u043C. \u041F\u043E\u043B\u043D\u0430\u044F \u043D\u0430\u0433\u0440\u0430\u0434\u0430 \u2014 \u0437\u0430 25% \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u044F \u0431\u043E\u0441\u0441\u0430; \u043C\u0435\u043D\u044C\u0448\u0438\u0439 \u0432\u043A\u043B\u0430\u0434 \u0434\u0430\u0451\u0442 \u043F\u0440\u043E\u043F\u043E\u0440\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u0443\u044E \u0447\u0430\u0441\u0442\u044C.</p>"}${raid2 && hp === 0 && (mine == null ? void 0 : mine.damage) && !mine.claimed ? '<button class="primary" id="raid-claim">\u0417\u0430\u0431\u0440\u0430\u0442\u044C \u043D\u0430\u0433\u0440\u0430\u0434\u0443</button>' : ""}</section>
 <details class="raid-rules" ${oldDetails && same ? "open" : ""}><summary>\u041F\u0440\u0430\u0432\u0438\u043B\u0430 \u0438 \u0443\u0441\u043B\u043E\u0432\u0438\u044F \u0440\u0435\u0439\u0434\u0430</summary><p>\u0410\u0442\u0430\u043A\u0438 \u0432 \u0443\u0434\u043E\u0431\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F, \u043E\u0431\u0449\u0435\u0435 \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F. \u0426\u0435\u043D\u0430 \u2014 12 \u044D\u043D\u0435\u0440\u0433\u0438\u0438. \u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u043D\u0430\u043B\u0451\u0442 \u043D\u0430\u043D\u043E\u0441\u0438\u0442 \u043E\u0431\u044B\u0447\u043D\u044B\u0439 \u0443\u0440\u043E\u043D \u0431\u0435\u0437 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F. \u0410\u0440\u0435\u043D\u0430 \u2014 \u0431\u043E\u0439 \u043D\u0430 30 \u0441\u0435\u043A\u0443\u043D\u0434, \u0434\u043E +20% \u043A \u043E\u0431\u044B\u0447\u043D\u043E\u043C\u0443 \u0432\u043A\u043B\u0430\u0434\u0443. \u0423\u0440\u043E\u043D \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F; \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0447\u0438\u0441\u043B\u044F\u0435\u0442. ${rare ? "\u041E\u0441\u0430\u0434\u043D\u043E\u0435 \u0443\u0441\u0438\u043B\u0435\u043D\u0438\u0435 \xD7" + profile.multiplier.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + ". \u041E\u043D\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u0440\u0435\u0434\u043A\u0438\u0445 \u0431\u043E\u0441\u0441\u043E\u0432. \u041D\u0430\u0433\u0440\u0430\u0434\u044B \u043E\u043A\u0440\u0443\u0433\u043B\u044F\u044E\u0442\u0441\u044F \u0432\u043D\u0438\u0437 \u0438 \u0432\u044B\u0434\u0430\u044E\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0431\u0435\u0434\u044B. \u0420\u0435\u0439\u0434 \u0431\u0435\u0437 \u0441\u0440\u043E\u043A\u0430 \u0438\u0441\u0442\u0435\u0447\u0435\u043D\u0438\u044F." : raidProfile(map).trait}</p><p>\u041D\u0430 \u0438\u0433\u0440\u043E\u043A\u0430 \u2014 \u043E\u0434\u0438\u043D \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0431\u043E\u0441\u0441 \u0434\u043E \u043F\u043E\u0431\u0435\u0434\u044B. \u041F\u0440\u0438 \u0432\u044B\u0431\u043E\u0440\u0435 \u0442\u043E\u0433\u043E \u0436\u0435 \u0431\u043E\u0441\u0441\u0430 \u0438\u0433\u0440\u0430 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u044F\u0435\u0442 \u043A \u043E\u0431\u0449\u0435\u043C\u0443 \u0440\u0435\u0439\u0434\u0443, \u0432 \u043F\u0435\u0440\u0432\u0443\u044E \u043E\u0447\u0435\u0440\u0435\u0434\u044C \u0441 \u0434\u0440\u0443\u0437\u044C\u044F\u043C\u0438. \u0423\u0440\u043E\u043D \u0432\u0441\u0435\u0445 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u0441\u0443\u043C\u043C\u0438\u0440\u0443\u0435\u0442\u0441\u044F; \u043F\u043E\u043B\u043D\u044B\u0439 \u043E\u0442\u0440\u044F\u0434 \u2014 300 \u0438\u0433\u0440\u043E\u043A\u043E\u0432. \u0415\u0441\u043B\u0438 \u043E\u0442\u0440\u044F\u0434 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D, \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439.</p></details>
 ${raid2 ? (raid2.blockedBy || hp <= 0 ? '<div class="raid-controls"><button class="secondary" id="close-raid">' + (raid2.blockedBy ? "\u041A \u043C\u043E\u0435\u043C\u0443 \u0431\u043E\u0441\u0441\u0443" : "\u041A \u0441\u043F\u0438\u0441\u043A\u0443 \u0431\u043E\u0441\u0441\u043E\u0432") + "</button></div>" : "") + '<section class="raid-party"><h3>\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \xB7 ' + party.length + '</h3><div class="party-list"></div><div class="party-pagination"></div></section>' : ""}`;
    root.querySelectorAll("[data-mode]").forEach((b) => b.onclick = () => onMode(b.dataset.mode === "rare"));
    const bind = (id, fn) => {
      const el = root.querySelector("#" + id);
      if (el) el.onclick = fn;
    };
    const select = root.querySelector("#raid-map");
    if (select) select.onchange = (e) => onMap(Number(e.target.value));
    bind("raid-prepare", onPrepare);
    bind("arena-practice", () => {
      root.querySelector("#arena-practice").textContent = "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026";
      onPractice();
    });
    bind("raid-arena", () => {
      root.querySelector("#raid-arena").textContent = "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026";
      onArena();
    });
    bind("create-raid", onCreate);
    bind("raid-attack", onAttack);
    bind("join-raid", onJoin);
    bind("raid-claim", onClaim);
    bind("close-raid", onClose);
    bind("copy-raid", onCopy);
    if (raid2) {
      const sorted = [...party].sort((a, b) => Number(b.me) - Number(a.me) || b.damage - a.damage), pages = Math.ceil(sorted.length / 20);
      const paint = () => {
        const page2 = Math.min(Number(root.dataset.partyPage), Math.max(0, pages - 1));
        root.dataset.partyPage = page2;
        root.querySelector(".party-list").innerHTML = sorted.slice(page2 * 20, page2 * 20 + 20).map((p) => `<div>${portrait(p)}<span><b>${escape(p.name)}${p.me ? " \xB7 \u0422\u042B" : ""}</b><small>${p.online ? "\u0412 \u0441\u0435\u0442\u0438" : "\u041D\u0435 \u0432 \u0441\u0435\u0442\u0438"}</small></span><div class="party-contribution"><b>${fmt(p.damage)} \u0443\u0440\u043E\u043D\u0430</b><div><i style="width:${Math.min(100, p.damage / maxHp * 100)}%"></i></div></div>${p.claimed ? "<small>\u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0430</small>" : ""}</div>`).join("");
        const nav = root.querySelector(".party-pagination");
        nav.innerHTML = pages > 1 ? `<button class="secondary" ${page2 === 0 ? "disabled" : ""}>\u2190</button><span>${page2 + 1} / ${pages}</span><button class="secondary" ${page2 === pages - 1 ? "disabled" : ""}>\u2192</button>` : "";
        const buttons = nav.querySelectorAll("button");
        if (buttons.length) {
          buttons[0].ariaLabel = "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0435 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438";
          buttons[1].ariaLabel = "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438";
          buttons[0].onclick = () => {
            root.dataset.partyPage = page2 - 1;
            paint();
          };
          buttons[1].onclick = () => {
            root.dataset.partyPage = page2 + 1;
            paint();
          };
        }
      };
      paint();
      tickRaid(root, raid2, save2, offset);
    }
  }
  var BOSS_ART, roles, fmt, escape, rewards;
  var init_raid_view = __esm({
    "raid-view.js"() {
      init_boss_arena();
      init_friends_ui();
      init_balance();
      init_rare_raids();
      BOSS_ART = ["watcher", "arsonist", "crane", "doctor", "root", "driver", "smelter", "admiral"];
      roles = ["\u0425\u0440\u0430\u043D\u0438\u0442\u0435\u043B\u044C \u043F\u0443\u0441\u0442\u044B\u0445 \u0434\u043E\u043C\u043E\u0432", "\u041E\u0433\u043E\u043D\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0439 \u0437\u0430\u043F\u0440\u0430\u0432\u043A\u0438", "\u0425\u043E\u0437\u044F\u0438\u043D \u0433\u0440\u0443\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u0432\u043E\u0440\u0430", "\u041A\u0430\u0440\u0430\u043D\u0442\u0438\u043D \u043D\u0435 \u043E\u043A\u043E\u043D\u0447\u0435\u043D", "\u0421\u0435\u0440\u0434\u0446\u0435 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u043E\u0433\u043E \u043B\u0435\u0441\u0430", "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0440\u0435\u0439\u0441", "\u0416\u0430\u0440 \u043C\u0451\u0440\u0442\u0432\u044B\u0445 \u043F\u0435\u0447\u0435\u0439", "\u041A\u043E\u043C\u0430\u043D\u0434\u0438\u0440 \u0437\u0430\u0442\u043E\u043D\u0443\u0432\u0448\u0435\u0433\u043E \u0444\u043B\u043E\u0442\u0430"];
      fmt = (n) => Math.floor(n || 0).toLocaleString("ru-RU");
      escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      rewards = (r) => Object.entries({ scrap: "\u0414\u0435\u0442\u0430\u043B\u0438", xp: "\u041E\u043F\u044B\u0442", cores: "\u042F\u0434\u0440\u0430", cloth: "\u0422\u043A\u0430\u043D\u044C" }).map(([k, name]) => "<div><strong>" + fmt(r[k]) + "</strong><span>" + name + "</span></div>").join("");
    }
  });

  // arena-art.js
  async function loadArenaArt(map) {
    floorPromise != null ? floorPromise : floorPromise = loadArtImage("assets/arena-zero.png").catch((e) => {
      floorPromise = null;
      throw e;
    });
    if (!portraits.has(map)) portraits.set(map, loadArtImage("assets/boss-" + BOSS_ART[map] + ".png").catch((e) => {
      portraits.delete(map);
      throw e;
    }));
    const [floor, boss] = await Promise.all([floorPromise, portraits.get(map)]);
    return { floor, boss };
  }
  function drawArenaBoss(ctx, image, boss, time, face) {
    ctx.save();
    ctx.translate(Math.round(boss.x), Math.round(boss.y));
    ctx.fillStyle = "#07151488";
    ctx.beginPath();
    ctx.ellipse(0, 0, 45, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.scale(face, 1);
    ctx.imageSmoothingEnabled = false;
    if (boss.flash) ctx.globalAlpha = 0.6;
    ctx.drawImage(image, -100, -195 - Math.sin(time * 3) * 2, 200, 200);
    ctx.restore();
  }
  function drawArenaStrike(ctx, attack) {
    const progress = 1 - Math.max(0, attack.t) / attack.total;
    for (const z of attack.zones) {
      ctx.save();
      ctx.fillStyle = "#ad513850";
      ctx.strokeStyle = "#f2c783";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(z.x, z.y, z.radius, z.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = "#d8794b";
      ctx.beginPath();
      ctx.ellipse(z.x, z.y, z.radius * progress, z.radius * 0.6 * progress, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffdfaa";
      ctx.fillText("\u0423\u0414\u0410\u0420", z.x, z.y + 4);
      ctx.restore();
    }
  }
  var floorPromise, portraits;
  var init_arena_art = __esm({
    "arena-art.js"() {
      init_art();
      init_raid_view();
      portraits = /* @__PURE__ */ new Map();
    }
  });

  // campaign.js
  function campaignState(save2) {
    const completed = new Set((save2.cleared || []).filter((i) => Number.isInteger(i) && MAPS[i]));
    const districts = MAPS.map((map, index) => {
      var _a2;
      const runs = Math.min(3, count((_a2 = save2.districtRuns) == null ? void 0 : _a2[index])), done = completed.has(index), open = unlocked(save2, index), level = playerLevel(save2);
      return { index, name: map.name, role: DISTRICT_ROLES[index], level: map.level, boss: map.boss, runs, done, open, status: done ? "\u041E\u0421\u0412\u041E\u0415\u041D" : !open ? "\u0417\u0410\u041A\u0420\u042B\u0422" : runs < 3 ? "\u0417\u0410\u0427\u0418\u0421\u0422\u041A\u0410" : level < map.level ? "\u041D\u0423\u0416\u0415\u041D \u0423\u0420\u041E\u0412\u0415\u041D\u042C" : "\u0411\u041E\u0421\u0421 \u0414\u041E\u0421\u0422\u0423\u041F\u0415\u041D" };
    });
    const next = districts.find((d) => !d.done) || null;
    const action2 = !next ? "campaign-complete" : next.runs < 3 ? "sortie" : playerLevel(save2) < next.level ? "level" : "boss";
    return { districts, completed: completed.size, total: MAPS.length, percent: Math.round(completed.size / MAPS.length * 100), next, action: action2, title: !next ? "\u0412\u0441\u0435 \u0432\u043E\u0441\u0435\u043C\u044C \u0440\u0430\u0439\u043E\u043D\u043E\u0432 \u043E\u0441\u0432\u043E\u0435\u043D\u044B" : action2 === "level" ? "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C\u0441\u044F \u043A \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u043C\u0443 \u0440\u0430\u0439\u043E\u043D\u0443" : action2 === "boss" ? "\u041F\u043E\u0431\u0435\u0434\u0438 \u0431\u043E\u0441\u0441\u0430 \u0440\u0430\u0439\u043E\u043D\u0430" : next.runs ? "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438 \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0443" : "\u041E\u0442\u043A\u0440\u043E\u0439 \u043F\u0443\u0442\u044C \u0432 \u0440\u0430\u0439\u043E\u043D", description: !next ? "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0439 \u0440\u0435\u0439\u0434\u044B, \u043F\u043E\u043C\u043E\u0433\u0430\u0439 \u0434\u0440\u0443\u0437\u044C\u044F\u043C \u0438 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0439 \u043F\u0440\u0438\u043A\u0430\u0437\u044B \u0443\u0431\u0435\u0436\u0438\u0449\u0430." : action2 === "level" ? "\u041D\u0443\u0436\u0435\u043D \u0443\u0440\u043E\u0432\u0435\u043D\u044C " + next.level + ". \u041F\u043E\u0432\u0442\u043E\u0440\u044F\u0439 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0432\u044B\u043B\u0430\u0437\u043A\u0438 \u0434\u043B\u044F \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043E\u043F\u044B\u0442\u0430." : action2 === "boss" ? next.boss + " \u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0440\u0430\u0439\u043E\u043D. \u041F\u043E\u0431\u0435\u0434\u0430 \u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u043D\u0430\u0433\u0440\u0430\u0434\u044B \u043E\u0442\u043A\u0440\u043E\u044E\u0442 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439." : next.name + " \xB7 \u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0431\u0435\u0434\u043D\u044B\u0445 \u0432\u044B\u043B\u0430\u0437\u043E\u043A: " + (3 - next.runs) };
  }
  function claims(save2) {
    const ids = new Set(MILESTONES.map((m) => m.id));
    save2.chronicleClaims = [...new Set((Array.isArray(save2.chronicleClaims) ? save2.chronicleClaims : []).filter((id) => ids.has(id)))];
    return save2.chronicleClaims;
  }
  function milestoneView(save2) {
    const claimed = claims(save2), metrics = { runs: MAPS.reduce((n, _, i) => {
      var _a2;
      return n + count((_a2 = save2.districtRuns) == null ? void 0 : _a2[i]);
    }, 0), kills: count(save2.kills), bosses: count(save2.bossKills), districts: unique(save2.cleared, MAPS.length), weapons: unique(save2.owned, WEAPONS.length), armor: unique(save2.ownedArmor, ARMOR.length), level: playerLevel(save2) };
    return MILESTONES.map((m) => ({ ...m, progress: Math.min(m.goal, metrics[m.metric]), claimed: claimed.includes(m.id) }));
  }
  var count, unique, DISTRICT_ROLES, MILESTONES;
  var init_campaign = __esm({
    "campaign.js"() {
      init_balance();
      count = (n) => Number.isFinite(Number(n)) ? Math.max(0, Math.floor(Number(n))) : 0;
      unique = (values, max) => new Set((Array.isArray(values) ? values : []).filter((n) => Number.isInteger(n) && n >= 0 && n < max)).size;
      DISTRICT_ROLES = ["\u0416\u0438\u043B\u043E\u0439 \u0441\u0435\u043A\u0442\u043E\u0440", "\u0422\u043E\u043F\u043B\u0438\u0432\u043D\u044B\u0439 \u0443\u0437\u0435\u043B", "\u0421\u043A\u043B\u0430\u0434 \u0441\u043D\u0430\u0431\u0436\u0435\u043D\u0438\u044F", "\u041C\u0435\u0434\u0438\u0446\u0438\u043D\u0441\u043A\u0438\u0439 \u0441\u0435\u043A\u0442\u043E\u0440", "\u0417\u043E\u043D\u0430 \u0441\u0438\u0433\u043D\u0430\u043B\u0430", "\u041F\u043E\u0434\u0437\u0435\u043C\u043D\u044B\u0439 \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442", "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0443\u0437\u0435\u043B", "\u0414\u0430\u043B\u044C\u043D\u044F\u044F \u0441\u0432\u044F\u0437\u044C"];
      MILESTONES = [
        { id: "first-sortie", title: "\u041F\u0435\u0440\u0432\u043E\u0435 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u0438\u0435", description: "\u0417\u0430\u0432\u0435\u0440\u0448\u0438 \u043E\u0434\u043D\u0443 \u043F\u043E\u0431\u0435\u0434\u043D\u0443\u044E \u0432\u044B\u043B\u0430\u0437\u043A\u0443.", metric: "runs", goal: 1, icon: "map", reward: { cloth: 1 } },
        { id: "hunter-100", title: "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043C\u0435\u0442\u0440", description: "\u0423\u0441\u0442\u0440\u0430\u043D\u0438 100 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0445.", metric: "kills", goal: 100, icon: "raids", reward: { scrap: 35 } },
        { id: "sorties-10", title: "\u041F\u043E\u043B\u0435\u0432\u043E\u0439 \u043E\u043F\u044B\u0442", description: "\u0417\u0430\u0432\u0435\u0440\u0448\u0438 10 \u043F\u043E\u0431\u0435\u0434\u043D\u044B\u0445 \u0432\u044B\u043B\u0430\u0437\u043E\u043A.", metric: "runs", goal: 10, icon: "map", reward: { scrap: 45, cloth: 2 } },
        { id: "first-boss", title: "\u041F\u0435\u0440\u0432\u0430\u044F \u043E\u0431\u0449\u0430\u044F \u043F\u043E\u0431\u0435\u0434\u0430", description: "\u041F\u043E\u043B\u0443\u0447\u0438 \u043D\u0430\u0433\u0440\u0430\u0434\u0443 \u0437\u0430 \u043F\u043E\u0431\u0435\u0434\u0443 \u043D\u0430\u0434 \u0431\u043E\u0441\u0441\u043E\u043C.", metric: "bosses", goal: 1, icon: "raids", reward: { cores: 1, cloth: 2 } },
        { id: "arsenal-3", title: "\u041D\u0430 \u0432\u0441\u0435 \u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u0438", description: "\u0421\u043E\u0431\u0435\u0440\u0438 \u0442\u0440\u0438 \u0440\u0430\u0437\u043D\u044B\u0435 \u043C\u043E\u0434\u0435\u043B\u0438 \u043E\u0440\u0443\u0436\u0438\u044F.", metric: "weapons", goal: 3, icon: "gear", reward: { cloth: 2 } },
        { id: "districts-3", title: "\u0413\u043E\u0440\u043E\u0434 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442", description: "\u041E\u0441\u0432\u043E\u0439 \u0442\u0440\u0438 \u0440\u0430\u0437\u043D\u044B\u0445 \u0440\u0430\u0439\u043E\u043D\u0430.", metric: "districts", goal: 3, icon: "guide", reward: { cores: 2 } },
        { id: "hunter-500", title: "\u0417\u0430\u0447\u0438\u0441\u0442\u043A\u0430 \u0441\u0435\u043A\u0442\u043E\u0440\u0430", description: "\u0423\u0441\u0442\u0440\u0430\u043D\u0438 500 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0445.", metric: "kills", goal: 500, icon: "raids", reward: { scrap: 90, cloth: 3 } },
        { id: "armor-3", title: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u0440\u0435\u0448\u0430\u0435\u0442", description: "\u0421\u043E\u0431\u0435\u0440\u0438 \u0442\u0440\u0438 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0430 \u0431\u0440\u043E\u043D\u0438.", metric: "armor", goal: 3, icon: "clans", reward: { cloth: 3 } },
        { id: "level-25", title: "\u041E\u043F\u044B\u0442\u043D\u044B\u0439 \u0432\u044B\u0436\u0438\u0432\u0448\u0438\u0439", description: "\u0414\u043E\u0441\u0442\u0438\u0433\u043D\u0438 25 \u0443\u0440\u043E\u0432\u043D\u044F.", metric: "level", goal: 25, icon: "leaderboard", reward: { scrap: 250, cloth: 4 } },
        { id: "sorties-50", title: "\u041D\u0430\u0434\u0451\u0436\u043D\u044B\u0439 \u043C\u0430\u0440\u0448\u0440\u0443\u0442", description: "\u0417\u0430\u0432\u0435\u0440\u0448\u0438 50 \u043F\u043E\u0431\u0435\u0434\u043D\u044B\u0445 \u0432\u044B\u043B\u0430\u0437\u043E\u043A.", metric: "runs", goal: 50, icon: "map", reward: { scrap: 120, cloth: 4 } },
        { id: "districts-8", title: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0433\u043E\u0440\u043E\u0434 \u0436\u0438\u0432\u044B\u043C", description: "\u041E\u0441\u0432\u043E\u0439 \u0432\u0441\u0435 \u0432\u043E\u0441\u0435\u043C\u044C \u0440\u0430\u0439\u043E\u043D\u043E\u0432.", metric: "districts", goal: 8, icon: "guide", reward: { cores: 3, cloth: 12 } },
        { id: "hunter-2500", title: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u043B\u0438\u043D\u0438\u044F", description: "\u0423\u0441\u0442\u0440\u0430\u043D\u0438 2500 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0445.", metric: "kills", goal: 2500, icon: "conflict", reward: { scrap: 180, cloth: 5 } },
        { id: "level-100", title: "\u041E\u043F\u043E\u0440\u0430 \u0443\u0431\u0435\u0436\u0438\u0449\u0430", description: "\u0414\u043E\u0441\u0442\u0438\u0433\u043D\u0438 100 \u0443\u0440\u043E\u0432\u043D\u044F.", metric: "level", goal: 100, icon: "leaderboard", reward: { scrap: 500, cloth: 6 } },
        { id: "level-500", title: "\u041B\u0435\u0433\u0435\u043D\u0434\u0430 \u041E\u0431\u0438\u0442\u0435\u043B\u0438", description: "\u0414\u043E\u0441\u0442\u0438\u0433\u043D\u0438 500 \u0443\u0440\u043E\u0432\u043D\u044F.", metric: "level", goal: 500, icon: "leaderboard", reward: { cores: 10 } }
      ];
    }
  });

  // campaign-ui.js
  function renderCampaignSummary(root, save2, onContinue, onJournal) {
    const c = campaignState(save2), ready = milestoneView(save2).filter((m) => !m.claimed && m.progress >= m.goal).length;
    root.innerHTML = '<div class="campaign-seal">' + shelterIcon("guide") + '</div><div class="campaign-objective"><span class="eyebrow">\u041C\u0410\u0420\u0428\u0420\u0423\u0422 \u0412\u042B\u0416\u0418\u0412\u0428\u0415\u0413\u041E</span><h3>' + c.title + "</h3><p>" + c.description + '</p></div><div class="campaign-meter"><b>' + c.completed + "<small> / " + c.total + '</small></b><span>\u0420\u0410\u0419\u041E\u041D\u041E\u0412 \u041E\u0421\u0412\u041E\u0415\u041D\u041E</span><div><i style="width:' + c.percent + '%"></i></div></div><button class="secondary" data-campaign="continue">' + (ready ? "\u041D\u0410\u0413\u0420\u0410\u0414\u042B \xB7 " + ready : c.action === "boss" ? "\u041A \u0411\u041E\u0421\u0421\u0423" : c.next ? "\u041A \u0426\u0415\u041B\u0418" : "\u0412 \u0416\u0423\u0420\u041D\u0410\u041B") + "</button>";
    root.querySelector("button").onclick = () => ready ? onJournal(true) : c.next ? onContinue(c) : onJournal(false);
  }
  function renderCampaignJournal(root, save2, onMap, onRaids) {
    const c = campaignState(save2);
    root.innerHTML = '<div class="chronicle-hero"><span class="eyebrow">\u041A\u0410\u041C\u041F\u0410\u041D\u0418\u042F \xB7 \u0412\u041E\u0421\u0421\u0422\u0410\u041D\u041E\u0412\u041B\u0415\u041D\u0418\u0415 \u0413\u041E\u0420\u041E\u0414\u0410</span><h2>\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0433\u043E\u0440\u043E\u0434 \u0436\u0438\u0432\u044B\u043C.</h2><p>\u041E\u0441\u0432\u043E\u0439 \u0432\u043E\u0441\u0435\u043C\u044C \u0440\u0430\u0439\u043E\u043D\u043E\u0432. \u0422\u0440\u0438 \u043F\u043E\u0431\u0435\u0434\u043D\u044B\u0435 \u0432\u044B\u043B\u0430\u0437\u043A\u0438 \u0438 \u0443\u0440\u043E\u0432\u0435\u043D\u044C \u0440\u0430\u0439\u043E\u043D\u0430 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E\u0442 \u0431\u043E\u0441\u0441\u0430; \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0431\u0435\u0434\u044B \u043F\u043E\u043B\u0443\u0447\u0438 \u0435\u0433\u043E \u043D\u0430\u0433\u0440\u0430\u0434\u0443 \u0438 \u0434\u0432\u0438\u0433\u0430\u0439\u0441\u044F \u0434\u0430\u043B\u044C\u0448\u0435.</p><div class="city-route">' + c.districts.map((d) => {
      var _a2;
      return '<button data-route="' + d.index + '" class="' + (d.done ? "done" : ((_a2 = c.next) == null ? void 0 : _a2.index) === d.index ? "current" : "") + '" aria-label="' + d.name + ": " + d.status + '">' + String(d.index + 1).padStart(2, "0") + "</button>";
    }).join("") + '</div><span class="route-caption">' + c.completed + " / 8 \u0420\u0410\u0419\u041E\u041D\u041E\u0412 \u041E\u0421\u0412\u041E\u0415\u041D\u041E \xB7 " + (c.next ? "\u0423\u0420\u041E\u0412\u0415\u041D\u042C " + c.next.level + " \u0414\u041B\u042F \u0421\u041B\u0415\u0414\u0423\u042E\u0429\u0415\u0413\u041E \u0411\u041E\u0421\u0421\u0410" : "\u041A\u0410\u041C\u041F\u0410\u041D\u0418\u042F \u0417\u0410\u0412\u0415\u0420\u0428\u0415\u041D\u0410") + '</span></div><div class="district-dossiers">' + c.districts.map((d) => '<article class="district-dossier ' + (d.done ? "done" : "") + '"><div class="dossier-art" style="background-image:url(assets/district-' + d.index + '.webp)"><span>' + String(d.index + 1).padStart(2, "0") + "</span><b>" + d.status + '</b></div><div class="dossier-body"><span class="eyebrow">' + d.role + "</span><h3>" + d.name + "</h3><p>\u0423\u0440\u043E\u0432\u0435\u043D\u044C " + d.level + " \xB7 \u0411\u043E\u0441\u0441: " + d.boss + '</p><div class="district-stages">' + [1, 2, 3].map((n) => '<i class="' + (d.runs >= n ? "done" : "") + '"></i>').join("") + "<span>" + shelterIcon(d.done ? "leaderboard" : "raids") + "</span></div><small>" + d.runs + " / 3 \u0417\u0410\u0427\u0418\u0421\u0422\u041A\u0418 \xB7 " + (d.done ? "\u0411\u041E\u0421\u0421 \u041F\u041E\u0412\u0415\u0420\u0416\u0415\u041D" : "\u041F\u041E\u0411\u0415\u0414\u0418 \u0411\u041E\u0421\u0421\u0410 \u0414\u041B\u042F \u041F\u0420\u041E\u0414\u041E\u041B\u0416\u0415\u041D\u0418\u042F") + '</small><button class="' + (d.open ? "primary" : "secondary") + '" data-dossier="' + d.index + '">' + (!d.open ? "\u0422\u0420\u0415\u0411\u041E\u0412\u0410\u041D\u0418\u042F" : d.status === "\u0411\u041E\u0421\u0421 \u0414\u041E\u0421\u0422\u0423\u041F\u0415\u041D" ? "\u041A \u0411\u041E\u0421\u0421\u0423" : "\u0412\u042B\u0411\u0420\u0410\u0422\u042C \u0420\u0410\u0419\u041E\u041D") + "</button></div></article>").join("") + "</div>";
    root.querySelectorAll("[data-route]").forEach((b) => b.onclick = () => onMap(Number(b.dataset.route)));
    root.querySelectorAll("[data-dossier]").forEach((b) => b.onclick = () => {
      const d = c.districts[Number(b.dataset.dossier)];
      d.status === "\u0411\u041E\u0421\u0421 \u0414\u041E\u0421\u0422\u0423\u041F\u0415\u041D" ? onRaids(d.index) : onMap(d.index);
    });
  }
  async function renderMilestones(root, api2, toast2, onUpdate) {
    root.innerHTML = '<div class="chronicle-loading">\u0421\u0432\u0435\u0440\u044F\u0435\u043C \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F \u0441 \u0443\u0431\u0435\u0436\u0438\u0449\u0435\u043C\u2026</div>';
    try {
      const view = await api2("operations");
      if (!root.isConnected) return;
      if (!view.milestones) throw new Error("\u0421\u0435\u0440\u0432\u0435\u0440 \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0435\u0442\u0441\u044F. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u0447\u0435\u0440\u0435\u0437 \u043C\u0438\u043D\u0443\u0442\u0443.");
      const claimed = view.milestones.filter((m) => m.claimed).length, ready = view.milestones.filter((m) => !m.claimed && m.progress >= m.goal).length;
      root.innerHTML = '<div class="chronicle-hero milestone-hero"><span class="eyebrow">\u041B\u0418\u0427\u041D\u041E\u0415 \u0414\u0415\u041B\u041E \xB7 \u041F\u041E\u0421\u0422\u041E\u042F\u041D\u041D\u042B\u0415 \u0426\u0415\u041B\u0418</span><h2>\u0422\u0432\u043E\u0439 \u0441\u043B\u0435\u0434 \u0432 \u0433\u043E\u0440\u043E\u0434\u0435.</h2><p>\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F \u043D\u0435 \u0441\u0431\u0440\u0430\u0441\u044B\u0432\u0430\u044E\u0442\u0441\u044F. \u041A\u0430\u0436\u0434\u0430\u044F \u043D\u0430\u0433\u0440\u0430\u0434\u0430 \u0432\u044B\u0434\u0430\u0451\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437, \u0431\u0435\u0437 \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u043E\u043F\u044B\u0442\u0430.</p><div class="chronicle-totals"><b>' + claimed + " / " + view.milestones.length + "<small>\u041D\u0410\u0413\u0420\u0410\u0414 \u041F\u041E\u041B\u0423\u0427\u0415\u041D\u041E</small></b><b>" + ready + '<small>\u041C\u041E\u0416\u041D\u041E \u0417\u0410\u0411\u0420\u0410\u0422\u042C</small></b></div></div><div class="milestone-grid">' + [...view.milestones].sort((a, b) => Number(a.claimed) - Number(b.claimed) || Number(b.progress >= b.goal) - Number(a.progress >= a.goal)).map((m) => '<article class="milestone-card ' + (m.claimed ? "claimed" : m.progress >= m.goal ? "ready" : "") + '"><span class="milestone-emblem">' + shelterIcon(m.icon) + '</span><div><span class="eyebrow">' + (m.claimed ? "\u0417\u0410\u041F\u0418\u0421\u0410\u041D\u041E \u0412 \u0416\u0423\u0420\u041D\u0410\u041B" : m.progress >= m.goal ? "\u0426\u0415\u041B\u042C \u0414\u041E\u0421\u0422\u0418\u0413\u041D\u0423\u0422\u0410" : "\u041F\u041E\u0421\u0422\u041E\u042F\u041D\u041D\u0410\u042F \u0426\u0415\u041B\u042C") + "</span><h3>" + m.title + "</h3><p>" + m.description + '</p><div class="milestone-track" role="progressbar" aria-label="' + m.title + '" aria-valuenow="' + m.progress + '" aria-valuemin="0" aria-valuemax="' + m.goal + '"><i style="width:' + m.progress / m.goal * 100 + '%"></i></div><small>' + m.progress + " / " + m.goal + '</small></div><div class="milestone-reward"><b>' + rewardText(m.reward) + '</b><button class="' + (!m.claimed && m.progress >= m.goal ? "primary" : "secondary") + '" data-milestone="' + m.id + '" ' + (m.claimed || m.progress < m.goal ? "disabled" : "") + ">" + (m.claimed ? "\u041F\u041E\u041B\u0423\u0427\u0415\u041D\u041E" : m.progress < m.goal ? "\u0412 \u041F\u0420\u041E\u0426\u0415\u0421\u0421\u0415" : "\u0417\u0410\u0411\u0420\u0410\u0422\u042C") + "</button></div></article>").join("") + "</div>";
      root.querySelectorAll("[data-milestone]").forEach((b) => b.onclick = async () => {
        b.disabled = true;
        try {
          await api2("operations/claim", { id: "milestone:" + b.dataset.milestone });
          toast2("\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0435 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043E. \u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0430.");
          onUpdate();
        } catch (e) {
          b.disabled = false;
          toast2(e.message);
        }
      });
    } catch (e) {
      if (root.isConnected) {
        root.textContent = e.message;
        const retry = document.createElement("button");
        retry.className = "secondary";
        retry.textContent = "\u041F\u041E\u0412\u0422\u041E\u0420\u0418\u0422\u042C";
        retry.onclick = () => renderMilestones(root, api2, toast2, onUpdate);
        root.append(retry);
      }
    }
  }
  var rewardText;
  var init_campaign_ui = __esm({
    "campaign-ui.js"() {
      init_campaign();
      init_ui_icons();
      rewardText = (reward) => Object.entries(reward).map(([key2, n]) => ({ scrap: "\u0414\u0435\u0442\u0430\u043B\u0438", cloth: "\u0422\u043A\u0430\u043D\u044C", cores: "\u042F\u0434\u0440\u0430" })[key2] + " +" + n).join(" \xB7 ");
    }
  });

  // combat-tactics.js
  function repulseStatus(run2) {
    const seconds = Math.max(0, ((run2 == null ? void 0 : run2.repulseAt) || 0) - ((run2 == null ? void 0 : run2.time) || 0));
    return { seconds, ready: !!run2 && !run2.paused && !run2.ended && !run2.transition && seconds === 0 && run2.stamina >= REPULSE.cost };
  }
  function repel(run2) {
    if (!repulseStatus(run2).ready) return false;
    run2.stamina -= REPULSE.cost;
    run2.repulseAt = run2.time + REPULSE.cooldown;
    run2.repulses = (run2.repulses || 0) + 1;
    for (const enemy of run2.enemies) {
      if (enemy.hp <= 0) continue;
      let dx = enemy.x - run2.x, dy = enemy.y - run2.y, length = Math.hypot(dx, dy);
      if (length > REPULSE.radius) continue;
      if (length < 1e-3) {
        dx = run2.face || 1;
        dy = 0;
        length = 1;
      }
      const distance = enemy.type === "boss" ? REPULSE.distance * 0.3 : REPULSE.distance;
      enemy.x = Math.max(25, Math.min(935, enemy.x + dx / length * distance));
      enemy.y = Math.max(260, Math.min(540, enemy.y + dy / length * distance * 0.8));
      enemy.attack = null;
      enemy.cd = Math.max(enemy.cd, 0.8);
    }
    return true;
  }
  function battleReport(run2) {
    const seconds = Math.max(0, Math.floor(run2.time));
    return { duration: Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0"), kills: run2.kills, hits: run2.hits || 0, repulses: run2.repulses || 0, energy: run2.plan.cost };
  }
  var REPULSE;
  var init_combat_tactics = __esm({
    "combat-tactics.js"() {
      REPULSE = { cost: 35, cooldown: 9, radius: 115, distance: 90 };
    }
  });

  // operations.js
  function sortiePlan(save2, map, mode = "standard", time = Date.now()) {
    const option = SORTIE_MODES.find((x) => x.id === mode);
    if (!option || !MAPS[map] || playerLevel(save2) < option.level) throw Object.assign(new Error("\u0420\u0435\u0436\u0438\u043C \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D"), { status: 400 });
    const day = moscowDay(time), condition = CONDITIONS[map === 0 ? 0 : (day + map) % CONDITIONS.length];
    return { ...option, condition: { ...condition }, day };
  }
  function sortieEnemy(base, type, plan) {
    return { ...base, hp: base.hp * plan.hp * (type === "tank" && plan.condition.id === "iron" ? 1.25 : 1), speed: base.speed * plan.speed * (type === "runner" && plan.condition.id === "rush" ? 1.2 : 1) };
  }
  function sortieEnemyType(index, condition) {
    return index % 5 === 4 ? "tank" : index % (condition.id === "hunt" ? 2 : 3) === (condition.id === "hunt" ? 1 : 2) ? "runner" : "walker";
  }
  var SORTIE_MODES, CONDITIONS, moscowDay;
  var init_operations = __esm({
    "operations.js"() {
      init_balance();
      init_campaign();
      SORTIE_MODES = [
        { id: "scout", name: "\u0420\u0430\u0437\u0432\u0435\u0434\u043A\u0430", level: 1, cost: 6, hp: 0.8, speed: 0.9, reward: 0.65, xp: 0.75, description: "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u044B\u0439 \u0442\u0435\u043C\u043F. \u041C\u0435\u043D\u044C\u0448\u0435 \u043D\u0430\u0433\u0440\u0430\u0434\u0430, \u0434\u0435\u0448\u0435\u0432\u043B\u0435 \u0432\u044B\u0445\u043E\u0434." },
        { id: "standard", name: "\u0417\u0430\u0447\u0438\u0441\u0442\u043A\u0430", level: 1, cost: 8, hp: 1, speed: 1, reward: 1, xp: 1, description: "\u041E\u0431\u044B\u0447\u043D\u0430\u044F \u0443\u0433\u0440\u043E\u0437\u0430 \u0438 \u043D\u0430\u0433\u0440\u0430\u0434\u0430. \u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u043F\u0443\u0442\u044C \u043F\u043E \u0440\u0430\u0439\u043E\u043D\u0430\u043C." },
        { id: "siege", name: "\u041F\u0440\u043E\u0440\u044B\u0432", level: 5, cost: 12, hp: 1.4, speed: 1.12, reward: 1.65, xp: 1.4, description: "\u0416\u0438\u0432\u0443\u0447\u0438\u0435 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0435. \u0411\u043E\u043B\u044C\u0448\u0435 \u043D\u0430\u0433\u0440\u0430\u0434\u0430 \u0437\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u0443\u044E \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0443." }
      ];
      CONDITIONS = [
        { id: "quiet", name: "\u0422\u0438\u0445\u0438\u0435 \u0443\u043B\u0438\u0446\u044B", description: "\u041E\u0431\u044B\u0447\u043D\u0430\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0445." },
        { id: "rush", name: "\u0411\u0435\u0433\u0443\u0449\u0430\u044F \u0441\u0442\u0430\u044F", description: "\u0411\u0435\u0433\u0443\u043D\u044B \u0434\u0432\u0438\u0433\u0430\u044E\u0442\u0441\u044F \u043D\u0430 20% \u0431\u044B\u0441\u0442\u0440\u0435\u0435." },
        { id: "iron", name: "\u0422\u044F\u0436\u0451\u043B\u044B\u0439 \u0441\u043B\u0435\u0434", description: "\u0413\u0440\u043E\u043C\u0438\u043B\u044B \u043F\u043E\u043B\u0443\u0447\u0430\u044E\u0442 \u043D\u0430 25% \u0431\u043E\u043B\u044C\u0448\u0435 \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u044F." },
        { id: "hunt", name: "\u041E\u0445\u043E\u0442\u0430", description: "\u0412 \u0432\u043E\u043B\u043D\u0430\u0445 \u0447\u0430\u0449\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u044E\u0442\u0441\u044F \u0431\u0435\u0433\u0443\u043D\u044B." }
      ];
      moscowDay = (time = Date.now()) => Math.floor((time + 108e5) / 864e5);
    }
  });

  // operations-ui.js
  function renderBriefing(root, save2, map, mode) {
    const plan = sortiePlan(save2, map, mode), kills = 27 + map * 3, expected = expeditionReward(map, kills, kills * 2, true, stats(save2).loot * plan.reward);
    root.innerHTML = `<div class="op-heading"><span class="eyebrow">\u0423\u0421\u041B\u041E\u0412\u0418\u042F \u0412\u042B\u041B\u0410\u0417\u041A\u0418</span><strong>${plan.condition.name}</strong><p>${plan.condition.description} ${map === 0 ? "\u041F\u0435\u0440\u0432\u044B\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B \u0432\u0441\u0435\u0433\u0434\u0430 \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u044B\u0439." : "\u0423\u0441\u043B\u043E\u0432\u0438\u044F \u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F \u0432 \u043F\u043E\u043B\u043D\u043E\u0447\u044C \u041C\u0421\u041A."}</p></div><div class="op-forecast" aria-label="\u041E\u0436\u0438\u0434\u0430\u0435\u043C\u0430\u044F \u043D\u0430\u0433\u0440\u0430\u0434\u0430"><span><b>~${fmt2(expected)}</b> \u0434\u0435\u0442\u0430\u043B\u0435\u0439</span><span><b>${Math.round(runXP(kills, true, map, playerLevel(save2)) * plan.xp)}</b> XP</span><span><b>3</b> \u0432\u043E\u043B\u043D\u044B</span></div><p class="op-note">${plan.name}: ${plan.description} \u0414\u0435\u0442\u0430\u043B\u0438 \u0443\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E; \u0434\u043E\u0431\u044B\u0447\u0430 \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u0430.</p>`;
    return plan;
  }
  async function renderOperations(root, api2, toast2, onUpdate) {
    if (pending2.has(root)) return;
    pending2.add(root);
    try {
      const view = await api2("operations");
      if (!root.isConnected) return;
      root.innerHTML = `<div class="section-title"><h3>\u041F\u0440\u0438\u043A\u0430\u0437\u044B \u0443\u0431\u0435\u0436\u0438\u0449\u0430</h3><span>${view.open ? "\u0414\u041E \u041F\u041E\u041B\u0423\u041D\u041E\u0427\u0418 \u041C\u0421\u041A" : "\u0421 3 \u0423\u0420\u041E\u0412\u041D\u042F"}</span></div><div class="operation-contracts">${view.contracts.map((c) => `<article class="operation-contract ${c.claimed ? "complete" : ""}"><span class="contract-stamp">${shelterIcon(c.id === "support" ? "raids" : c.id === "route" ? "map" : "daily")}</span><div><span class="eyebrow">${c.claimed ? "\u0412\u042B\u041F\u041E\u041B\u041D\u0415\u041D\u041E" : "\u0415\u0416\u0415\u0414\u041D\u0415\u0412\u041D\u0410\u042F \u0426\u0415\u041B\u042C"}</span><h3>${c.title}</h3><p>${c.description}</p><div class="op-progress" role="progressbar" aria-label="${c.title}" aria-valuemin="0" aria-valuemax="${c.goal}" aria-valuenow="${c.progress}"><i style="width:${c.progress / c.goal * 100}%"></i></div><small>${c.progress} / ${c.goal} \xB7 ${rewardText2(c.reward)}</small></div><button class="${c.progress >= c.goal && !c.claimed && view.open ? "primary" : "secondary"}" data-contract="${c.id}" ${!view.open || c.claimed || c.progress < c.goal ? "disabled" : ""}>${c.claimed ? "\u041F\u041E\u041B\u0423\u0427\u0415\u041D\u041E" : !view.open ? "\u0421 3 \u0423\u0420\u041E\u0412\u041D\u042F" : c.progress < c.goal ? "\u0412 \u041F\u0420\u041E\u0426\u0415\u0421\u0421\u0415" : "\u0417\u0410\u0411\u0420\u0410\u0422\u042C"}</button></article>`).join("")}</div>`;
      root.querySelectorAll("[data-contract]").forEach((b) => b.onclick = async () => {
        b.disabled = true;
        try {
          await api2("operations/claim", { id: b.dataset.contract });
          toast2("\u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0430");
          onUpdate();
        } catch (e) {
          b.disabled = false;
          toast2(e.message);
        }
      });
    } catch (e) {
      if (root.isConnected) {
        root.textContent = "\u041F\u0440\u0438\u043A\u0430\u0437\u044B \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B: " + e.message;
        const b = document.createElement("button");
        b.className = "secondary";
        b.textContent = "\u041F\u041E\u0412\u0422\u041E\u0420\u0418\u0422\u042C";
        b.onclick = () => renderOperations(root, api2, toast2, onUpdate);
        root.append(b);
      }
    } finally {
      pending2.delete(root);
    }
  }
  var fmt2, rewardText2, pending2;
  var init_operations_ui = __esm({
    "operations-ui.js"() {
      init_operations();
      init_balance();
      init_ui_icons();
      fmt2 = (n) => Math.round(n).toLocaleString("ru-RU");
      rewardText2 = (r) => Object.entries(r).map(([key2, n]) => "+" + n + " " + { scrap: "\u0434\u0435\u0442.", xp: "XP", cloth: "\u0442\u043A\u0430\u043D\u0438", cores: "\u044F\u0434\u0440\u043E" }[key2]).join(" \xB7 ");
      pending2 = /* @__PURE__ */ new WeakSet();
    }
  });

  // landscape-ui.js
  function initLandscape() {
    const header = document.querySelector("header"), aside = document.querySelector("aside"), main = document.querySelector("main"), resources = document.querySelector(".resources");
    const marker = document.createComment("resource-position");
    resources.before(marker);
    const toggle = document.createElement("button");
    toggle.id = "landscape-menu";
    toggle.className = "secondary";
    toggle.innerHTML = icon("menu");
    toggle.setAttribute("aria-label", "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043C\u0435\u043D\u044E");
    toggle.setAttribute("aria-expanded", "false");
    aside.id = "game-navigation";
    toggle.setAttribute("aria-controls", aside.id);
    const title = document.createElement("span");
    title.className = "landscape-current";
    const shade = document.createElement("button");
    shade.className = "landscape-shade";
    shade.setAttribute("aria-label", "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043C\u0435\u043D\u044E");
    shade.tabIndex = -1;
    header.prepend(toggle, title);
    document.body.append(shade);
    const media = matchMedia(query);
    let open = false;
    const change = (value) => {
      var _a2;
      open = value && media.matches;
      document.body.classList.toggle("landscape-menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043C\u0435\u043D\u044E" : "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043C\u0435\u043D\u044E");
      toggle.innerHTML = icon(open ? "close" : "menu");
      aside.inert = media.matches && !open;
      main.inert = open;
      if (open) (_a2 = aside.querySelector("nav button.active")) == null ? void 0 : _a2.focus();
    };
    toggle.onclick = () => change(!open);
    shade.onclick = () => {
      change(false);
      toggle.focus();
    };
    aside.addEventListener("click", (e) => {
      if (e.target.closest("nav button") && media.matches) {
        change(false);
        main.scrollTop = 0;
        toggle.focus();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        change(false);
        toggle.focus();
      }
      if (e.key === "Tab") {
        const items = [toggle, ...aside.querySelectorAll("nav button:not(:disabled)")], i = items.indexOf(document.activeElement), next = e.shiftKey ? i <= 0 ? items.length - 1 : i - 1 : (i + 1) % items.length;
        e.preventDefault();
        items[next].focus();
      }
    });
    const syncTitle = () => {
      var _a2;
      title.textContent = (((_a2 = aside.querySelector("nav button.active")) == null ? void 0 : _a2.textContent) || "\u0423\u0431\u0435\u0436\u0438\u0449\u0435").replace(/\s*\d+\s*$/, "").trim();
    };
    new MutationObserver(syncTitle).observe(document.querySelector("#page-title"), { childList: true, subtree: true, characterData: true });
    const resize = () => {
      change(false);
      if (media.matches) header.append(resources);
      else marker.after(resources);
      syncTitle();
    };
    media.addEventListener("change", resize);
    resize();
  }
  var query;
  var init_landscape_ui = __esm({
    "landscape-ui.js"() {
      init_ui_icons();
      query = "(orientation: landscape) and (max-height: 550px)";
    }
  });

  // garage-ui.js
  function garageUI(root, save2, level, upgrades, buy, rerender) {
    var _a2;
    const workshopOpen = (_a2 = root.querySelector(".garage-workshop")) == null ? void 0 : _a2.open;
    const current = vehicleFor(save2), owned = save2.ownedVehicles || ["nomad"];
    const options = [["all", "\u0412\u0441\u0435 \xB7 20"], ["scrap", "\u0417\u0430 \u0434\u0435\u0442\u0430\u043B\u0438 \xB7 13"], ["votes", "\u0417\u0430 \u0433\u043E\u043B\u043E\u0441\u0430 \xB7 6"], ["owned", "\u041C\u043E\u0438 \xB7 " + owned.length]];
    const list = VEHICLES.filter((v) => filter === "all" || filter === "scrap" && v.cost > 0 || filter === "votes" && v.votes || filter === "owned" && owned.includes(v.id));
    root.innerHTML = `<div class="garage-showroom"><div class="garage-platform">${art(current)}<span class="garage-stamp">\u041C\u041E\u0411\u0418\u041B\u042C\u041D\u0410\u042F \u0411\u0410\u0417\u0410 / ${String(current.art + 1).padStart(2, "0")}</span></div><div class="garage-summary"><span class="eyebrow orange">\u0410\u041A\u0422\u0418\u0412\u041D\u042B\u0419 \u0410\u0412\u0422\u041E\u041C\u041E\u0411\u0418\u041B\u042C</span><h2>\xAB${current.name}\xBB</h2><p>${current.description}</p><div class="vehicle-bonuses">${bonus(current)}</div><small>\u0411\u043E\u043D\u0443\u0441\u044B \u043A\u0443\u0437\u043E\u0432\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044E\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0443 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0439 \u043C\u0430\u0448\u0438\u043D\u044B. \u0423\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u044F \u043C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u043E\u0439 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u043F\u0440\u0438 \u0441\u043C\u0435\u043D\u0435 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044F.</small></div></div><details class="garage-workshop" ${workshopOpen ? "open" : ""}><summary>\u041C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u0430\u044F <small>\u0413\u0435\u043D\u0435\u0440\u0430\u0442\u043E\u0440 ${save2.engine} \xB7 \u043A\u043E\u0440\u043F\u0443\u0441 ${save2.body} \xB7 \u043E\u0442\u0441\u0435\u043A ${save2.trunk}</small></summary><div class="item-grid">${upgrades}</div></details><div class="section-title"><h3>\u0410\u0432\u0442\u043E\u043F\u0430\u0440\u043A \u0443\u0431\u0435\u0436\u0438\u0449\u0430</h3><span>${owned.length} / 20 \u0412 \u041A\u041E\u041B\u041B\u0415\u041A\u0426\u0418\u0418</span></div><div class="vehicle-filters" role="group" aria-label="\u0424\u0438\u043B\u044C\u0442\u0440 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u0435\u0439">${options.map(([id, label2]) => `<button class="secondary ${filter === id ? "selected" : ""}" data-vehicle-filter="${id}" aria-pressed="${filter === id}">${label2}</button>`).join("")}</div><p class="garage-tip">\u041F\u043E\u043A\u0443\u043F\u043A\u0430 \u0437\u0430 \u0434\u0435\u0442\u0430\u043B\u0438 \u043D\u0430\u0432\u0441\u0435\u0433\u0434\u0430. \u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u043A\u0443\u0437\u043E\u0432\u0430 \u0437\u0430 \u0433\u043E\u043B\u043E\u0441\u0430 \u0438\u043C\u0435\u044E\u0442 \u0445\u0430\u0440\u0430\u043A\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043A\u0438 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0445 \u0430\u043D\u0430\u043B\u043E\u0433\u043E\u0432 \u0438 \u0442\u0435 \u0436\u0435 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F \u043A \u0443\u0440\u043E\u0432\u043D\u044E. \u041E\u043F\u043B\u0430\u0442\u0430 \u0433\u043E\u043B\u043E\u0441\u0430\u043C\u0438 \u043F\u043E\u043A\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u2014 \u0443\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u043C\u044B\u0435 \u0446\u0435\u043D\u044B.</p><div class="vehicle-grid">${list.map((v) => {
      const have = owned.includes(v.id), active = current.id === v.id, locked = level < v.level, disabled = active || locked || !have && (!!v.votes || save2.scrap < v.cost);
      const label2 = active ? "\u0412\u044B\u0431\u0440\u0430\u043D" : have ? "\u0412\u044B\u0431\u0440\u0430\u0442\u044C" : v.votes ? "\u0421\u043A\u043E\u0440\u043E" : "\u041A\u0443\u043F\u0438\u0442\u044C";
      const reason = active ? "\u0411\u043E\u043D\u0443\u0441\u044B \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044E\u0442" : locked ? "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u0443\u0440\u043E\u0432\u043D\u0435 " + v.level : have ? "\u0421\u043C\u0435\u043D\u0430 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u0430" : v.votes ? "\u041E\u043F\u043B\u0430\u0442\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430" : save2.scrap < v.cost ? "\u041D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 " + (v.cost - save2.scrap).toLocaleString("ru-RU") + " \u0434\u0435\u0442\u0430\u043B\u0435\u0439" : "\u041E\u0441\u0442\u0430\u043D\u0435\u0442\u0441\u044F " + (save2.scrap - v.cost).toLocaleString("ru-RU") + " \u0434\u0435\u0442\u0430\u043B\u0435\u0439";
      return `<article class="vehicle-card ${active ? "equipped" : ""} ${v.votes ? "collectible" : ""}"><div class="vehicle-picture">${art(v)}<span class="vehicle-number">${String(v.art + 1).padStart(2, "0")}</span><span class="vehicle-tag">${v.votes ? "\u041A\u041E\u041B\u041B\u0415\u041A\u0426\u0418\u041E\u041D\u041D\u042B\u0419" : have ? "\u0412 \u0413\u0410\u0420\u0410\u0416\u0415" : "\u0417\u0410 \u0414\u0415\u0422\u0410\u041B\u0418"}</span></div><div class="vehicle-info"><small>${v.type} \xB7 \u0423\u0420. ${v.level}</small><h3>${v.name}</h3><p>${v.description}</p><div class="vehicle-bonuses">${bonus(v)}</div><div class="vehicle-price">${v.votes ? v.votes + " \u0433\u043E\u043B\u043E\u0441\u043E\u0432" : v.cost ? v.cost.toLocaleString("ru-RU") + " \u0434\u0435\u0442\u0430\u043B\u0435\u0439" : "\u0421\u0442\u0430\u0440\u0442\u043E\u0432\u044B\u0439 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044C"}</div><small class="vehicle-requirement">${reason}</small><button class="${active ? "secondary" : "primary"}" data-vehicle="${v.id}" ${disabled ? "disabled" : ""}>${label2}</button></div></article>`;
    }).join("")}</div>`;
    root.querySelectorAll("[data-vehicle-filter]").forEach((b) => b.onclick = () => {
      filter = b.dataset.vehicleFilter;
      rerender();
      root.querySelector('[data-vehicle-filter="' + filter + '"]').focus();
    });
    root.querySelectorAll("[data-vehicle]").forEach((b) => b.onclick = () => buy(b.dataset.vehicle));
  }
  var filter, art, bonus;
  var init_garage_ui = __esm({
    "garage-ui.js"() {
      init_vehicles();
      filter = "all";
      art = (v) => `<div class="vehicle-art" role="img" aria-label="${v.type} ${v.name}" style="--vx:${v.art % 4 * 100 / 3}%;--vy:${Math.floor(v.art / 4) * 25}%"></div>`;
      bonus = (v) => `<span>+${v.damage}% \u0443\u0440\u043E\u043D</span><span>+${v.hp}% \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u0435</span><span>+${v.loot}% \u0434\u0435\u0442\u0430\u043B\u0438</span>`;
    }
  });

  // gear-model.js
  function gearPreview(save2, kind, index) {
    const weapons = kind === "weapons", item2 = (weapons ? WEAPONS : ARMOR)[index];
    if (!item2) throw new RangeError("Unknown equipment");
    const active = index === (weapons ? save2.weapon : save2.armorTier || 0);
    const owned = (weapons ? save2.owned : save2.ownedArmor || [0]).includes(index);
    const open = weapons ? weaponUnlocked(save2, index) : armorUnlocked(save2, index);
    const current = stats(save2), next = stats({ ...save2, [weapons ? "weapon" : "armorTier"]: index });
    const currentWeapon = WEAPONS[save2.weapon];
    const missing = owned ? [] : [["scrap", item2.cost, "\u0434\u0435\u0442\u0430\u043B\u0435\u0439"], ["cloth", weapons ? 0 : item2.cloth, "\u0442\u043A\u0430\u043D\u0438"], ["cores", weapons ? 0 : item2.cores, "\u044F\u0434\u0435\u0440"]].filter(([key2, cost]) => (save2[key2] || 0) < cost).map(([key2, cost, label2]) => ({ key: key2, amount: cost - (save2[key2] || 0), label: label2 }));
    const levelReason = "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u0443\u0440\u043E\u0432\u043D\u0435 " + (item2.level || 1) + (!weapons && item2.bosses ? " \u0438\u043B\u0438 \u043F\u043E\u0441\u043B\u0435 " + item2.bosses + " \u043F\u043E\u0431\u0435\u0434 \u043D\u0430\u0434 \u0431\u043E\u0441\u0441\u0430\u043C\u0438" : "");
    const reason = active ? "\u0423\u0436\u0435 \u043D\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435" : !owned && item2.votes ? "\u041F\u043E\u043A\u0443\u043F\u043A\u0430 \u0437\u0430 \u0433\u043E\u043B\u043E\u0441\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430" : !open && (weapons || !owned) ? levelReason : missing.length ? "\u041D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442: " + missing.map((m) => m.amount + " " + resourceName(m.key, m.amount)).join(", ") : owned ? "\u041C\u043E\u0436\u043D\u043E \u0441\u043C\u0435\u043D\u0438\u0442\u044C \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E" : "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u0440\u0430\u0437\u0443 \u044D\u043A\u0438\u043F\u0438\u0440\u0443\u0435\u0442 \u043F\u0440\u0435\u0434\u043C\u0435\u0442";
    return {
      item: item2,
      index,
      owned,
      active,
      open,
      missing,
      reason,
      enabled: !active && (owned || !item2.votes) && (!weapons && owned || open) && !missing.length,
      damage: next.damage,
      dps: weapons ? next.damage * (item2.pellets || 1) / item2.rate : 0,
      dpsDelta: weapons ? next.damage * (item2.pellets || 1) / item2.rate - current.damage * (currentWeapon.pellets || 1) / currentWeapon.rate : 0,
      rangeDelta: weapons ? item2.range - currentWeapon.range : 0,
      hp: next.hp,
      hpDelta: next.hp - current.hp
    };
  }
  var resourceName;
  var init_gear_model = __esm({
    "gear-model.js"() {
      init_balance();
      resourceName = (key2, n) => {
        if (key2 === "cloth") return "\u0442\u043A\u0430\u043D\u0438";
        const mod10 = n % 10, mod100 = n % 100, form = mod100 >= 11 && mod100 <= 14 ? 2 : mod10 === 1 ? 0 : mod10 >= 2 && mod10 <= 4 ? 1 : 2;
        return (key2 === "scrap" ? ["\u0434\u0435\u0442\u0430\u043B\u044C", "\u0434\u0435\u0442\u0430\u043B\u0438", "\u0434\u0435\u0442\u0430\u043B\u0435\u0439"] : ["\u044F\u0434\u0440\u043E", "\u044F\u0434\u0440\u0430", "\u044F\u0434\u0435\u0440"])[form];
      };
    }
  });

  // gear-catalogue.js
  function mountGearCatalogue(root, save2, kind, { drawWeapon: drawWeapon2, drawItem: drawItem2, equip }) {
    const models = kind === "weapons" ? WEAPONS : ARMOR;
    if (selection[kind] === null) selection[kind] = kind === "weapons" ? save2.weapon : save2.armorTier || 0;
    const draw2 = (node) => {
      node.querySelectorAll("[data-catalogue-weapon]").forEach((c) => drawWeapon2(c, +c.dataset.catalogueWeapon));
      node.querySelectorAll("[data-catalogue-item]").forEach((c) => drawItem2(c, +c.dataset.catalogueItem));
    };
    const renderDetail = () => {
      const p = gearPreview(save2, kind, selection[kind]), w = p.item;
      const recipe = p.owned ? "\u041F\u0440\u0435\u0434\u043C\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D" : w.votes ? w.votes + " \u0433\u043E\u043B\u043E\u0441\u043E\u0432 \xB7 \u043F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u043C\u0430\u044F \u0446\u0435\u043D\u0430" : fmt3(w.cost) + " \u0434\u0435\u0442\u0430\u043B\u0435\u0439" + (kind === "armor" ? " \xB7 " + w.cloth + " \u0442\u043A\u0430\u043D\u0438" + (w.cores ? " \xB7 " + w.cores + " \u044F\u0434\u0435\u0440" : "") : "");
      const statRows = kind === "weapons" ? "<div><dt>\u0423\u0440\u043E\u043D / \u0432\u044B\u0441\u0442\u0440\u0435\u043B</dt><dd>" + fmt3(p.damage) + (w.pellets ? " \xD7 " + w.pellets : "") + "</dd></div><div><dt>\u0423\u0440\u043E\u043D / \u0441\u0435\u043A.</dt><dd>" + fmt3(p.dps) + delta(p.dpsDelta) + "</dd></div><div><dt>\u0414\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C</dt><dd>" + w.range + delta(p.rangeDelta) + "</dd></div><div><dt>\u0418\u043D\u0442\u0435\u0440\u0432\u0430\u043B \u043E\u0433\u043D\u044F</dt><dd>" + w.rate + " \u0441</dd></div>" : "<div><dt>\u0417\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u0433\u0435\u0440\u043E\u044F</dt><dd>" + fmt3(p.hp) + " HP" + delta(p.hpDelta) + "</dd></div><div><dt>\u0417\u0430\u0449\u0438\u0442\u0430 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0430</dt><dd>+" + w.hp + " HP</dd></div>";
      const detail = root.querySelector(".catalogue-detail");
      detail.innerHTML = '<div class="catalogue-detail-head">' + art2(kind, p.index, w) + "<div><small>" + state(p) + "</small><h3>" + w.name + '</h3></div></div><div class="catalogue-detail-body"><p>' + w.description + '</p><dl class="catalogue-stats">' + statRows + '</dl><small class="catalogue-compare">\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u043D\u0430\u0434\u0435\u0442\u043E\u0433\u043E \u0441\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u044F. \u0411\u043E\u043D\u0443\u0441\u044B \u043C\u0430\u0448\u0438\u043D\u044B \u0438 \u043C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u043E\u0439 \u0443\u0447\u0442\u0435\u043D\u044B.' + (w.pellets ? " \u0423\u0440\u043E\u043D \u0432 \u0441\u0435\u043A\u0443\u043D\u0434\u0443 \u2014 \u043F\u0440\u0438 \u043F\u043E\u043F\u0430\u0434\u0430\u043D\u0438\u0438 \u0432\u0441\u0435\u0445 \u0434\u0440\u043E\u0431\u0438\u043D." : "") + "</small>" + (!p.owned ? '<p class="catalogue-unlock">\u0423\u0440\u043E\u0432\u0435\u043D\u044C ' + (w.level || 1) + (kind === "armor" && w.bosses ? " \u0438\u043B\u0438 " + w.bosses + " \u043F\u043E\u0431\u0435\u0434 \u043D\u0430\u0434 \u0431\u043E\u0441\u0441\u0430\u043C\u0438" : "") + "</p>" : "") + '</div><div class="catalogue-action"><div><strong>' + recipe + "</strong><small>" + p.reason + '</small></div><button class="' + (p.active ? "secondary" : "primary") + '" data-catalogue-equip ' + (!p.enabled ? "disabled" : "") + ">" + (p.active ? "\u041D\u0430\u0434\u0435\u0442\u043E" : p.owned ? "\u042D\u043A\u0438\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C" : w.votes ? "\u0421\u043A\u043E\u0440\u043E" : "\u0421\u043E\u0437\u0434\u0430\u0442\u044C") + "</button></div>";
      detail.querySelector("[data-catalogue-equip]").onclick = () => equip(p.index);
      root.querySelectorAll("[data-catalogue-select]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.catalogueSelect === p.index)));
      draw2(detail);
    };
    const render = () => {
      const list = models.map((w, i) => gearPreview(save2, kind, i)).filter((p) => filters[kind] === "all" || p.owned);
      if (!list.some((p) => p.index === selection[kind])) selection[kind] = list[0].index;
      root.innerHTML = '<div class="gear-catalogue"><div class="catalogue-master"><div class="catalogue-tools"><span>' + models.length + " " + (kind === "weapons" ? "\u043C\u043E\u0434\u0435\u043B\u0435\u0439" : "\u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u043E\u0432") + '</span><div role="group" aria-label="\u0424\u0438\u043B\u044C\u0442\u0440 \u0441\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u044F">' + [["all", "\u0412\u0441\u0435"], ["owned", "\u041C\u043E\u0438"]].map(([id, label2]) => '<button data-catalogue-filter="' + id + '" aria-pressed="' + (filters[kind] === id) + '">' + label2 + "</button>").join("") + '</div></div><div class="catalogue-list" role="group" aria-label="' + (kind === "weapons" ? "\u041C\u043E\u0434\u0435\u043B\u0438 \u043E\u0440\u0443\u0436\u0438\u044F" : "\u041A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u044B \u0431\u0440\u043E\u043D\u0438") + '">' + list.map((p) => '<button class="catalogue-row" data-catalogue-select="' + p.index + '" aria-pressed="' + (selection[kind] === p.index) + '">' + art2(kind, p.index, p.item) + '<span class="catalogue-row-copy"><b>' + p.item.name + "</b><small>" + state(p) + " \xB7 " + (kind === "weapons" ? fmt3(p.dps) + " \u0443\u0440\u043E\u043D/\u0441" : fmt3(p.hp) + " HP \u0433\u0435\u0440\u043E\u044F") + '</small></span><span class="catalogue-row-arrow" aria-hidden="true">\u203A</span></button>').join("") + '</div></div><section class="catalogue-detail" aria-label="\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0435 \u0441\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u0435"></section></div>';
      root.querySelectorAll("[data-catalogue-filter]").forEach((b) => b.onclick = () => {
        filters[kind] = b.dataset.catalogueFilter;
        scrollPositions[kind] = 0;
        render();
        root.querySelector('[data-catalogue-filter="' + filters[kind] + '"]').focus({ preventScroll: true });
      });
      const listNode = root.querySelector(".catalogue-list");
      listNode.scrollTop = scrollPositions[kind];
      listNode.onscroll = () => scrollPositions[kind] = listNode.scrollTop;
      root.querySelectorAll("[data-catalogue-select]").forEach((b) => b.onclick = () => {
        selection[kind] = +b.dataset.catalogueSelect;
        renderDetail();
      });
      root.querySelector(".catalogue-list").onkeydown = (e) => {
        const buttons = [...root.querySelectorAll("[data-catalogue-select]")], i = buttons.indexOf(e.target);
        if (i < 0) return;
        let next;
        if (e.key === "ArrowDown") next = (i + 1) % buttons.length;
        else if (e.key === "ArrowUp") next = (i + buttons.length - 1) % buttons.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = buttons.length - 1;
        else return;
        e.preventDefault();
        buttons[next].click();
        buttons[next].focus({ preventScroll: true });
        const row = buttons[next], top = row.offsetTop - listNode.offsetTop;
        if (top < listNode.scrollTop) listNode.scrollTop = top;
        else if (top + row.offsetHeight > listNode.scrollTop + listNode.clientHeight) listNode.scrollTop = top + row.offsetHeight - listNode.clientHeight;
      };
      draw2(root);
      renderDetail();
    };
    render();
    return () => {
      const listNode = root.querySelector(".catalogue-list");
      listNode.scrollTop = scrollPositions[kind];
    };
  }
  var selection, filters, scrollPositions, fmt3, delta, art2, state;
  var init_gear_catalogue = __esm({
    "gear-catalogue.js"() {
      init_balance();
      init_gear_model();
      selection = { weapons: null, armor: null };
      filters = { weapons: "all", armor: "all" };
      scrollPositions = { weapons: 0, armor: 0 };
      fmt3 = (n) => Math.round(n).toLocaleString("ru-RU");
      delta = (n) => Math.round(n) === 0 ? "" : '<em class="' + (n > 0 ? "gain" : n < 0 ? "loss" : "neutral") + '">' + (Math.round(n) > 0 ? "+" : "") + fmt3(n) + "</em>";
      art2 = (kind, i, item2) => kind === "weapons" ? '<canvas data-catalogue-weapon="' + i + '" width="240" height="240" aria-hidden="true"></canvas>' : '<canvas data-catalogue-item="' + item2.icon + '" width="180" height="180" aria-hidden="true"></canvas>';
      state = (p) => p.active ? "\u041D\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435" : p.owned ? "\u0412 \u0438\u043D\u0432\u0435\u043D\u0442\u0430\u0440\u0435" : p.item.votes ? "\u0417\u0430 \u0433\u043E\u043B\u043E\u0441\u0430" : p.open ? "\u0427\u0435\u0440\u0442\u0451\u0436 \u043E\u0442\u043A\u0440\u044B\u0442" : "\u0423\u0440. " + p.item.level;
    }
  });

  // onboarding.js
  function onboarding(navigate2, force = false) {
    if (document.querySelector("#onboarding")) return;
    let saved = 0;
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "0");
      if (value === "done" && !force) return;
      if (!force && Number.isInteger(value)) saved = Math.max(0, Math.min(3, value));
    } catch (e) {
    }
    let step = force ? 0 : saved;
    const previous = document.activeElement;
    const modal = document.createElement("dialog");
    modal.id = "onboarding";
    modal.setAttribute("aria-labelledby", "tutorial-title");
    document.body.append(modal);
    const remember = (value) => {
      try {
        localStorage.setItem(KEY, JSON.stringify(value));
      } catch (e) {
      }
    };
    const close = () => {
      var _a2;
      remember("done");
      modal.close();
      modal.remove();
      navigate2("map");
      (_a2 = previous == null ? void 0 : previous.focus) == null ? void 0 : _a2.call(previous);
    };
    function draw2() {
      const [title, text, page2, button] = steps[step];
      navigate2(page2);
      remember(step);
      modal.innerHTML = `<span class="eyebrow orange">\u041F\u0415\u0420\u0412\u042B\u0419 \u0412\u042B\u0425\u041E\u0414 \xB7 ${step + 1} / ${steps.length}</span><h2 id="tutorial-title">${title}</h2><p>${text}</p><div class="tutorial-dots" aria-hidden="true">${steps.map((_, i) => '<i class="' + (i === step ? "active" : "") + '"></i>').join("")}</div><div class="tutorial-actions"><button class="secondary" id="tutorial-skip">\u041F\u041E\u0417\u0416\u0415</button>${step ? '<button class="secondary" id="tutorial-back">\u041D\u0410\u0417\u0410\u0414</button>' : ""}<button class="primary" id="tutorial-next">${button}</button></div><small>\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u0435 \u043C\u043E\u0436\u043D\u043E \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445. \u042D\u043D\u0435\u0440\u0433\u0438\u044F \u0441\u0435\u0439\u0447\u0430\u0441 \u043D\u0435 \u0442\u0440\u0430\u0442\u0438\u0442\u0441\u044F.</small>`;
      modal.querySelector("#tutorial-skip").onclick = close;
      const back = modal.querySelector("#tutorial-back");
      if (back) back.onclick = () => {
        step--;
        draw2();
      };
      modal.querySelector("#tutorial-next").onclick = () => {
        if (step === steps.length - 1) close();
        else {
          step++;
          draw2();
        }
      };
      modal.querySelector("#tutorial-next").focus();
    }
    modal.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });
    draw2();
    modal.showModal();
    modal.querySelector("#tutorial-next").focus();
  }
  var KEY, steps;
  var init_onboarding = __esm({
    "onboarding.js"() {
      KEY = "obitel-onboarding-v1";
      steps = [
        ["\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C \u0432 \u0443\u0431\u0435\u0436\u0438\u0449\u0435", "\u0422\u0432\u043E\u044F \u0446\u0435\u043B\u044C \u2014 \u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0433\u043E\u0440\u043E\u0434 \u0432\u044B\u0436\u0438\u0432\u0448\u0438\u043C. \u041D\u0430\u0447\u043D\u0438 \u0441 \u0422\u0438\u0445\u043E\u0433\u043E \u043A\u0432\u0430\u0440\u0442\u0430\u043B\u0430, \u0441\u043E\u0431\u0438\u0440\u0430\u0439 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u044B \u0438 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0439 \u043D\u043E\u0432\u044B\u0435 \u0440\u0430\u0439\u043E\u043D\u044B. \u041F\u043E\u0437\u0436\u0435 \u0432\u0441\u0442\u0443\u043F\u0438 \u0432 \u043A\u043B\u0430\u043D \u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438 \u043F\u043E\u0434\u0437\u0435\u043C\u043D\u044B\u0439 \u0440\u0435\u0430\u043A\u0442\u043E\u0440.", "map", "\u041E\u0421\u041C\u041E\u0422\u0420\u0415\u0422\u042C \u0423\u041F\u0420\u0410\u0412\u041B\u0415\u041D\u0418\u0415"],
        ["\u0414\u0432\u0438\u0433\u0430\u0439\u0441\u044F. \u041E\u0433\u043E\u043D\u044C \u2014 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439.", "\u0422\u0435\u043B\u0435\u0444\u043E\u043D: \u0434\u0436\u043E\u0439\u0441\u0442\u0438\u043A, \u0431\u0435\u0433 \u0438 \u043E\u0442\u043F\u043E\u0440. \u041A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440: WASD \u0438\u043B\u0438 \u0441\u0442\u0440\u0435\u043B\u043A\u0438, Shift \u2014 \u0431\u0435\u0433, Q \u2014 \u043E\u0442\u043F\u043E\u0440. \u041E\u0442\u043F\u043E\u0440 \u0442\u0440\u0430\u0442\u0438\u0442 35 \u0432\u044B\u043D\u043E\u0441\u043B\u0438\u0432\u043E\u0441\u0442\u0438 \u0438 \u043F\u0440\u0435\u0440\u044B\u0432\u0430\u0435\u0442 \u0443\u0434\u0430\u0440 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0445 \u0437\u043E\u043C\u0431\u0438; \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0437\u0430 9 \u0441\u0435\u043A\u0443\u043D\u0434. \u0420\u0430\u0437\u043C\u0435\u0440 \u043A\u043D\u043E\u043F\u043E\u043A \u0438 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u043B\u0435\u0432\u0448\u0435\u0439 \u2014 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445.", "map", "\u041A\u0410\u041A \u041E\u0422\u041A\u0420\u042B\u0422\u042C \u0411\u041E\u0421\u0421\u0410"],
        ["\u0422\u0440\u0438 \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0438 \u0434\u043E \u0431\u043E\u0441\u0441\u0430", "\u0420\u0430\u0437\u0432\u0435\u0434\u043A\u0430 \u0441\u0442\u043E\u0438\u0442 6 \u044D\u043D\u0435\u0440\u0433\u0438\u0438, \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0430 \u2014 8, \u043F\u0440\u043E\u0440\u044B\u0432 \u0441 5 \u0443\u0440\u043E\u0432\u043D\u044F \u2014 12. \u0412 \u043A\u0430\u0436\u0434\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435 \u0442\u0440\u0438 \u0432\u043E\u043B\u043D\u044B. \u041F\u043E\u0441\u043B\u0435 \u0442\u0440\u0451\u0445 \u043F\u043E\u0431\u0435\u0434\u043D\u044B\u0445 \u0432\u044B\u043B\u0430\u0437\u043E\u043A \u0438 \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F \u0443\u0440\u043E\u0432\u043D\u044F \u0440\u0430\u0439\u043E\u043D\u0430 \u043E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u0431\u043E\u0441\u0441. \u041F\u043E\u0431\u0435\u0434\u0438 \u0435\u0433\u043E, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0439\u0442\u0438 \u0434\u0430\u043B\u044C\u0448\u0435. \u042D\u043D\u0435\u0440\u0433\u0438\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0441\u0430\u043C\u0430.", "map", "\u041A\u0410\u041A \u0421\u0422\u0410\u0422\u042C \u0421\u0418\u041B\u042C\u041D\u0415\u0415"],
        ["\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C\u0441\u044F \u0438 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0439\u0441\u044F", "\u0412 \xAB\u0421\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u0438\xBB \u043F\u043E\u043A\u0443\u043F\u0430\u0439 \u0438 \u044D\u043A\u0438\u043F\u0438\u0440\u0443\u0439 \u043E\u0440\u0443\u0436\u0438\u0435 \u0438 \u0431\u0440\u043E\u043D\u044E, \u0432 \xAB\u0413\u0430\u0440\u0430\u0436\u0435\xBB \u0443\u043B\u0443\u0447\u0448\u0430\u0439 \u043C\u0430\u0448\u0438\u043D\u0443. \u0414\u0440\u0443\u0437\u044C\u044F \u0430\u0442\u0430\u043A\u0443\u044E\u0442 \u0440\u0435\u0439\u0434\u043E\u0432\u043E\u0433\u043E \u0431\u043E\u0441\u0441\u0430 \u0432 \u0441\u0432\u043E\u0451 \u0432\u0440\u0435\u043C\u044F, \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u043E\u0431\u0449\u0435\u0435. \u041A\u043E\u043D\u0442\u0440\u0430\u043A\u0442\u044B \u0434\u0430\u044E\u0442 \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u0443\u044E \u0446\u0435\u043B\u044C. \u0420\u0435\u043A\u043B\u0430\u043C\u0430 \u0437\u0430 \u044D\u043D\u0435\u0440\u0433\u0438\u044E \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E \u0436\u0435\u043B\u0430\u043D\u0438\u044E.", "gear", "\u041A \u041F\u0415\u0420\u0412\u041E\u0419 \u0412\u042B\u041B\u0410\u0417\u041A\u0415"]
      ];
    }
  });

  // ads-ui.js
  function adCard() {
    return '<section class="settings-card ad-card"><span class="eyebrow orange">\u0420\u0415\u041A\u041B\u0410\u041C\u0410 \xB7 \u0414\u041E\u0411\u0420\u041E\u0412\u041E\u041B\u042C\u041D\u041E</span><h3>\u0417\u0430\u043F\u0430\u0441 \u0434\u043B\u044F \u0432\u044B\u043B\u0430\u0437\u043A\u0438</h3><p>\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0438 \u0432\u0438\u0434\u0435\u043E VK \u0438 \u043F\u043E\u043B\u0443\u0447\u0438 <b>8 \u044D\u043D\u0435\u0440\u0433\u0438\u0438</b>. \u0414\u043E 3 \u043D\u0430\u0433\u0440\u0430\u0434 \u0432 \u0441\u0443\u0442\u043A\u0438, \u043F\u0435\u0440\u0435\u0440\u044B\u0432 5 \u043C\u0438\u043D\u0443\u0442. \u0414\u043B\u044F \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043D\u0443\u0436\u043D\u044B 8 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u0445 \u0435\u0434\u0438\u043D\u0438\u0446 \u044D\u043D\u0435\u0440\u0433\u0438\u0438.</p><button id="reward-ad" class="primary" ' + (!inVK || watching ? "disabled" : "") + ">" + (claimTicket ? "\u041F\u041E\u041B\u0423\u0427\u0418\u0422\u042C \u041D\u0410\u0413\u0420\u0410\u0414\u0423" : watching ? "\u041E\u0416\u0418\u0414\u0410\u041D\u0418\u0415 VK\u2026" : "\u0421\u041C\u041E\u0422\u0420\u0415\u0422\u042C \u0420\u0415\u041A\u041B\u0410\u041C\u0423 \xB7 +8 \u042D\u041D\u0415\u0420\u0413\u0418\u0418") + '</button><p id="ad-status" role="status">' + (inVK ? "\u0412\u0438\u0434\u0435\u043E \u0432\u044B\u0431\u0438\u0440\u0430\u0435\u0442 VK. \u041F\u0440\u0438 \u043E\u0442\u043C\u0435\u043D\u0435 \u043D\u0430\u0433\u0440\u0430\u0434\u0430 \u043D\u0435 \u043D\u0430\u0447\u0438\u0441\u043B\u044F\u0435\u0442\u0441\u044F." : "\u0420\u0435\u043A\u043B\u0430\u043C\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u043F\u0440\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0435 \u0438\u0433\u0440\u044B \u0432\u043D\u0443\u0442\u0440\u0438 VK.") + "</p></section>";
  }
  function bindAd(root, api2, toast2, refresh2) {
    const button = root.querySelector("#reward-ad");
    if (!button) return;
    button.onclick = async () => {
      if (watching) return;
      watching = true;
      button.disabled = true;
      let ticket = claimTicket;
      try {
        if (!claimTicket) {
          const data = await api2("ads/start", {});
          ticket = data.ticket;
          await showRewardedAd();
          claimTicket = ticket;
        }
        await api2("ads/claim", { ticket: claimTicket, completed: true });
        claimTicket = null;
        toast2("\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E 8 \u044D\u043D\u0435\u0440\u0433\u0438\u0438");
      } catch (e) {
        if (ticket && !claimTicket) try {
          await api2("ads/cancel", { ticket });
        } catch (e2) {
        }
        toast2(e.message || "VK \u043D\u0435 \u043F\u043E\u043A\u0430\u0437\u0430\u043B \u0440\u0435\u043A\u043B\u0430\u043C\u0443. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u043F\u043E\u0437\u0436\u0435.");
      } finally {
        watching = false;
        refresh2();
      }
    };
  }
  var watching, claimTicket;
  var init_ads_ui = __esm({
    "ads-ui.js"() {
      init_platform_entry();
      watching = false;
      claimTicket = null;
    }
  });

  // conflict-ui.js
  async function conflictUI(root, api2, toast2, onChange = () => {
  }) {
    root.innerHTML = "<p>\u0421\u0432\u044F\u0437\u044C \u0441 \u043A\u043E\u043C\u0430\u043D\u0434\u043D\u044B\u043C \u043F\u0443\u043D\u043A\u0442\u043E\u043C\u2026</p>";
    try {
      const d = await api2("conflict");
      if (root.hidden) return;
      root.innerHTML = `<div class="clan-banner"><span class="eyebrow orange">\u041E\u041F\u0415\u0420\u0410\u0426\u0418\u042F \xAB\u0412\u041E\u0417\u0412\u0420\u0410\u0429\u0415\u041D\u0418\u0415 \u0421\u0412\u0415\u0422\u0410\xBB</span><h2>\u0423\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0433\u043E\u0440\u043E\u0434.</h2><p>\u0417\u0430\u0447\u0438\u0449\u0430\u0439 \u0440\u0430\u0439\u043E\u043D\u044B \u2192 \u0443\u0441\u0438\u043B\u0438\u0432\u0430\u0439 \u0441\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u2192 \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u044F\u0439\u0441\u044F \u0432 \u043A\u043B\u0430\u043D \u2192 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438 \u043F\u043E\u0434\u0437\u0435\u043C\u043D\u044B\u0439 \u0440\u0435\u0430\u043A\u0442\u043E\u0440.</p><small>\u0421\u0435\u0437\u043E\u043D \u0434\u043E ${new Date(d.endsAt).toLocaleDateString("ru-RU")} \xB7 \u0422\u0432\u043E\u044F \u0431\u043E\u0435\u0432\u0430\u044F \u043C\u043E\u0449\u044C ${d.power}</small></div><div class="clan-columns"><section class="settings-card"><h3>\u0410\u0440\u0435\u043D\u0430 / \u041A\u043B\u0430\u043D\u043E\u0432\u044B\u0439 \u0444\u0440\u043E\u043D\u0442</h3><p>\u0410\u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u044B\u0439 \u0431\u043E\u0439 \u0441 \u044D\u043A\u0438\u043F\u0438\u0440\u043E\u0432\u043A\u043E\u0439 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u0438\u0433\u0440\u043E\u043A\u0430. \u0414\u043E\u0441\u0442\u0443\u043F \u0441\u043E 2 \u0443\u0440\u043E\u0432\u043D\u044F. \u041F\u043E 3 \u043F\u043E\u043F\u044B\u0442\u043A\u0438 \u0432 \u0434\u0435\u043D\u044C \u043D\u0430 \u0440\u0435\u0436\u0438\u043C. \u041F\u0440\u043E\u0442\u0438\u0432\u043D\u0438\u043A\u0438 \u0431\u043B\u0438\u0437\u043A\u0438 \u043F\u043E \u0443\u0440\u043E\u0432\u043D\u044E. \u041F\u043E\u0431\u0435\u0434\u0430: 10 \u043E\u0447\u043A\u043E\u0432 \u0438 40 \u0434\u0435\u0442\u0430\u043B\u0435\u0439; \u043E\u0442\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0435: 2 \u043E\u0447\u043A\u0430 \u0438 10 \u0434\u0435\u0442\u0430\u043B\u0435\u0439. \u0417\u0430\u0449\u0438\u0449\u0430\u044E\u0449\u0438\u0439\u0441\u044F \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0442\u0435\u0440\u044F\u0435\u0442.</p><p>\u041E\u0431\u0445\u043E\u0434 \u043F\u043E\u0431\u0435\u0436\u0434\u0430\u0435\u0442 \u0448\u0442\u0443\u0440\u043C, \u0443\u043A\u0440\u044B\u0442\u0438\u0435 \u2014 \u043E\u0431\u0445\u043E\u0434, \u0448\u0442\u0443\u0440\u043C \u2014 \u0443\u043A\u0440\u044B\u0442\u0438\u0435. \u041F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u043E \u0434\u0430\u0451\u0442 +20% \u043C\u043E\u0449\u043D\u043E\u0441\u0442\u0438; \u043D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0439 \u0432\u044B\u0431\u043E\u0440 \u221220%. \u041F\u0440\u0438 \u0440\u0430\u0432\u0435\u043D\u0441\u0442\u0432\u0435 \u043F\u043E\u0431\u0435\u0436\u0434\u0430\u0435\u0442 \u0437\u0430\u0449\u0438\u0442\u0430.</p><label>\u0422\u0430\u043A\u0442\u0438\u043A\u0430 <select id="combat-tactic">${Object.entries(names).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label><p>\u0410\u0440\u0435\u043D\u0430: ${d.arenaLeft}/3 \xB7 \u041A\u043B\u0430\u043D: ${d.warLeft}/3 \xB7 \u041F\u0435\u0440\u0435\u0440\u044B\u0432 \u043C\u0435\u0436\u0434\u0443 \u0430\u0442\u0430\u043A\u0430\u043C\u0438: 30 \u0441.</p>${d.opponents.map((q) => `<div class="clan-row"><div><strong>${esc2(q.name)}</strong><small>\u0423\u0440. ${q.level} \xB7 ${q.power} \u043C\u043E\u0449\u0438 \xB7 ${names[q.stance]} \xB7 ${esc2(q.clan || "\u0411\u0435\u0437 \u043A\u043B\u0430\u043D\u0430")}</small></div><button class="primary" data-fight="arena" data-code="${esc2(q.code)}" ${!d.arenaLeft ? "disabled" : ""}>\u0410\u0420\u0415\u041D\u0410</button>${d.clan && q.clan && q.clan !== d.clan ? `<button class="secondary" data-fight="war" data-code="${esc2(q.code)}" ${!d.warLeft ? "disabled" : ""}>\u041A\u041B\u0410\u041D\u041E\u0412\u042B\u0419 \u0411\u041E\u0419</button>` : ""}</div>`).join("") || "<p>\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0434\u0440\u0443\u0433\u0438\u0445 \u0438\u0433\u0440\u043E\u043A\u043E\u0432 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0435\u0433\u043E \u0443\u0440\u043E\u0432\u043D\u044F. \u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438 \u0434\u0440\u0443\u0437\u0435\u0439.</p>"}</section><section class="settings-card depth-card"><span class="eyebrow orange">\u041F\u041E\u0414\u0417\u0415\u041C\u041D\u042B\u0419 \u041A\u041E\u041C\u041F\u041B\u0415\u041A\u0421 \xB7 6+</span><h3>${["\u0413\u0435\u0440\u043C\u0435\u0442\u0438\u0447\u043D\u0430\u044F \u0441\u0442\u0430\u043D\u0446\u0438\u044F / \u0421\u0442\u0440\u0430\u0436 \u0448\u043B\u044E\u0437\u0430", "\u0427\u0451\u0440\u043D\u044B\u0439 \u0442\u043E\u043D\u043D\u0435\u043B\u044C / \u041C\u0430\u0442\u043A\u0430 \u0440\u043E\u044F", "\u0420\u0435\u0430\u043A\u0442\u043E\u0440 / \u041D\u0443\u043B\u0435\u0432\u043E\u0439 \u043F\u0430\u0446\u0438\u0435\u043D\u0442", "\u0420\u0435\u0430\u043A\u0442\u043E\u0440 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D"][d.boss.stage]}</h3><p>\u0422\u0440\u0438 \u0431\u043E\u0441\u0441\u0430: 12 000 \u2192 24 000 \u2192 36 000 HP. \u0417\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u043E\u0431\u0449\u0435\u0435 \u0434\u043B\u044F \u043A\u043B\u0430\u043D\u0430. \u0412\u0445\u043E\u0434 \u043F\u043E\u0441\u043B\u0435 \u0427\u0451\u0440\u043D\u043E\u0433\u043E \u043B\u0435\u0441\u0430. \u0423\u0434\u0430\u0440: 12 \u044D\u043D\u0435\u0440\u0433\u0438\u0438, \u043F\u0435\u0440\u0435\u0440\u044B\u0432 30 \u0441\u0435\u043A\u0443\u043D\u0434.</p><div class="xp-track"><i style="width:${100 * d.boss.hp / d.boss.maxHp}%"></i></div><p>${d.boss.hp} / ${d.boss.maxHp} HP</p><p>\u0423\u044F\u0437\u0432\u0438\u043C\u043E\u0441\u0442\u044C: ${names[["assault", "flank", "cover"][d.boss.stage]] || "\u041F\u043E\u0445\u043E\u0434 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D"}. \u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0430\u044F \u0442\u0430\u043A\u0442\u0438\u043A\u0430: 125% \u0443\u0440\u043E\u043D\u0430, \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435: 65%.</p><p>\u0417\u0430 \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0431\u043E\u0441\u0441\u0430 \u0432\u0441\u0435 \u043D\u0430\u043D\u0435\u0441\u0448\u0438\u0435 \u0443\u0440\u043E\u043D \u043F\u043E\u043B\u0443\u0447\u0430\u044E\u0442 300 / 600 / 900 \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \u0438 3 / 6 / 9 \u044F\u0434\u0435\u0440 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043D\u043D\u043E. \u041D\u043E\u0432\u044B\u0439 \u043F\u043E\u0445\u043E\u0434 \u043A\u0430\u0436\u0434\u044B\u0439 \u043F\u043E\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u0438\u043A. \u041A\u043B\u0430\u043D \u0434\u043B\u044F \u0431\u043E\u0451\u0432 \u0437\u0430\u043A\u0440\u0435\u043F\u043B\u044F\u0435\u0442\u0441\u044F \u0434\u043E \u043A\u043E\u043D\u0446\u0430 \u043D\u0435\u0434\u0435\u043B\u0438. \u0411\u0435\u0437 \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u043E\u0433\u043E \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043D\u0430\u0433\u0440\u0430\u0434.</p><button class="primary" data-fight="depth" ${!d.clan || d.boss.stage === 3 ? "disabled" : ""}>\u0410\u0422\u0410\u041A\u041E\u0412\u0410\u0422\u042C \xB7 12 \u042D\u041D\u0415\u0420\u0413\u0418\u0418</button><p>${d.clan ? esc2(d.clan) : "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u0441\u0442\u0443\u043F\u0438 \u0432 \u043A\u043B\u0430\u043D"}</p></section></div><div class="clan-columns">${[["\u0410\u0440\u0435\u043D\u0430", d.arena], ["\u041A\u043B\u0430\u043D\u043E\u0432\u044B\u0439 \u0441\u0435\u0437\u043E\u043D", d.wars]].map(([title, rows]) => `<section class="settings-card"><h3>${title}</h3>${rows.map((r, i) => `<div class="clan-row"><strong>${i + 1}. ${esc2(r.name)}</strong><span>${r.points} \u043E\u0447\u043A\u043E\u0432</span></div>`).join("") || "<p>\u041F\u0435\u0440\u0432\u044B\u0435 \u043C\u0435\u0441\u0442\u0430 \u0435\u0449\u0451 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B.</p>"}</section>`).join("")}</div><div id="combat-report" role="status"></div>`;
      root.querySelectorAll("[data-fight]").forEach((btn) => btn.onclick = async () => {
        root.querySelectorAll("[data-fight]").forEach((x) => x.disabled = true);
        try {
          const r = await api2("conflict/" + btn.dataset.fight, { code: btn.dataset.code, tactic: root.querySelector("select").value });
          onChange();
          await conflictUI(root, api2, toast2, onChange);
          const out = root.querySelector("#combat-report");
          if (out) {
            out.textContent = r.report.text + (r.report.attack !== void 0 ? ` \xB7 ${r.report.attack} \u043F\u0440\u043E\u0442\u0438\u0432 ${r.report.defence} \xB7 +${r.report.points} \u043E\u0447\u043A\u043E\u0432 \xB7 +${r.report.reward} \u0434\u0435\u0442\u0430\u043B\u0435\u0439` : "");
            out.scrollIntoView({ block: "nearest" });
          }
        } catch (e) {
          toast2(e.message);
          await conflictUI(root, api2, toast2);
        }
      });
    } catch (e) {
      root.innerHTML = "<p>" + esc2(e.message) + "</p>";
    }
  }
  var esc2, names;
  var init_conflict_ui = __esm({
    "conflict-ui.js"() {
      esc2 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      names = { assault: "\u0428\u0442\u0443\u0440\u043C", flank: "\u041E\u0431\u0445\u043E\u0434", cover: "\u0423\u043A\u0440\u044B\u0442\u0438\u0435" };
    }
  });

  // clans-ui.js
  async function clansUI(root, api2, toast2, openRaid) {
    root.innerHTML = '<p class="page-intro">\u0421\u0432\u044F\u0437\u044B\u0432\u0430\u0435\u043C\u0441\u044F \u0441 \u043A\u043B\u0430\u043D\u0430\u043C\u0438\u2026</p>';
    try {
      const data = await api2("clans");
      if (root.hidden) return;
      const c = data.clan;
      const row = (title, detail, buttons = "") => '<div class="clan-row"><div><strong>' + title + "</strong><small>" + detail + "</small></div>" + buttons + "</div>";
      root.innerHTML = '<div class="clan-banner"><span class="eyebrow orange">\u0421\u0418\u041B\u0410 \u0412 \u0415\u0414\u0418\u041D\u0421\u0422\u0412\u0415</span><h2>' + esc3((c == null ? void 0 : c.name) || "\u041D\u0430\u0439\u0434\u0438 \u0441\u0432\u043E\u0438\u0445.") + "</h2><p>\u0414\u043E 20 \u0432\u044B\u0436\u0438\u0432\u0448\u0438\u0445. \u0421\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0435 \u0440\u0435\u0439\u0434\u044B. \u041E\u0431\u0449\u0430\u044F \u0446\u0435\u043B\u044C.</p></div>" + (c ? '<div class="clan-columns"><section class="settings-card"><h3>\u041E\u0442\u0440\u044F\u0434 \xB7 ' + c.members.length + "/20</h3>" + c.members.map((m) => row(esc3(m.name), "\u0423\u0440\u043E\u0432\u0435\u043D\u044C " + m.level)).join("") + '<button class="secondary" data-clan-action="leave">\u041F\u041E\u041A\u0418\u041D\u0423\u0422\u042C \u041A\u041B\u0410\u041D</button></section><section class="settings-card"><h3>\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u0440\u0435\u0439\u0434\u044B</h3>' + (c.raids.map((r) => row(esc3(MAPS[r.map].boss), r.hp + " / " + r.maxHp + " HP", '<button class="primary" data-raid="' + r.id + '">\u041A \u0411\u041E\u0421\u0421\u0423</button>')).join("") || "<p>\u0421\u043E\u0437\u0434\u0430\u0439 \u0440\u0435\u0439\u0434 \u043D\u0430 \u043A\u0430\u0440\u0442\u0435. \u041E\u043D \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0443 \u0432\u0441\u0435\u0433\u043E \u043A\u043B\u0430\u043D\u0430.</p>") + (c.owner ? "<h3>\u0417\u0430\u044F\u0432\u043A\u0438</h3>" + (c.requests.map((m) => row(esc3(m.name), "\u0423\u0440\u043E\u0432\u0435\u043D\u044C " + m.level, '<button class="primary" data-clan-action="accept" data-code="' + m.code + '">\u041F\u0420\u0418\u041D\u042F\u0422\u042C</button><button class="secondary" data-clan-action="decline" data-code="' + m.code + '">\u041E\u0422\u041A\u041B\u041E\u041D\u0418\u0422\u042C</button>')).join("") || "<p>\u041D\u043E\u0432\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A \u043D\u0435\u0442.</p>") : "") + "</section></div>" : '<div class="clan-columns"><section class="settings-card"><h3>\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043B\u0430\u043D</h3><p>\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \u0441\u043E 2 \u0443\u0440\u043E\u0432\u043D\u044F. \u041F\u0440\u0438\u043D\u0438\u043C\u0430\u0439 \u0437\u0430\u044F\u0432\u043A\u0438 \u0438 \u0441\u043E\u0431\u0438\u0440\u0430\u0439 \u043E\u0442\u0440\u044F\u0434.</p><form id="clan-create" class="friend-form"><input aria-label="\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043B\u0430\u043D\u0430" placeholder="\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043B\u0430\u043D\u0430" minlength="3" maxlength="28" required><button class="primary">\u0421\u041E\u0417\u0414\u0410\u0422\u042C</button></form></section><section class="settings-card"><h3>\u041E\u0442\u043A\u0440\u044B\u0442\u044B\u0435 \u043A\u043B\u0430\u043D\u044B</h3>' + (data.clans.map((x) => row(esc3(x.name), x.count + "/20 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432", '<button class="secondary" data-clan-action="request" data-code="' + x.code + '" ' + (x.requested || x.count >= 20 ? "disabled" : "") + ">" + (x.requested ? "\u0417\u0410\u042F\u0412\u041A\u0410 \u041E\u0422\u041F\u0420\u0410\u0412\u041B\u0415\u041D\u0410" : "\u0412\u0421\u0422\u0423\u041F\u0418\u0422\u042C") + "</button>")).join("") || "<p>\u0421\u0442\u0430\u043D\u044C \u043E\u0441\u043D\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u043C \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u043A\u043B\u0430\u043D\u0430.</p>") + "</section></div>");
      const act = async (action2, body) => {
        try {
          await api2("clans/" + action2, body);
          await clansUI(root, api2, toast2, openRaid);
        } catch (e) {
          toast2(e.message);
        }
      };
      root.querySelectorAll("[data-clan-action]").forEach((button) => button.onclick = () => {
        button.disabled = true;
        act(button.dataset.clanAction, { code: button.dataset.code }).finally(() => button.disabled = false);
      });
      root.querySelectorAll("[data-raid]").forEach((button) => button.onclick = () => openRaid(button.dataset.raid));
      const form = root.querySelector("form");
      if (form) form.onsubmit = (e) => {
        e.preventDefault();
        act("create", { name: form.querySelector("input").value });
      };
    } catch (e) {
      root.innerHTML = '<p class="page-intro">' + esc3(e.message) + '</p><button class="secondary">\u041F\u041E\u0412\u0422\u041E\u0420\u0418\u0422\u042C</button>';
      root.querySelector("button").onclick = () => clansUI(root, api2, toast2, openRaid);
    }
  }
  var esc3;
  var init_clans_ui = __esm({
    "clans-ui.js"() {
      init_balance();
      esc3 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
  });

  // leaderboard-ui.js
  function leaderboardUI(root, api2, toast2) {
    async function render() {
      if (pending3.has(root)) return;
      pending3.add(root);
      try {
        const d = await api2("leaderboard");
        root.innerHTML = `<div class="settings-card social-heading"><span class="eyebrow orange">\u0422\u041E\u041F 100 \xB7 \u0412\u042B\u0416\u0418\u0412\u0428\u0418\u0415</span><h2>\u0413\u0435\u0440\u043E\u0438 \u0433\u043E\u0440\u043E\u0434\u0430</h2><p>\u0420\u0435\u0439\u0442\u0438\u043D\u0433 \u043F\u043E \u043E\u043F\u044B\u0442\u0443. \u041F\u0440\u0438 \u0440\u0430\u0432\u0435\u043D\u0441\u0442\u0432\u0435 \u2014 \u043F\u043E\u0431\u0435\u0434\u044B \u043D\u0430\u0434 \u0431\u043E\u0441\u0441\u0430\u043C\u0438 \u0438 \u0443\u0441\u0442\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0435. \u0418\u0433\u0440\u0430\u0439 \u0438 \u0440\u0430\u0437\u0432\u0438\u0432\u0430\u0439\u0441\u044F: \u0443\u0447\u0430\u0441\u0442\u0438\u0435 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u043F\u043E\u0441\u043B\u0435 \u0432\u0445\u043E\u0434\u0430 \u0447\u0435\u0440\u0435\u0437 VK. \u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u043A\u0430\u0436\u0434\u044B\u0435 4 \u0441\u0435\u043A\u0443\u043D\u0434\u044B.</p><div class="leader-summary"><strong>\u0422\u0432\u043E\u0451 \u043C\u0435\u0441\u0442\u043E: ${d.meRank ? "#" + d.meRank : "\u2014"}</strong><span>\u0418\u0433\u0440\u043E\u043A\u043E\u0432 VK: ${fmt4(d.total)} \xB7 \u0412 \u0441\u0435\u0442\u0438: ${fmt4(d.online)}</span><button class="secondary" id="top-refresh">\u041E\u0411\u041D\u041E\u0412\u0418\u0422\u042C</button></div></div><div class="social-list leaderboard-list">${d.players.map((p) => `<article class="friend-person rank-${p.rank <= 3 ? p.rank : "other"} ${p.me ? "is-me" : ""}"><strong class="rank-number">#${p.rank}</strong>${portrait(p)}<span class="friend-person-info"><b>${esc4(p.name)}${p.me ? " \xB7 \u0422\u042B" : ""}</b><small>\u0423\u0440. ${p.level} \xB7 ${fmt4(p.xp)} XP \xB7 \u0411\u043E\u0441\u0441\u044B: ${fmt4(p.bossKills)}</small></span>${p.me ? '<span class="rank-status">\u0422\u0412\u041E\u0419 \u041F\u0420\u041E\u0424\u0418\u041B\u042C</span>' : p.friend ? '<span class="rank-status">\u0412 \u0414\u0420\u0423\u0417\u042C\u042F\u0425</span>' : `<button class="secondary" data-add="${p.code}" ${p.requested ? "disabled" : ""}>${p.requested ? "\u0417\u0410\u042F\u0412\u041A\u0410 \u041E\u0422\u041F\u0420\u0410\u0412\u041B\u0415\u041D\u0410" : "\u0414\u041E\u0411\u0410\u0412\u0418\u0422\u042C \u0412 \u0414\u0420\u0423\u0417\u042C\u042F"}</button>`}</article>`).join("") || '<p class="page-intro">\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u044B\u0445 \u0438\u0433\u0440\u043E\u043A\u043E\u0432 VK \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0412\u043E\u0439\u0434\u0438 \u0447\u0435\u0440\u0435\u0437 VK, \u0447\u0442\u043E\u0431\u044B \u0443\u0447\u0430\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u0432 \u0440\u0435\u0439\u0442\u0438\u043D\u0433\u0435.</p>'}</div>`;
        root.querySelector("#top-refresh").onclick = render;
        root.querySelectorAll("[data-add]").forEach((b) => b.onclick = async () => {
          b.disabled = true;
          try {
            await api2("friends/request", { code: b.dataset.add });
            b.textContent = "\u0417\u0410\u042F\u0412\u041A\u0410 \u041E\u0422\u041F\u0420\u0410\u0412\u041B\u0415\u041D\u0410";
            toast2("\u0418\u0433\u0440\u043E\u0432\u0430\u044F \u0437\u0430\u044F\u0432\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430");
          } catch (e) {
            b.disabled = false;
            toast2(e.message);
          }
        });
      } catch (e) {
        root.innerHTML = '<div class="settings-card"><p>' + esc4(e.message) + '</p><button class="secondary">\u041F\u041E\u0412\u0422\u041E\u0420\u0418\u0422\u042C</button></div>';
        root.querySelector("button").onclick = render;
      } finally {
        pending3.delete(root);
      }
    }
    render();
  }
  var esc4, fmt4, pending3;
  var init_leaderboard_ui = __esm({
    "leaderboard-ui.js"() {
      init_friends_ui();
      esc4 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      fmt4 = (n) => Math.floor(n || 0).toLocaleString("ru-RU");
      pending3 = /* @__PURE__ */ new WeakSet();
    }
  });

  // config.js
  var CLOUD_API, isRemoteFrontend, normalize, override, API_BASE;
  var init_config = __esm({
    "config.js"() {
      CLOUD_API = location.hostname === "hordeminecraft.github.io" ? "https://api.hordeminecraft.ru/obitel-gateway.php/" : "https://obiteldead.deniswww127.workers.dev/api/";
      isRemoteFrontend = location.hostname === "hordeminecraft.github.io" || location.hostname === "obitel.sourcecraft.site" || location.hostname.endsWith(".pages.dev");
      normalize = (value) => value.endsWith("/") ? value : value + "/";
      override = globalThis.OBITEL_API_BASE;
      API_BASE = normalize(override || (isRemoteFrontend ? CLOUD_API : new URL("api/", location.href).href));
    }
  });

  // client-api.js
  function requestAPI(path, body) {
    if (body === void 0 && reads.has(path)) return reads.get(path);
    const promise = performRequest(path, body);
    if (body === void 0) {
      reads.set(path, promise);
      promise.then(() => reads.delete(path), () => reads.delete(path));
    }
    return promise;
  }
  async function performRequest(path, body) {
    var _a2, _b2;
    if (API_BASE.includes("PASTE-YOUR-WORKER-URL-HERE")) throw new Error("\u0418\u0433\u0440\u043E\u0432\u043E\u0439 \u0441\u0435\u0440\u0432\u0435\u0440 \u0435\u0449\u0451 \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D.");
    const authRequest = path === "auth/vk";
    const payload = authRequest ? { ...body, session: tokenMode ? token : "" } : body;
    const headers = {};
    if (body !== void 0) headers["Content-Type"] = authRequest ? "text/plain;charset=UTF-8" : "application/json";
    if (tokenMode && token && !authRequest) headers["X-Obitel-Session"] = token;
    const controller = new AbortController(), started = performance.now();
    const timeout = setTimeout(() => controller.abort(), 15e3);
    let phase = "fetch", httpStatus = 0;
    try {
      let url = new URL(path, API_BASE);
      if (API_BASE === "https://api.hordeminecraft.ru/obitel-gateway.php/") {
        url = new URL(API_BASE.slice(0, -1));
        url.searchParams.set("route", path);
      }
      const response = await fetch(url, { method: body === void 0 ? "GET" : "POST", headers, credentials: crossOrigin ? "omit" : "same-origin", body: body === void 0 ? void 0 : JSON.stringify(payload), signal: controller.signal });
      phase = "body";
      httpStatus = response.status;
      if (!((_a2 = response.headers.get("content-type")) == null ? void 0 : _a2.includes("application/json"))) throw Object.assign(new Error("\u0421\u0435\u0440\u0432\u0435\u0440 \u0432\u0435\u0440\u043D\u0443\u043B \u043E\u0442\u0432\u0435\u0442 \u043D\u0435 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 JSON. \u041A\u043E\u0434 RESPONSE_FORMAT. HTTP " + httpStatus), { status: httpStatus });
      const data = await response.json();
      phase = "processing";
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u043E\u0442\u0432\u0435\u0442\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430. \u041A\u043E\u0434 RESPONSE_FORMAT.");
      if (!response.ok) throw Object.assign(new Error(data.error || "\u0421\u0435\u0440\u0432\u0435\u0440 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D"), { status: response.status });
      const issued = response.headers.get("X-Obitel-Session");
      if (tokenMode && issued && /^[a-f0-9]{32}$/.test(issued)) {
        if (path === "auth/vk" && token && token !== issued) {
          try {
            localStorage.setItem(tokenKey + ":previous", token);
          } catch (e) {
          }
        }
        token = issued;
        try {
          localStorage.setItem(tokenKey, issued);
        } catch (e) {
        }
      }
      const ms = Math.round(performance.now() - started);
      (_b2 = document.querySelector(".connection")) == null ? void 0 : _b2.setAttribute("title", "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0437\u0430\u043F\u0440\u043E\u0441: " + ms + " \u043C\u0441");
      return data;
    } catch (error) {
      if ((error == null ? void 0 : error.name) === "AbortError") throw new Error("\u0421\u0435\u0440\u0432\u0435\u0440 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u0434\u043E\u043B\u044C\u0448\u0435 15 \u0441\u0435\u043A\u0443\u043D\u0434. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0441\u0432\u044F\u0437\u044C \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.");
      if (phase === "body" && (error instanceof TypeError || error instanceof SyntaxError)) throw new Error("\u041E\u0442\u0432\u0435\u0442 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D, \u043D\u043E \u043D\u0435 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D. \u041A\u043E\u0434 RESPONSE_BODY. HTTP " + httpStatus + ". \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435.");
      if (phase === "fetch" && error instanceof TypeError) throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043E\u0442\u0432\u0435\u0442 \u0438\u0433\u0440\u043E\u0432\u043E\u0433\u043E \u0441\u0435\u0440\u0432\u0435\u0440\u0430 (" + new URL(API_BASE).hostname + "). \u041A\u043E\u0434 NETWORK_FETCH. \u0417\u0430\u043F\u0440\u043E\u0441: " + (path === "auth/vk" ? "\u0432\u0445\u043E\u0434 VK" : path === "profile" ? "\u043F\u0440\u043E\u0444\u0438\u043B\u044C" : "\u0438\u0433\u0440\u043E\u0432\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435") + ". \u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A: " + location.origin + ". \u0420\u0435\u0436\u0438\u043C: " + (window.parent !== window ? "iframe" : "\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430") + ". \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435.");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  var tokenKey, crossOrigin, tokenMode, token, reads;
  var init_client_api = __esm({
    "client-api.js"() {
      init_config();
      tokenKey = "obitel-session:" + API_BASE;
      crossOrigin = new URL(API_BASE).origin !== location.origin;
      tokenMode = crossOrigin || window.parent !== window;
      token = "";
      try {
        token = localStorage.getItem(tokenKey) || "";
        if (!token && API_BASE === "https://api.hordeminecraft.ru/obitel-gateway.php/") {
          const previous = localStorage.getItem("obitel-session:https://obiteldead.deniswww127.workers.dev/api/");
          if (/^[a-f0-9]{32}$/.test(previous || "")) {
            token = previous;
            localStorage.setItem(tokenKey, token);
          }
        }
      } catch (e) {
      }
      reads = /* @__PURE__ */ new Map();
    }
  });

  // game.js
  var game_exports = {};
  function showProfile(data) {
    playerProfile = { ...playerProfile, ...data };
    const name = document.getElementById("profile-name");
    if (name) name.textContent = playerProfile.name;
    const avatar = document.querySelector(".profile .avatar");
    if (avatar) {
      avatar.innerHTML = portrait(playerProfile);
      avatar.className = "avatar avatar-" + (playerProfile.avatar || 0);
    }
  }
  function applyControlPrefs() {
    document.body.classList.toggle("high-contrast", prefs.contrast);
    document.body.classList.toggle("left-handed", prefs.leftHanded);
    document.body.classList.toggle("large-controls", prefs.largeControls);
  }
  async function api(path, body) {
    const data = await requestAPI(path, body);
    if (Object.prototype.hasOwnProperty.call(data, "activeRaidId")) activeRaidId = data.activeRaidId;
    if (path === "profile" || path === "profile/vk") showProfile({ name: data.name, avatar: data.avatar || 0, photo: data.photo || "" });
    if (data.save) {
      save = data.save;
      persist();
    }
    if (data.serverTime) serverOffset = data.serverTime - Date.now();
    return data;
  }
  async function connect() {
    const status = $(".connection");
    status.textContent = "\u041F\u041E\u0414\u041A\u041B\u042E\u0427\u0415\u041D\u0418\u0415\u2026";
    try {
      const params = new URLSearchParams(location.search);
      if (params.has("sign")) {
        await requestAPI("auth/vk", { launch: new URLSearchParams([...params].filter(([k]) => k.startsWith("vk_") || k === "sign")).toString() });
      }
      const profile = await api("profile");
      networkReady = true;
      if (profile.account === "vk" && canSyncVKFriendsSilently()) syncVKFriends(api).catch(() => {
      });
      if (profile.account === "vk") currentVKUser().then((user) => {
        if (user && (user.photo_200 || user.photo_100)) return api("profile/vk", { id: user.id, photo: user.photo_200 || user.photo_100 });
      }).catch(() => {
      });
      try {
        const encounters = await api("raids");
        raid = encounters.active || encounters.completed[0] || null;
      } catch (e) {
      }
      status.innerHTML = profile.account === "vk" ? "<i></i> \u041F\u0420\u041E\u0424\u0418\u041B\u042C VK" : "<i></i> \u0413\u041E\u0421\u0422\u0415\u0412\u041E\u0419 \u041F\u0420\u041E\u0424\u0418\u041B\u042C";
      playerProfile.account = profile.account || "guest";
      $("#connection-error").hidden = true;
    } catch (e) {
      networkReady = false;
      status.textContent = "\u041D\u0415\u0422 \u0421\u0412\u042F\u0417\u0418";
      $("#connection-error").hidden = false;
      $("#connection-message").textContent = e.message;
    }
    refresh();
  }
  async function action(fn) {
    if (busy) return;
    if (!networkReady) {
      toast("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0441\u044C \u043A \u0438\u0433\u0440\u043E\u0432\u043E\u043C\u0443 \u0441\u0435\u0440\u0432\u0435\u0440\u0443");
      return;
    }
    busy = true;
    try {
      await fn();
    } catch (e) {
      toast(e.message);
    } finally {
      busy = false;
      refresh();
    }
  }
  function energyHud() {
    restoreEnergy(save, Date.now() + serverOffset);
    $("#energy").textContent = save.energy;
    if (page === "map") $("#deploy").disabled = !networkReady || !unlocked(save, selected) || save.energy < sortiePlan(save, selected, sortieMode).cost;
    let left = ENERGY_INTERVAL - (Date.now() + serverOffset - save.energyAt);
    $("#energy-clock").textContent = save.energy >= ENERGY_MAX ? "\u0417\u0410\u041F\u0410\u0421 \u041F\u041E\u041B\u041E\u041D" : "+1 \u0447\u0435\u0440\u0435\u0437 " + Math.max(0, Math.ceil(left / 6e4)) + " \u043C\u0438\u043D";
  }
  function today() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  }
  function rollDay() {
    if (save.daily.date !== today()) save.daily = { date: today(), kills: 0, claimed: false };
  }
  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify(save));
    } catch (e) {
      toast("\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u043D\u0435 \u0440\u0430\u0437\u0440\u0435\u0448\u0438\u043B \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441.");
    }
  }
  function toast(t) {
    $("#toast").textContent = t;
    $("#toast").classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3200);
  }
  function refresh() {
    setAppearance(save);
    rollDay();
    energyHud();
    $("#scrap").textContent = save.scrap;
    $("#cores").textContent = save.cores;
    $("#level").textContent = `\u0423\u0440\u043E\u0432\u0435\u043D\u044C ${playerLevel(save)}`;
    let progress = levelProgress(save);
    $("#xp-fill").style.width = progress.percent + "%";
    $("#xp-caption").textContent = progress.max ? "\u041C\u0410\u041A\u0421\u0418\u041C\u0410\u041B\u042C\u041D\u042B\u0419 \u0423\u0420\u041E\u0412\u0415\u041D\u042C \xB7 500" : Math.floor(progress.current) + " / " + progress.required + " XP";
    $("#car-level").textContent = `\u0423\u0420. ${save.engine + save.body + save.trunk}`;
    $("#daily-short").textContent = `\u0423\u0441\u0442\u0440\u0430\u043D\u0438\u0442\u044C 20 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0445 \xB7 ${Math.min(20, save.daily.kills)} / 20`;
    renderPage();
    if (page === "daily") bindAd($("#daily-page"), api, toast, refresh);
    document.querySelectorAll("[data-item]").forEach((c) => drawItem(c, Number(c.dataset.item)));
    document.querySelectorAll("[data-armor]").forEach((b) => b.onclick = () => action(() => api("armor", { armor: Number(b.dataset.armor) })));
  }
  function selectMap(i) {
    selected = i;
    let m = MAPS[i];
    const plan = briefing();
    missionModes();
    districtProgress();
    $("#map-name").textContent = m.name;
    $("#map-desc").textContent = m.desc;
    $("#mission").textContent = m.goal;
    $("#map-threat").textContent = `\u0423\u0413\u0420\u041E\u0417\u0410 ${["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][i]}`;
    $("#deploy").disabled = !networkReady || !unlocked(save, i) || save.energy < plan.cost;
    $("#deploy").innerHTML = '<span class="deploy-label">' + plan.name + '</span><span class="deploy-cost">' + plan.cost + " \u03DF " + shelterIcon("arrow") + "</span>";
    $("#deploy-hint").textContent = !unlocked(save, i) ? "\u041F\u041E\u0411\u0415\u0414\u0418 \u0411\u041E\u0421\u0421\u0410 \u041F\u0420\u0415\u0414\u042B\u0414\u0423\u0429\u0415\u0413\u041E \u0420\u0410\u0419\u041E\u041D\u0410" : save.energy < plan.cost ? "\u041D\u0415\u0414\u041E\u0421\u0422\u0410\u0422\u041E\u0427\u041D\u041E \u042D\u041D\u0415\u0420\u0413\u0418\u0418 \xB7 +1 \u041A\u0410\u0416\u0414\u042B\u0415 5 \u041C\u0418\u041D\u0423\u0422" : `\u0417\u0410\u0427\u0418\u0421\u0422\u041E\u041A: ${save.districtRuns[i]} / 3 \u0414\u041E \u0411\u041E\u0421\u0421\u0410`;
    $("#boss-open").disabled = !bossUnlocked(save, i);
    $("#boss-progress").textContent = bossUnlocked(save, i) ? "\u0411\u041E\u0421\u0421 \u0414\u041E\u0421\u0422\u0423\u041F\u0415\u041D" : `\u041D\u0423\u0416\u041D\u041E 3 \u0417\u0410\u0427\u0418\u0421\u0422\u041A\u0418 \u0418 \u0423\u0420\u041E\u0412\u0415\u041D\u042C ${MAPS[i].level}`;
    scene($("#scene"), i);
    document.querySelectorAll(".map-card").forEach((el, j) => el.classList.toggle("selected", i === j));
  }
  function missionModes() {
    let root = $("#mission-modes");
    if (!root) {
      root = document.createElement("div");
      root.id = "mission-modes";
      root.className = "mission-modes";
      root.setAttribute("role", "group");
      root.setAttribute("aria-label", "\u0420\u0435\u0436\u0438\u043C \u0432\u044B\u0445\u043E\u0434\u0430");
      $("#deploy").before(root);
    }
    root.innerHTML = SORTIE_MODES.map((m) => '<button class="' + (m.id === sortieMode ? "selected" : "") + '" data-sortie="' + m.id + '" aria-pressed="' + (m.id === sortieMode) + '" ' + (playerLevel(save) < m.level ? "disabled" : "") + ">" + m.name + "<small>" + (playerLevel(save) < m.level ? "\u0423\u0440. " + m.level : m.cost + " \u044D\u043D\u0435\u0440\u0433\u0438\u0438") + "</small></button>").join("");
    root.querySelectorAll("[data-sortie]").forEach((b) => b.onclick = () => {
      sortieMode = b.dataset.sortie;
      selectMap(selected);
      root.querySelector('[data-sortie="' + sortieMode + '"]').focus({ preventScroll: true });
    });
  }
  function briefing() {
    let root = $("#operation-briefing");
    if (!root) {
      root = document.createElement("section");
      root.id = "operation-briefing";
      root.className = "operation-briefing";
      $(".hero").after(root);
    }
    return renderBriefing(root, save, selected, sortieMode);
  }
  function mapCards() {
    const campaign = campaignState(save);
    $("#maps").innerHTML = campaign.districts.map((d) => '<button class="map-card ' + (d.index === selected ? "selected" : "") + '" data-map="' + d.index + '" aria-label="' + d.name + ", " + d.status + '"><canvas width="360" height="190"></canvas><span class="number">' + String(d.index + 1).padStart(2, "0") + '</span><div class="map-info"><span class="map-role">' + d.role + "</span><b>" + d.name + '</b><div class="map-level"><span>\u0423\u0420\u041E\u0412\u0415\u041D\u042C ' + d.level + "</span><em>" + d.status + '</em></div><div class="district-stages">' + [1, 2, 3].map((n) => '<i class="' + (d.runs >= n ? "done" : "") + '"></i>').join("") + '</div><div class="map-status"><span>' + d.runs + " / 3 \u0417\u0410\u0427\u0418\u0421\u0422\u041A\u0418</span><span>" + shelterIcon(d.done ? "leaderboard" : "raids") + "</span></div></div></button>").join("");
    document.querySelectorAll(".map-card").forEach((el, i) => {
      scene(el.querySelector("canvas"), i, -1);
      el.onclick = () => {
        selectMap(i);
        $(".hero").scrollIntoView({ block: "start" });
      };
    });
    let summary = $("#campaign-summary");
    if (!summary) {
      summary = document.createElement("section");
      summary.id = "campaign-summary";
      summary.className = "campaign-summary";
      $(".hero").after(summary);
    }
    renderCampaignSummary(summary, save, (c) => {
      selected = c.next.index;
      if (c.action === "boss") navigate("raids");
      else {
        selectMap(selected);
        $(".hero").scrollIntoView({ block: "start" });
      }
    }, (ready) => {
      journalTab = ready ? "milestones" : "campaign";
      navigate("guide");
    });
  }
  function districtProgress() {
    let root = $("#mission-progress");
    if (!root) {
      root = document.createElement("div");
      root.id = "mission-progress";
      root.className = "district-stages";
      $("#deploy-hint").before(root);
    }
    const count2 = save.districtRuns[selected] || 0;
    root.innerHTML = [1, 2, 3].map((n) => '<i class="' + (count2 >= n ? "done" : "") + '"></i>').join("");
    root.setAttribute("aria-label", "\u0417\u0430\u0447\u0438\u0441\u0442\u043A\u0438 \u0440\u0430\u0439\u043E\u043D\u0430: " + Math.min(3, count2) + " \u0438\u0437 3");
  }
  function renderInventory() {
    return '<section class="gear-pane" id="gear-supplies" role="tabpanel" aria-labelledby="gear-tab-supplies" ' + (gearTab !== "supplies" ? "hidden" : "") + '><div class="section-title"><h3>\u0421\u043A\u043B\u0430\u0434 \u0443\u0431\u0435\u0436\u0438\u0449\u0430</h3><span>\u041C\u0410\u0422\u0415\u0420\u0418\u0410\u041B\u042B</span></div><div class="supply-grid">' + [[0, "\u0414\u0435\u0442\u0430\u043B\u0438", save.scrap, "\u041E\u0440\u0443\u0436\u0438\u0435, \u043C\u0430\u0448\u0438\u043D\u0430 \u0438 \u043C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u0430\u044F"], [1, "\u042F\u0434\u0440\u0430", save.cores, "\u0420\u0435\u0439\u0434-\u0431\u043E\u0441\u0441\u044B \u0438 \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0435 \u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442\u044B"], [2, "\u0422\u043A\u0430\u043D\u044C", save.cloth || 0, "3\u201310 \u0437\u0430 \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0443 \xB7 6 \u0437\u0430 \u0431\u043E\u0441\u0441\u0430"]].map(([i, n, v, d]) => '<article class="supply">' + itemArt(i) + "<div><small>" + n + "</small><strong>" + v + "</strong><p>" + d + "</p></div></article>").join("") + "</div>" + item("\u271A", "\u041F\u043E\u043B\u0435\u0432\u043E\u0439 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442", "\u0410\u0412\u0422\u041E\u041C\u0410\u0422\u0418\u0427\u0415\u0421\u041A\u041E\u0415 \u041B\u0415\u0427\u0415\u041D\u0418\u0415", "\u041D\u0430\u0445\u043E\u0434\u043A\u0430 \u0441 \u0448\u0430\u043D\u0441\u043E\u043C 5%, \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u0434\u0432\u0435 \u0437\u0430 \u0432\u044B\u043B\u0430\u0437\u043A\u0443. \u041B\u0435\u0447\u0435\u043D\u0438\u0435: 28 HP. \u041F\u0440\u0438 \u043F\u043E\u043B\u043D\u043E\u043C \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u0430\u043F\u0442\u0435\u0447\u043A\u0430 \u043D\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u0443\u0435\u0442\u0441\u044F.", "") + "</section>";
  }
  function renderGear() {
    const root = $("#gear-page"), opened = [...root.querySelectorAll(".gear-workshop[open]")].map((e) => e.closest(".gear-pane").id), tabs = [["weapons", "\u041E\u0440\u0443\u0436\u0438\u0435"], ["armor", "\u0411\u0440\u043E\u043D\u044F"], ["supplies", "\u041F\u0440\u0438\u043F\u0430\u0441\u044B"]];
    root.innerHTML = `<div class="loadout-hero"><canvas id="loadout-avatar" width="400" height="380"></canvas><div><span class="eyebrow orange">\u0422\u0412\u041E\u0419 \u0412\u042B\u0416\u0418\u0412\u0428\u0418\u0419</span><h2>${WEAPONS[save.weapon].name}</h2><strong>${ARMOR[save.armorTier || 0].name}</strong><div class="stat-pills"><span>${stats(save).hp} HP</span><span>${Math.round(stats(save).damage)} \u0423\u0420\u041E\u041D</span><span>${playerLevel(save)} \u0423\u0420\u041E\u0412\u0415\u041D\u042C</span></div></div></div><div class="gear-tabs" role="tablist" aria-label="\u0421\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u0435">${tabs.map(([id, label2]) => '<button id="gear-tab-' + id + '" role="tab" aria-controls="gear-' + id + '" aria-selected="' + (gearTab === id) + '" tabindex="' + (gearTab === id ? "0" : "-1") + '" data-gear-tab="' + id + '">' + label2 + "</button>").join("")}</div><section class="gear-pane" id="gear-weapons" role="tabpanel" aria-labelledby="gear-tab-weapons" ${gearTab !== "weapons" ? "hidden" : ""}><div id="weapon-catalogue"></div><details class="gear-workshop"><summary>\u041C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u0430\u044F \xB7 \u043E\u0440\u0443\u0436\u0438\u0435 ${save.weaponLevel} / 10</summary>${upgrade("weaponLevel", "\u0412\u0435\u0440\u0441\u0442\u0430\u043A \u043E\u0440\u0443\u0436\u0435\u0439\u043D\u0438\u043A\u0430", `+8% \u0431\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0443\u0440\u043E\u043D\u0430 \u0437\u0430 \u0443\u0440\u043E\u0432\u0435\u043D\u044C. \u0421\u0435\u0439\u0447\u0430\u0441 +${save.weaponLevel * 8}%.`)}</details></section><section class="gear-pane" id="gear-armor" role="tabpanel" aria-labelledby="gear-tab-armor" ${gearTab !== "armor" ? "hidden" : ""}><div id="armor-catalogue"></div><details class="gear-workshop"><summary>\u041C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u0430\u044F \xB7 \u043F\u043E\u0434\u043A\u043B\u0430\u0434\u043A\u0430 ${save.armor} / 10</summary>${upgrade("armor", "\u0423\u0441\u0438\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u0434\u043A\u043B\u0430\u0434\u043A\u0438", `+8 \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u044F \u0437\u0430 \u0443\u0440\u043E\u0432\u0435\u043D\u044C. \u0421\u0435\u0439\u0447\u0430\u0441 +${save.armor * 8} HP. \u0420\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0441 \u043B\u044E\u0431\u044B\u043C \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u043E\u043C.`)}</details></section>` + renderInventory();
    root.querySelectorAll(".gear-workshop").forEach((e) => e.open = opened.includes(e.closest(".gear-pane").id));
    const catalogues = {};
    const mount = (kind) => catalogues[kind] = mountGearCatalogue(root.querySelector(kind === "weapons" ? "#weapon-catalogue" : "#armor-catalogue"), save, kind, { drawWeapon, drawItem, equip: (i) => action(async () => {
      await api(kind === "weapons" ? "weapon" : "armor", { [kind === "weapons" ? "weapon" : "armor"]: i });
      toast("\u0421\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u043D\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435");
    }).then(() => {
      var _a2;
      return (_a2 = root.querySelector("#gear-" + kind + ' [data-catalogue-select="' + i + '"]')) == null ? void 0 : _a2.focus({ preventScroll: true });
    }) });
    mount("weapons");
    mount("armor");
    const change = (id) => {
      var _a2;
      gearTab = id;
      root.querySelectorAll("[data-gear-tab]").forEach((b) => {
        const active = b.dataset.gearTab === id;
        b.setAttribute("aria-selected", String(active));
        b.tabIndex = active ? 0 : -1;
      });
      root.querySelectorAll(".gear-pane").forEach((p) => p.hidden = p.id !== "gear-" + id);
      (_a2 = catalogues[id]) == null ? void 0 : _a2.call(catalogues);
    };
    root.querySelectorAll("[data-gear-tab]").forEach((b) => b.onclick = () => change(b.dataset.gearTab));
    root.querySelector(".gear-tabs").onkeydown = (e) => {
      const ids = tabs.map((t) => t[0]), i = ids.indexOf(gearTab);
      let next;
      if (e.key === "ArrowRight") next = (i + 1) % ids.length;
      else if (e.key === "ArrowLeft") next = (i + ids.length - 1) % ids.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = ids.length - 1;
      else return;
      e.preventDefault();
      change(ids[next]);
      root.querySelector("#gear-tab-" + ids[next]).focus();
    };
    root.querySelectorAll("[data-item]").forEach((c) => drawItem(c, Number(c.dataset.item)));
    root.querySelectorAll("[data-armor]").forEach((b) => b.onclick = () => action(() => api("armor", { armor: Number(b.dataset.armor) })));
  }
  function renderPage() {
    if (page === "leaderboard") leaderboardUI($("#leaderboard-page"), api, toast);
    if (page === "conflict") conflictUI($("#conflict-page"), api, toast, () => {
      energyHud();
      $("#scrap").textContent = save.scrap;
      $("#cores").textContent = save.cores;
    });
    if (page === "clans") clansUI($("#clans-page"), api, toast, async (id) => {
      try {
        raid = (await api("raids/" + id)).raid;
        navigate("raids");
      } catch (e) {
        toast(e.message);
      }
    });
    if (page === "friends") friendsUI($("#friends-page"), api, toast, async (id) => {
      try {
        raid = (await api("raids/" + id)).raid;
        navigate("raids");
      } catch (e) {
        toast(e.message);
      }
    });
    if (page === "map") {
      mapCards();
      selectMap(selected);
    }
    if (page === "gear") renderGear();
    if (page === "garage") garageUI($("#garage-page"), save, playerLevel(save), [upgrade("engine", "\u0413\u0435\u043D\u0435\u0440\u0430\u0442\u043E\u0440", `+4% \u0443\u0440\u043E\u043D\u0430 \u0437\u0430 \u0443\u0440\u043E\u0432\u0435\u043D\u044C. \u0421\u0435\u0439\u0447\u0430\u0441 +${save.engine * 4}%.`), upgrade("body", "\u0411\u0440\u043E\u043D\u0435\u043A\u043E\u0440\u043F\u0443\u0441", `+4% \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u044F \u0437\u0430 \u0443\u0440\u043E\u0432\u0435\u043D\u044C. \u0421\u0435\u0439\u0447\u0430\u0441 +${save.body * 4}%.`), upgrade("trunk", "\u0413\u0440\u0443\u0437\u043E\u0432\u043E\u0439 \u043E\u0442\u0441\u0435\u043A", `+5% \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \u0437\u0430 \u0432\u044B\u043B\u0430\u0437\u043A\u0443 \u0437\u0430 \u0443\u0440\u043E\u0432\u0435\u043D\u044C. \u0421\u0435\u0439\u0447\u0430\u0441 +${save.trunk * 5}%.`)].join(""), (id) => action(() => api("vehicle", { vehicle: id })), renderPage);
    if (page === "daily") {
      $("#daily-page").innerHTML = adCard() + `<p class="page-intro">\u0412\u044B\u0431\u0438\u0440\u0430\u0439 \u0437\u0430\u0434\u0430\u0447\u0438 \u0438 \u043F\u043B\u0430\u043D\u0438\u0440\u0443\u0439 \u0432\u044B\u043B\u0430\u0437\u043A\u0438. \u041A\u043E\u043D\u0442\u0440\u0430\u043A\u0442 \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0432 00:00 \u043F\u043E \u041C\u043E\u0441\u043A\u0432\u0435. \u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043D\u044B\u0439 \u0434\u0435\u043D\u044C \u043D\u0435 \u043E\u0442\u043D\u0438\u043C\u0430\u0435\u0442 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441. \u041D\u0430\u0433\u0440\u0430\u0434\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435.</p><div class="item-grid">${item("\u25A4", "\u0413\u043E\u0440\u043E\u0434 \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u0442\u0430\u0442\u044C \u0442\u0438\u0448\u0435", `\u0421\u0415\u0413\u041E\u0414\u041D\u042F \xB7 ${Math.min(save.daily.kills, 20)} / 20`, `\u0423\u0441\u0442\u0440\u0430\u043D\u0438 20 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0445 \u0432 \u043B\u044E\u0431\u044B\u0445 \u0440\u0430\u0439\u043E\u043D\u0430\u0445. \u041D\u0430\u0433\u0440\u0430\u0434\u0430: 120 \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \u0438 1 \u044F\u0434\u0440\u043E.`, `<button class="primary" id="claim" ${save.daily.claimed || save.daily.kills < 20 ? "disabled" : ""}>${save.daily.claimed ? "\u041D\u0410\u0413\u0420\u0410\u0414\u0410 \u041F\u041E\u041B\u0423\u0427\u0415\u041D\u0410" : save.daily.kills < 20 ? "\u041A\u041E\u041D\u0422\u0420\u0410\u041A\u0422 \u0412 \u041F\u0420\u041E\u0426\u0415\u0421\u0421\u0415" : "\u0417\u0410\u0411\u0420\u0410\u0422\u042C \u041D\u0410\u0413\u0420\u0410\u0414\u0423"}</button>`)}${item("\u25C7", "\u0422\u0440\u043E\u0444\u0435\u0438 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u043E\u0439 \u0437\u043E\u043D\u044B", `${save.cores} \u042F\u0414\u0415\u0420`, `\u042F\u0434\u0440\u043E \u0432\u044B\u0434\u0430\u0451\u0442\u0441\u044F \u0437\u0430 \u043F\u043E\u0431\u0435\u0434\u0443 \u043D\u0430\u0434 \u0431\u043E\u0441\u0441\u043E\u043C. \u041F\u043E\u0442\u0440\u0430\u0442\u044C \u044F\u0434\u0440\u0430 \u043D\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0440\u0435\u0434\u043A\u043E\u0439 \u0431\u0440\u043E\u043D\u0438.`, "")}</div><div id="operation-contracts"></div>`;
      renderOperations($("#operation-contracts"), api, toast, refresh);
    }
    if (page === "raids") renderRaids();
    if (page === "settings") renderSettings();
    if (page === "guide") renderJournal();
    document.querySelectorAll("[data-weapon-art]").forEach((c) => drawWeapon(c, Number(c.dataset.weaponArt)));
    if ($("#loadout-avatar")) {
      let c = $("#loadout-avatar");
      person(c.getContext("2d"), 180, 355, "hero", 3, 0, 1, 0, false);
    }
    document.querySelectorAll("[data-upgrade]").forEach((b) => b.onclick = () => action(async () => {
      await api("upgrade", { field: b.dataset.upgrade });
      toast("\u0423\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E");
    }));
    document.querySelectorAll("[data-weapon]").forEach((b) => b.onclick = () => action(() => api("weapon", { weapon: +b.dataset.weapon })));
    if ($("#claim")) $("#claim").onclick = () => action(async () => {
      await api("daily", {});
      toast("\u041A\u043E\u043D\u0442\u0440\u0430\u043A\u0442 \u0437\u0430\u043A\u0440\u044B\u0442: +120 \u0434\u0435\u0442\u0430\u043B\u0435\u0439, +1 \u044F\u0434\u0440\u043E");
    });
  }
  function renderJournal() {
    const root = $("#guide-page");
    root.innerHTML = '<div class="journal-tabs" role="tablist" aria-label="\u0420\u0430\u0437\u0434\u0435\u043B\u044B \u043F\u043E\u043B\u0435\u0432\u043E\u0433\u043E \u0436\u0443\u0440\u043D\u0430\u043B\u0430">' + [["campaign", "\u041A\u0410\u041C\u041F\u0410\u041D\u0418\u042F"], ["milestones", "\u0414\u041E\u0421\u0422\u0418\u0416\u0415\u041D\u0418\u042F"], ["help", "\u041F\u0410\u041C\u042F\u0422\u041A\u0410"]].map(([id, label2]) => '<button role="tab" id="journal-tab-' + id + '" aria-controls="journal-panel" aria-selected="' + (journalTab === id) + '" tabindex="' + (journalTab === id ? "0" : "-1") + '" data-journal="' + id + '">' + label2 + "</button>").join("") + '</div><div id="journal-panel" role="tabpanel" aria-labelledby="journal-tab-' + journalTab + '"></div>';
    root.querySelectorAll("[data-journal]").forEach((b) => b.onclick = () => {
      journalTab = b.dataset.journal;
      renderJournal();
      root.querySelector('[data-journal="' + journalTab + '"]').focus();
    });
    root.querySelector(".journal-tabs").onkeydown = (e) => {
      const ids = ["campaign", "milestones", "help"], index = ids.indexOf(journalTab);
      let next;
      if (e.key === "ArrowRight") next = (index + 1) % 3;
      else if (e.key === "ArrowLeft") next = (index + 2) % 3;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = 2;
      else return;
      e.preventDefault();
      journalTab = ids[next];
      renderJournal();
      root.querySelector('[data-journal="' + journalTab + '"]').focus();
    };
    const panel = $("#journal-panel");
    if (journalTab === "campaign") renderCampaignJournal(panel, save, (i) => {
      selected = i;
      navigate("map");
    }, (i) => {
      selected = i;
      navigate("raids");
    });
    else if (journalTab === "milestones") renderMilestones(panel, api, toast, refresh);
    else panel.innerHTML = `<div class="journal"><span class="eyebrow">\u041F\u041E\u041B\u0415\u0412\u041E\u0415 \u0420\u0423\u041A\u041E\u0412\u041E\u0414\u0421\u0422\u0412\u041E</span><h2>\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0433\u043E\u0440\u043E\u0434 \u0436\u0438\u0432\u044B\u043C</h2><h3>\u0412\u044B\u0431\u0435\u0440\u0438 \u0441\u0432\u043E\u0439 \u0440\u0438\u0441\u043A</h3><p>\u0420\u0430\u0437\u0432\u0435\u0434\u043A\u0430 \u0441\u0442\u043E\u0438\u0442 6 \u044D\u043D\u0435\u0440\u0433\u0438\u0438 \u0438 \u0441\u043D\u0438\u0436\u0430\u0435\u0442 \u0443\u0433\u0440\u043E\u0437\u0443. \u0417\u0430\u0447\u0438\u0441\u0442\u043A\u0430 \u2014 8. \u041F\u0440\u043E\u0440\u044B\u0432 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0441 5 \u0443\u0440\u043E\u0432\u043D\u044F \u0438 \u0441\u0442\u043E\u0438\u0442 12 \u044D\u043D\u0435\u0440\u0433\u0438\u0438: \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0435 \u0441\u0438\u043B\u044C\u043D\u0435\u0435, \u043D\u0430\u0433\u0440\u0430\u0434\u0430 \u0432\u044B\u0448\u0435. \u041A\u0430\u0436\u0434\u044B\u0439 \u0440\u0435\u0436\u0438\u043C \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442 \u0442\u0440\u0438 \u0432\u043E\u043B\u043D\u044B \u0438 \u0437\u0430\u0441\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u0442 \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0443 \u0440\u0430\u0439\u043E\u043D\u0430.</p><h3>\u0427\u0438\u0442\u0430\u0439 \u043F\u0440\u043E\u0442\u0438\u0432\u043D\u0438\u043A\u0430</h3><p>\u041F\u0435\u0440\u0435\u0434 \u0443\u0434\u0430\u0440\u043E\u043C \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u043E\u0433\u043E \u043D\u0430 \u0437\u0435\u043C\u043B\u0435 \u043F\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0437\u043E\u043D\u0430 \u0430\u0442\u0430\u043A\u0438. \u0412\u044B\u0439\u0434\u0438 \u0438\u0437 \u043D\u0435\u0451 \u0431\u0435\u0433\u043E\u043C. \u0425\u043E\u0434\u043E\u043A\u0438 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u044B, \u0431\u0435\u0433\u0443\u043D\u044B \u0434\u043E\u0433\u043E\u043D\u044F\u044E\u0442, \u0433\u0440\u043E\u043C\u0438\u043B\u044B \u0431\u044C\u044E\u0442 \u043F\u043E \u0431\u043E\u043B\u044C\u0448\u0435\u0439 \u043F\u043B\u043E\u0449\u0430\u0434\u0438. \u0423\u0441\u043B\u043E\u0432\u0438\u044F \u0440\u0430\u0439\u043E\u043D\u0430 \u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F \u0432 \u043F\u043E\u043B\u043D\u043E\u0447\u044C \u041C\u0421\u041A; \u043F\u0435\u0440\u0432\u044B\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B \u0432\u0441\u0435\u0433\u0434\u0430 \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u044B\u0439.</p><h3>\u041D\u0435 \u0434\u0430\u0439 \u0441\u0435\u0431\u044F \u043E\u043A\u0440\u0443\u0436\u0438\u0442\u044C</h3><p>\u041E\u0442\u043F\u043E\u0440 \u043E\u0442\u0442\u0430\u043B\u043A\u0438\u0432\u0430\u0435\u0442 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0445 \u0432\u0440\u0430\u0433\u043E\u0432 \u0438 \u043F\u0440\u0435\u0440\u044B\u0432\u0430\u0435\u0442 \u0438\u0445 \u0443\u0434\u0430\u0440 \u0431\u0435\u0437 \u043D\u0430\u043D\u0435\u0441\u0435\u043D\u0438\u044F \u0443\u0440\u043E\u043D\u0430. \u041D\u0430\u0436\u043C\u0438 Q \u0438\u043B\u0438 \u0431\u043E\u0435\u0432\u0443\u044E \u043A\u043D\u043E\u043F\u043A\u0443: 35 \u0432\u044B\u043D\u043E\u0441\u043B\u0438\u0432\u043E\u0441\u0442\u0438, \u043F\u0435\u0440\u0435\u0440\u044B\u0432 9 \u0441\u0435\u043A\u0443\u043D\u0434. \u0412 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u043B\u0435\u0432\u0448\u0435\u0439 \u0438 \u043A\u0440\u0443\u043F\u043D\u044B\u0435 \u043A\u043D\u043E\u043F\u043A\u0438.</p><h3>\u0421\u043E\u0445\u0440\u0430\u043D\u0438 \u043F\u0440\u0438\u043F\u0430\u0441\u044B</h3><p>\u0414\u0435\u0442\u0430\u043B\u0438 \u0432\u044B\u043F\u0430\u0434\u0430\u044E\u0442 \u0441 \u0448\u0430\u043D\u0441\u043E\u043C 33%. \u0410\u043F\u0442\u0435\u0447\u043A\u0438 \u2014 \u0441 \u0448\u0430\u043D\u0441\u043E\u043C 5%, \u043D\u0435 \u0431\u043E\u043B\u044C\u0448\u0435 \u0434\u0432\u0443\u0445 \u0437\u0430 \u0432\u044B\u043B\u0430\u0437\u043A\u0443; \u043F\u0440\u0438 \u043F\u043E\u043B\u043D\u043E\u043C \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u043E\u043D\u0438 \u043D\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u0443\u044E\u0442\u0441\u044F. \u041E\u0442\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 35% \u043D\u0430\u0439\u0434\u0435\u043D\u043D\u044B\u0445 \u0434\u0435\u0442\u0430\u043B\u0435\u0439. \u0411\u043E\u043D\u0443\u0441 \u041F\u0440\u043E\u0440\u044B\u0432\u0430 \u0432\u044B\u0434\u0430\u0451\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0437\u0430 \u043F\u043E\u0431\u0435\u0434\u0443.</p><h3>\u041E\u0431\u044A\u0435\u0434\u0438\u043D\u044F\u0439\u0441\u044F</h3><p>\u041F\u043E\u0441\u043B\u0435 \u0442\u0440\u0451\u0445 \u0437\u0430\u0447\u0438\u0441\u0442\u043E\u043A \u0438 \u043D\u0443\u0436\u043D\u043E\u0433\u043E \u0443\u0440\u043E\u0432\u043D\u044F \u043E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u0431\u043E\u0441\u0441. \u041D\u0430 \u0438\u0433\u0440\u043E\u043A\u0430 \u2014 \u043E\u0434\u0438\u043D \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0440\u0435\u0439\u0434. \u0423\u0440\u043E\u043D \u0434\u043E 300 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u0441\u0443\u043C\u043C\u0438\u0440\u0443\u0435\u0442\u0441\u044F, \u0434\u0430\u0436\u0435 \u0435\u0441\u043B\u0438 \u043E\u043D\u0438 \u0430\u0442\u0430\u043A\u0443\u044E\u0442 \u0432 \u0440\u0430\u0437\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F. \u0414\u0440\u0443\u0437\u044C\u044F VK \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u0443\u044E\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u0430. \u0422\u041E\u041F \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u044B\u0435 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u044B VK.</p><h3>\u041E\u0441\u0442\u0430\u0432\u044C \u0441\u043B\u0435\u0434 \u0432 \u0433\u043E\u0440\u043E\u0434\u0435</h3><p>\u0412 \u0436\u0443\u0440\u043D\u0430\u043B\u0435 \u2014 \u043C\u0430\u0440\u0448\u0440\u0443\u0442 \u0432\u043E\u0441\u044C\u043C\u0438 \u0440\u0430\u0439\u043E\u043D\u043E\u0432 \u0438 14 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u044B\u0445 \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0439. \u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0431\u0435\u0440\u0451\u0442\u0441\u044F \u0438\u0437 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0444\u0438\u043B\u044F; \u043A\u0430\u0436\u0434\u0443\u044E \u043D\u0430\u0433\u0440\u0430\u0434\u0443 \u043C\u043E\u0436\u043D\u043E \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043E\u0434\u0438\u043D \u0440\u0430\u0437. \u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F \u043D\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u044E\u0442 XP.</p><h3>\u0426\u0435\u043B\u044C \u043D\u0430 \u043A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C</h3><p>\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0439 \u0440\u0430\u0439\u043E\u043D\u044B, \u0441\u043E\u0431\u0438\u0440\u0430\u0439 \u0441\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u0438 \u043F\u043E\u043C\u043E\u0433\u0430\u0439 \u043E\u0442\u0440\u044F\u0434\u0443. \u041F\u0440\u0438\u043A\u0430\u0437\u044B \u0443\u0431\u0435\u0436\u0438\u0449\u0430 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E\u0442\u0441\u044F \u0441 3 \u0443\u0440\u043E\u0432\u043D\u044F. \u041D\u0430\u0433\u0440\u0430\u0434\u044B \u0432\u044B\u0434\u0430\u044E\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u0432 \u0434\u0435\u043D\u044C, \u043F\u0440\u043E\u043F\u0443\u0441\u043A\u0438 \u043D\u0435 \u043E\u0442\u043D\u0438\u043C\u0430\u044E\u0442 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441. \u041F\u041A \u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442 \u043E\u0434\u0438\u043D \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u043F\u0440\u0438 \u0432\u0445\u043E\u0434\u0435 \u0447\u0435\u0440\u0435\u0437 \u0442\u043E\u0442 \u0436\u0435 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 VK.</p></div>`;
  }
  function navigate(p) {
    page = p;
    document.querySelectorAll(".page").forEach((el) => el.hidden = el.id !== `${p}-page`);
    document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("active", b.dataset.page === p));
    $("#page-title").textContent = { map: "\u041A\u0430\u0440\u0442\u0430 \u0433\u043E\u0440\u043E\u0434\u0430", gear: "\u0421\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u0435", garage: "\u0413\u0430\u0440\u0430\u0436", daily: "\u041A\u043E\u043D\u0442\u0440\u0430\u043A\u0442\u044B", guide: "\u041F\u043E\u043B\u0435\u0432\u043E\u0439 \u0436\u0443\u0440\u043D\u0430\u043B", raids: "\u0420\u0435\u0439\u0434-\u0431\u043E\u0441\u0441\u044B", leaderboard: "\u0422\u041E\u041F \u0438\u0433\u0440\u043E\u043A\u043E\u0432", friends: "\u0414\u0440\u0443\u0437\u044C\u044F", conflict: "\u0424\u0440\u043E\u043D\u0442", clans: "\u041A\u043B\u0430\u043D\u044B", settings: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" }[p];
    renderPage();
    $("main").scrollTop = 0;
    if (p === "daily") bindAd($("#daily-page"), api, toast, refresh);
  }
  async function startArena(practice = false, map = ((_a2) => (_a2 = raid == null ? void 0 : raid.map) != null ? _a2 : selected)()) {
    if (!practice && (raid == null ? void 0 : raid.arenaVersion) !== 1) throw new Error("\u0421\u0435\u0440\u0432\u0435\u0440 \u0430\u0440\u0435\u043D\u044B \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0435\u0442\u0441\u044F. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u043F\u043E\u0437\u0436\u0435.");
    let artTimer, art3;
    try {
      art3 = await Promise.race([loadArenaArt(map), new Promise((_, reject) => {
        artTimer = setTimeout(() => reject(new Error("\u0413\u0440\u0430\u0444\u0438\u043A\u0430 \u0430\u0440\u0435\u043D\u044B \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0430\u0441\u044C. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.")), 2e4);
      })]);
    } finally {
      clearTimeout(artTimer);
    }
    let ticket, contract, st, weapon;
    if (practice) {
      contract = arenaContract(save, map);
      st = stats(save);
      weapon = save.weapon;
    } else {
      const response = await api("raids/" + raid.id + "/attack", { arena: "start" });
      ticket = response.arena;
      raid = response.raid;
      contract = ticket.contract;
      st = ticket.stats;
      weapon = ticket.weapon;
    }
    run = { kind: "arena", practice, ticket: ticket == null ? void 0 : ticket.id, arenaRaidId: raid == null ? void 0 : raid.id, contract, art: art3, weapon, plan: { name: "\u0410\u0440\u0435\u043D\u0430", cost: practice ? 0 : ARENA.cost, condition: { name: ARENA.name } }, rank: expeditionRank(save), map, hp: st.hp, maxHp: st.hp, x: 300, y: 430, face: 1, time: 0, wave: 1, enemies: [], shots: [], drops: [], particles: [], kills: 0, loot: 0, hits: 0, repulses: 0, repulseAt: 0, repulseVisual: 0, healthDropped: 0, shotCd: 0.2, stamina: 100, exhausted: false, running: false, anim: 0, moving: false, travel: 0, transition: null, invulnerable: 0, paused: false, ended: false, boss: true, damage: st.damage, speed: st.speed, lootMult: 0, rawDamage: 0, arenaStage: 0, sharedHp: (raid == null ? void 0 : raid.hp) || raidProfile(map).hp, sharedMaxHp: (raid == null ? void 0 : raid.maxHp) || raidProfile(map).hp };
    const r = run, b = enemyStats(map, 1, "boss", r.rank);
    r.enemies = [{ x: 650, y: 430, type: "boss", hp: 1e9, maxHp: 1e9, cd: 2, flash: 0, attack: null, damage: b.damage, exposedUntil: 0 }];
    bg.getContext("2d").drawImage(art3.floor, 0, 0, 960, 600);
    keys.clear();
    setSprint(false);
    stick = { x: 0, y: 0 };
    document.body.classList.add("in-battle");
    $(".app").inert = true;
    $("#game").classList.add("arena-run");
    $("#game").hidden = false;
    $("#overlay").hidden = true;
    $("#battle-location").textContent = ARENA.name.toUpperCase();
    $("#boss-name").textContent = MAPS[map].boss + (practice ? " \xB7 \u0422\u0420\u0415\u041D\u0418\u0420\u041E\u0412\u041A\u0410" : " \xB7 \u041E\u0411\u0429\u0418\u0419 \u0420\u0415\u0419\u0414");
    canvas.focus();
    updateHud();
  }
  function arenaSupport(r, stage) {
    for (let i = 0; i < 2; i++) {
      const type = stage === 2 ? "runner" : "walker", st = enemyStats(r.map, 1, type, r.rank);
      r.enemies.push({ x: i ? 870 : 90, y: 350 + i * 135, type, ...st, hp: st.hp * 0.6, maxHp: st.hp * 0.6, damage: st.damage * 0.6, cd: 1.6, flash: 0, attack: null });
    }
  }
  async function start() {
    if (!unlocked(save, selected)) return;
    let data = await api("run/start", { map: selected, mode: sortieMode });
    let st = stats(save);
    run = { ticket: data.ticket, plan: data.plan || sortiePlan(save, selected, sortieMode), rank: expeditionRank(save), map: selected, hp: st.hp, maxHp: st.hp, x: 430, y: 410, face: 1, time: 0, wave: 0, enemies: [], shots: [], drops: [], particles: [], kills: 0, loot: 0, hits: 0, repulses: 0, repulseAt: 0, repulseVisual: 0, healthDropped: 0, shotCd: 0.2, stamina: 100, exhausted: false, running: false, anim: 0, moving: false, travel: 0, transition: null, invulnerable: 0, paused: false, ended: false, next: 1, boss: false, damage: st.damage, speed: st.speed, lootMult: st.loot };
    $("#game").classList.remove("arena-run");
    background(bg.getContext("2d"), selected);
    sprintHeld = false;
    keys.clear();
    setSprint(false);
    stick = { x: 0, y: 0 };
    document.body.classList.add("in-battle");
    $(".app").inert = true;
    $("#game").hidden = false;
    $("#overlay").hidden = true;
    $("#boss-hud").hidden = true;
    $("#battle-location").textContent = MAPS[selected].name.toUpperCase();
    $("#wave-label").textContent = "\u041F\u0415\u0420\u0418\u041C\u0415\u0422\u0420 \xB7 \u0413\u041E\u0422\u041E\u0412\u042C\u0421\u042F";
    canvas.focus();
    updateHud();
  }
  function spawnWave() {
    let r = run;
    r.wave++;
    if (r.wave <= 3) {
      let n = 5 + r.wave * 2 + r.map;
      for (let i = 0; i < n; i++) {
        let type = sortieEnemyType(i, r.plan.condition);
        spawn(type, i);
      }
      $("#wave-label").textContent = `\u0412\u041E\u041B\u041D\u0410 ${r.wave} / 3`;
    } else {
      finish(true);
    }
  }
  function spawn(type, i) {
    let r = run, side = i % 4;
    let x = side === 0 ? 30 : side === 1 ? 930 : 100 + Math.random() * 760, y = side === 2 ? 260 : side === 3 ? 540 : 285 + Math.random() * 220;
    let st = sortieEnemy(enemyStats(r.map, Math.min(r.wave, 3), type, r.rank), type, r.plan);
    r.enemies.push({ x, y, type, ...st, maxHp: st.hp, cd: 1.8, flash: 0, attack: null });
  }
  function repulse() {
    if (!repel(run)) return;
    run.repulseVisual = 0.3;
    burst(run.x, run.y, "#d9bf80", 12);
    updateHud(true);
  }
  function setSprint(value) {
    sprintHeld = value;
    $("#dash").classList.toggle("running", value);
  }
  function advanceSection(dt) {
    let r = run, tr = r.transition;
    tr.elapsed += dt;
    let f = Math.min(1, tr.elapsed / 2.4), smooth = f * f * (3 - 2 * f);
    r.travel = tr.start + 960 * smooth;
    r.x = tr.x + (190 - tr.x) * smooth;
    r.anim += dt * 1.8;
    r.moving = true;
    r.running = true;
    if (f === 1) {
      r.transition = null;
      r.moving = false;
      r.running = false;
      spawnWave();
    }
    updateHud();
  }
  function beginSection() {
    let r = run;
    for (let d of r.drops) if (d.kind === "scrap") r.loot += d.amount;
    r.drops = [];
    r.shots = [];
    r.next = 1.8;
    r.face = 1;
    r.transition = { elapsed: 0, start: r.travel, x: r.x };
    $("#wave-label").textContent = "\u041F\u0415\u0420\u0415\u0425\u041E\u0414 \u041A \u0412\u041E\u041B\u041D\u0415 " + (r.wave + 1);
  }
  function movement() {
    return [(keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) + stick.x, (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) + stick.y];
  }
  function joystick(e) {
    if (e.pointerId !== pointer) return;
    let b = joy.getBoundingClientRect(), x = (e.clientX - b.left - b.width / 2) / (b.width * 0.36), y = (e.clientY - b.top - b.height / 2) / (b.height * 0.36), l = Math.max(1, Math.hypot(x, y));
    const magnitude = Math.hypot(x, y), strength = magnitude < 0.12 ? 0 : Math.min(1, (magnitude - 0.12) / 0.88);
    stick = { x: magnitude ? x / magnitude * strength : 0, y: magnitude ? y / magnitude * strength : 0 };
    const travel = b.width * 0.28;
    joy.firstElementChild.style.transform = `translate(${stick.x * travel}px,${stick.y * travel}px)`;
  }
  function pause() {
    var _a2;
    if (!run || run.ended) return;
    run.paused = !run.paused;
    pointer = null;
    joy.firstElementChild.style.transform = "";
    keys.clear();
    setSprint(false);
    stick = { x: 0, y: 0 };
    updateHud(true);
    $("#overlay").hidden = !run.paused;
    if (run.paused) {
      (_a2 = $("#battle-report")) == null ? void 0 : _a2.remove();
      $("#result-tag").textContent = "\u0421\u0412\u042F\u0417\u042C \u0421 \u0423\u0411\u0415\u0416\u0418\u0429\u0415\u041C";
      $("#result-title").textContent = "\u041F\u0435\u0440\u0435\u0434\u044B\u0448\u043A\u0430";
      $("#result-text").textContent = run.kind === "arena" ? run.practice ? "\u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430 \u043F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430. \u042D\u043D\u0435\u0440\u0433\u0438\u044F \u0438 \u043D\u0430\u0433\u0440\u0430\u0434\u044B \u043D\u0435 \u043D\u0430\u0447\u0438\u0441\u043B\u044F\u044E\u0442\u0441\u044F." : "\u0411\u043E\u0439 \u043F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D. \u041F\u0440\u0438 \u043E\u0442\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0438 \u043D\u0430\u043D\u0435\u0441\u0451\u043D\u043D\u044B\u0439 \u0443\u0440\u043E\u043D \u0431\u0443\u0434\u0435\u0442 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0432 \u043E\u0431\u0449\u0438\u0439 \u0440\u0435\u0439\u0434." : "\u0412\u044B\u043B\u0430\u0437\u043A\u0430 \u043F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430.\n\u041E\u0442\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442 35% \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u043D\u043D\u044B\u0445 \u0434\u0435\u0442\u0430\u043B\u0435\u0439.";
      $("#result-actions").innerHTML = '<button class="primary" id="resume">\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C</button><button class="secondary" id="retreat">\u041E\u0442\u0441\u0442\u0443\u043F\u0438\u0442\u044C</button>';
      $("#resume").onclick = pause;
      $("#retreat").onclick = () => finish(false);
    } else canvas.focus();
  }
  function burst(x, y, color, n = 5) {
    if (!prefs.particles) return;
    for (let i = 0; i < n; i++) run.particles.push({ x, y: y - 20, vx: (Math.random() - 0.5) * 130, vy: (Math.random() - 0.5) * 100, life: 0.4, color });
  }
  function update(dt) {
    var _a2;
    let r = run;
    if (!r || r.paused || r.ended) return;
    r.time += dt;
    r.repulseVisual = Math.max(0, r.repulseVisual - dt);
    if (r.transition) {
      advanceSection(dt);
      return;
    }
    r.invulnerable = Math.max(0, r.invulnerable - dt);
    let [dx, dy] = movement(), len = Math.max(1, Math.hypot(dx, dy));
    r.moving = Math.hypot(dx, dy) > 0.05;
    let sprint = sprintStep(r.stamina, r.exhausted, sprintHeld, r.moving, dt);
    Object.assign(r, sprint);
    r.anim += r.moving ? dt * (r.running ? 1.75 : 1) : 0;
    r.x = Math.max(25, Math.min(935, r.x + dx / len * r.speed * sprint.multiplier * dt));
    r.y = Math.max(r.kind === "arena" ? 315 : 275, Math.min(535, r.y + dy / len * r.speed * 0.8 * sprint.multiplier * dt));
    if (dx) r.face = dx > 0 ? 1 : -1;
    if (r.kind !== "arena" && !r.enemies.length) {
      r.next -= dt;
      if (r.next <= 0) {
        if (r.wave >= 3) {
          finish(true);
          return;
        }
        if (r.wave > 0) {
          beginSection();
          return;
        }
        spawnWave();
        r.next = 1.8;
      }
    }
    let weapon = WEAPONS[(_a2 = r.weapon) != null ? _a2 : save.weapon];
    r.shotCd -= dt;
    let target = r.enemies.filter((e) => Math.hypot(e.x - r.x, e.y - r.y) < weapon.range).sort((a, b) => Math.hypot(a.x - r.x, a.y - r.y) - Math.hypot(b.x - r.x, b.y - r.y))[0];
    if (target && r.shotCd <= 0) {
      r.face = target.x > r.x ? 1 : -1;
      let angle = Math.atan2(target.y - r.y, target.x - r.x);
      for (let j = 0; j < (weapon.pellets || 1); j++) {
        let a = angle + (j - ((weapon.pellets || 1) - 1) / 2) * 0.115;
        r.shots.push({ x: r.x + r.face * 14, y: r.y - 55, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, life: weapon.range / 620, damage: r.damage });
      }
      r.shotCd = weapon.rate;
      burst(r.x + r.face * 26, r.y - 2, "#ffe1a0", 3);
    }
    if (r.kind === "arena") {
      const stage = arenaPhase(r.time);
      if (stage > r.arenaStage) {
        r.arenaStage = stage;
        arenaSupport(r, stage);
      }
    }
    for (let e of r.enemies) {
      if (r.kind === "arena" && e.type === "boss") {
        updateArenaBoss(r, e, dt);
        continue;
      }
      e.cd -= dt;
      e.flash = Math.max(0, e.flash - dt);
      let dist = Math.hypot(e.x - r.x, e.y - r.y) || 1;
      if (e.type === "boss" && e.cd <= 0 && !e.attack) {
        e.attack = { x: r.x, y: r.y, t: 1.1, radius: 55 + r.map * 5 };
        e.cd = 4.8 - r.map * 0.3;
      }
      if (e.attack) {
        e.attack.t -= dt;
        if (e.attack.t <= 0) {
          if (Math.hypot(e.attack.x - r.x, e.attack.y - r.y) < e.attack.radius && r.invulnerable <= 0) {
            r.hp -= e.damage * (e.type === "boss" ? 1.6 : 1);
            r.hits++;
            r.invulnerable = 0.65;
          }
          burst(e.attack.x, e.attack.y, "#d2a270", 18);
          if (e.type === "boss" && r.map === 3) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.03);
          if (e.type === "boss" && r.map === 4 && r.enemies.length < 9) spawn("runner", Math.floor(r.time));
          e.attack = null;
        }
      } else if (dist > 22) {
        e.x += (r.x - e.x) / dist * e.speed * dt;
        e.y += (r.y - e.y) / dist * e.speed * 0.8 * dt;
      }
      if (e.type !== "boss" && dist < 40 && e.cd <= 0 && !e.attack) {
        e.attack = { x: r.x, y: r.y, t: e.type === "runner" ? 0.38 : 0.65, radius: e.type === "tank" ? 42 : 30 };
        e.cd = e.type === "runner" ? 1.4 : 2;
      }
    }
    for (let s of r.shots) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      for (let e of r.enemies) {
        if (e.hp <= 0) continue;
        if (Math.hypot(e.x - s.x, e.y - 55 - s.y) < (e.type === "boss" ? 29 : 18)) {
          const hit = s.damage * (r.kind === "arena" && e.type === "boss" ? arenaHitMultiplier(r, e) : 1);
          e.hp -= hit;
          if (r.kind === "arena" && e.type === "boss") r.rawDamage += hit;
          e.flash = 0.1;
          s.life = 0;
          burst(e.x, e.y, "#c6c2a1", 3);
          break;
        }
      }
    }
    r.shots = r.shots.filter((s) => s.life > 0);
    let dead = r.enemies.filter((e) => e.hp <= 0);
    for (let e of dead) {
      r.kills++;
      const drop = r.kind === "arena" ? { scrap: 0, health: false } : expeditionDrop(Math.random, r.healthDropped);
      if (drop.scrap) r.drops.push({ x: e.x, y: e.y, kind: "scrap", amount: drop.scrap });
      if (drop.health) {
        r.healthDropped++;
        r.drops.push({ x: e.x + 14, y: e.y + 8, kind: "health" });
      }
      burst(e.x, e.y, "#657554", 8);
    }
    r.enemies = r.enemies.filter((e) => e.hp > 0);
    for (let d of r.drops) {
      if (Math.hypot(d.x - r.x, d.y - r.y) < 33) {
        if (d.kind === "health") {
          if (r.hp >= r.maxHp) continue;
          r.hp = Math.min(r.maxHp, r.hp + EXPEDITION_LOOT.heal);
        } else r.loot += d.amount;
        d.taken = true;
      }
    }
    r.drops = r.drops.filter((d) => !d.taken);
    for (let p of r.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    r.particles = r.particles.filter((p) => p.life > 0);
    if (r.hp <= 0) finish(false);
    else if (r.kind === "arena" && r.time >= ARENA.duration) finish(true);
    updateHud();
  }
  function updateHud(force = false) {
    let r = run;
    if (!force && !r.paused && !r.ended && r.time < (r.hudAt || 0)) return;
    r.hudAt = r.time + 0.1;
    const defense = repulseStatus(r);
    $("#repulse").disabled = !defense.ready;
    $("#repulse small").textContent = defense.seconds > 0 ? Math.ceil(defense.seconds) + " \u0441\u0435\u043A" : r.stamina < REPULSE.cost ? "\u041D\u0415\u0422 \u0421\u0418\u041B" : "35 \u0432\u044B\u043D\u043E\u0441\u043B.";
    const track = $("#wave-track"), stage = r.wave + "-" + !!r.transition + "-" + r.won;
    if (track.dataset.stage !== stage) {
      track.dataset.stage = stage;
      track.innerHTML = [1, 2, 3].map((n) => '<i class="' + (n < r.wave || r.won === true || r.transition && n <= r.wave ? "done" : n === r.wave ? "current" : "") + '"></i>').join("");
    }
    $("#game").classList.toggle("critical-health", r.hp / r.maxHp < 0.25);
    $("#battle-condition").textContent = r.plan.name + " \xB7 " + r.plan.condition.name;
    $("#hp-label").textContent = `${Math.max(0, Math.ceil(r.hp))} / ${r.maxHp}`;
    $("#hp-bar").style.width = `${Math.max(0, r.hp / r.maxHp * 100)}%`;
    $("#kill-label").textContent = `${r.kills} \u0423\u0421\u0422\u0420\u0410\u041D\u0415\u041D\u041E \xB7 ${r.loot} \u0414\u0415\u0422.`;
    const dashLabel = r.exhausted ? "\u041E\u0422\u0414\u042B\u0425" : r.running ? "\u0411\u0415\u0413" : "\u0411\u0415\u0416\u0410\u0422\u042C", dashState = dashLabel + Math.ceil(r.stamina);
    if ($("#dash").dataset.state !== dashState) {
      $("#dash").dataset.state = dashState;
      $("#dash").innerHTML = shelterIcon("run") + dashLabel + "<small>" + Math.ceil(r.stamina) + "%</small>";
    }
    $("#dash").disabled = r.paused || r.ended;
    $("#stamina-fill").style.width = r.stamina + "%";
    $("#section-count").textContent = "\u0423\u0427\u0410\u0421\u0422\u041E\u041A " + Math.max(1, r.wave) + " / 3";
    let boss = r.enemies.find((e) => e.type === "boss");
    $("#boss-hud").hidden = !boss;
    if (boss) $("#boss-bar").style.width = `${Math.max(0, boss.hp / boss.maxHp * 100)}%`;
    if (r.kind === "arena") {
      const pressure = Math.min(100, r.rawDamage / r.contract.target * 100), seconds = Math.max(0, Math.ceil(ARENA.duration - r.time));
      $("#wave-label").textContent = ARENA_PHASES[arenaPhase(r.time)] + " \xB7 " + seconds + " \u0441\u0435\u043A";
      $("#battle-condition").textContent = r.practice ? "\u0411\u0415\u0421\u041F\u041B\u0410\u0422\u041D\u0410\u042F \u0422\u0420\u0415\u041D\u0418\u0420\u041E\u0412\u041A\u0410" : MAPS[r.map].boss + " \xB7 12 \u044D\u043D\u0435\u0440\u0433\u0438\u0438";
      $("#section-count").textContent = (boss == null ? void 0 : boss.exposedUntil) > r.time ? "\u0411\u041E\u0421\u0421 \u0423\u042F\u0417\u0412\u0418\u041C \xB7 \u0410\u0422\u0410\u041A\u0423\u0419" : "\u041F\u041E\u0421\u041B\u0415 \u0423\u0414\u0410\u0420\u0410 \u0411\u041E\u0421\u0421 \u0423\u042F\u0417\u0412\u0418\u041C";
      $("#kill-label").textContent = r.practice ? "\u041D\u0410\u041F\u041E\u0420 " + Math.floor(pressure) + "% \xB7 \u0411\u0415\u0417 \u041D\u0410\u0413\u0420\u0410\u0414" : "\u0412\u041A\u041B\u0410\u0414 ~" + arenaContribution(r.contract, r.rawDamage, r.time) + " / " + r.contract.cap;
      $("#boss-bar").style.width = (r.practice ? pressure : Math.max(0, r.sharedHp / r.sharedMaxHp * 100)) + "%";
      $("#boss-name").textContent = MAPS[r.map].boss + (r.practice ? " \xB7 \u041D\u0410\u041F\u041E\u0420" : " \xB7 " + raidNumber(r.sharedHp) + " HP");
    }
  }
  function draw() {
    if (!run || $("#game").hidden) return;
    let r = run;
    const offset = r.travel % 960, section = Math.floor(r.travel / 960);
    for (let tile = 0; tile < 2; tile++) {
      let tx = tile * 960 - offset;
      g.save();
      g.translate(tx, 0);
      if ((section + tile) % 2) {
        g.translate(960, 0);
        g.scale(-1, 1);
      }
      g.drawImage(bg, 0, 0);
      g.restore();
    }
    if (r.transition) {
      g.fillStyle = "#14201490";
      g.fillRect(300, 200, 360, 42);
      g.fillStyle = "#edbd7c";
      g.font = "17px monospace";
      g.textAlign = "center";
      g.fillText("\u0423\u0427\u0410\u0421\u0422\u041E\u041A \u0417\u0410\u0427\u0418\u0429\u0415\u041D \u2192", 480, 227);
      g.textAlign = "left";
    }
    for (let e of r.enemies) {
      if (e.attack && r.kind === "arena" && e.type === "boss") {
        drawArenaStrike(g, e.attack);
      } else if (e.attack) {
        g.fillStyle = "#c8764240";
        g.strokeStyle = "#ebaa68";
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(e.attack.x, e.attack.y, e.attack.radius, e.attack.radius * 0.6, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.fillStyle = "#e7ba8a";
        g.font = "11px monospace";
        g.fillText("\u0423\u0425\u041E\u0414\u0418!", e.attack.x - 20, e.attack.y + 4);
      }
    }
    for (let d of r.drops) loot(g, d.x, d.y, d.kind, r.time, d.amount || 0);
    if (r.repulseVisual > 0) {
      g.strokeStyle = "#e6cf99";
      g.globalAlpha = r.repulseVisual / 0.3;
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(r.x, r.y, REPULSE.radius * (1 - r.repulseVisual / 0.3), REPULSE.radius * 0.6 * (1 - r.repulseVisual / 0.3), 0, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
    }
    let actors = [...r.enemies, { x: r.x, y: r.y, type: "hero" }].sort((a, b) => a.y - b.y);
    for (let e of actors) {
      let hero = e.type === "hero", scale = e.type === "boss" ? 2 : 1.15;
      if (hero && r.invulnerable > 0 && Math.floor(r.time * 20) % 2) continue;
      if (r.kind === "arena" && e.type === "boss") drawArenaBoss(g, r.art.boss, e, r.time, e.x > r.x ? 1 : -1);
      else person(g, e.x, e.y, e.type, scale, hero ? r.anim : r.time, hero ? r.face : e.x > r.x ? -1 : 1, e.flash, hero ? r.moving : true, hero ? r.running : e.type === "runner");
      if (!hero && e.type !== "boss" && e.hp < e.maxHp) {
        g.fillStyle = "#334332";
        g.fillRect(e.x - 16, e.y - 70 * scale, 32, 3);
        g.fillStyle = "#bec592";
        g.fillRect(e.x - 16, e.y - 70 * scale, 32 * e.hp / e.maxHp, 3);
      }
    }
    for (let s of r.shots) {
      g.fillStyle = "#ffdda1";
      g.fillRect(s.x, s.y, 7, 3);
    }
    for (let p of r.particles) {
      g.globalAlpha = p.life / 0.4;
      g.fillStyle = p.color;
      g.fillRect(p.x, p.y, 3, 3);
    }
    g.globalAlpha = 1;
  }
  function showBattleReport(r, result) {
    var _a2;
    (_a2 = $("#battle-report")) == null ? void 0 : _a2.remove();
    const report = battleReport(r), panel = document.createElement("div");
    panel.id = "battle-report";
    panel.innerHTML = '<div class="report-mode">' + r.plan.name + " \xB7 " + r.plan.condition.name + " \xB7 " + report.energy + ' \u044D\u043D\u0435\u0440\u0433\u0438\u0438</div><div class="battle-report">' + [[report.duration, "\u0412\u0420\u0415\u041C\u042F"], [report.kills, "\u0417\u0410\u0420\u0410\u0416\u0401\u041D\u041D\u042B\u0425"], [report.hits, "\u041F\u041E\u041F\u0410\u0414\u0410\u041D\u0418\u0419"], [report.repulses, "\u041E\u0422\u041F\u041E\u0420"]].map(([value, label2]) => "<div><b>" + value + "</b><small>" + label2 + "</small></div>").join("") + '</div><div class="report-reward"><span>+' + result.reward + "<small>\u0414\u0415\u0422\u0410\u041B\u0415\u0419</small></span><span>+" + result.xp + "<small>\u041E\u041F\u042B\u0422\u0410</small></span></div>";
    $("#result-text").after(panel);
  }
  function leaveRun() {
    var _a2, _b2;
    $("#game").hidden = true;
    $("#overlay").hidden = true;
    (_a2 = $("#battle-report")) == null ? void 0 : _a2.remove();
    document.body.classList.remove("in-battle");
    $(".app").inert = false;
    $("#game").classList.remove("critical-health", "arena-run");
    run = null;
    pointer = null;
    joy.firstElementChild.style.transform = "";
    keys.clear();
    setSprint(false);
    stick = { x: 0, y: 0 };
    refresh();
    const menu = $("#landscape-menu");
    (_b2 = getComputedStyle(menu).display !== "none" ? menu : $("nav button.active")) == null ? void 0 : _b2.focus({ preventScroll: true });
  }
  async function finish(win) {
    if (run.kind === "arena") return finishArena(win);
    let r = run;
    if (r.ended) return;
    r.ended = true;
    r.won = win;
    r.paused = false;
    updateHud();
    if (win) r.loot += r.drops.filter((d) => d.kind === "scrap").reduce((a, d) => a + d.amount, 0);
    $("#overlay").hidden = false;
    $("#result-tag").textContent = "\u0421\u0412\u042F\u0417\u042C \u0421 \u0423\u0411\u0415\u0416\u0418\u0429\u0415\u041C";
    $("#result-title").textContent = "\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u0438\u0435\u2026";
    $("#result-text").textContent = "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u043C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0432\u044B\u043B\u0430\u0437\u043A\u0438 \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435.";
    $("#result-actions").innerHTML = "";
    const submit = async () => {
      try {
        let result = await api("run/end", { ticket: r.ticket, win, kills: r.kills, loot: r.loot });
        $("#result-tag").textContent = result.win ? "\u041F\u0420\u0418\u041F\u0410\u0421\u042B \u0414\u041E\u0421\u0422\u0410\u0412\u041B\u0415\u041D\u042B" : "\u041E\u0422\u0420\u042F\u0414 \u042D\u0412\u0410\u041A\u0423\u0418\u0420\u041E\u0412\u0410\u041D";
        $("#result-title").textContent = result.win ? "\u0420\u0430\u0439\u043E\u043D \u0437\u0430\u0447\u0438\u0449\u0435\u043D." : "\u0422\u044B \u0432\u0435\u0440\u043D\u0443\u043B\u0441\u044F \u0436\u0438\u0432\u044B\u043C.";
        $("#result-text").textContent = result.win ? "\u0417\u0430\u0447\u0438\u0441\u0442\u043E\u043A \u0440\u0430\u0439\u043E\u043D\u0430: " + save.districtRuns[r.map] + " / 3. \u0411\u043E\u0441\u0441 \u0436\u0434\u0451\u0442 \u0432 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u043C \u0440\u0435\u0439\u0434\u0435." : "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E 35% \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u043D\u043D\u044B\u0445 \u0434\u0435\u0442\u0430\u043B\u0435\u0439.";
        showBattleReport(r, result);
        $("#result-actions").innerHTML = '<button class="primary" id="return">\u0412 \u0443\u0431\u0435\u0436\u0438\u0449\u0435</button><button class="secondary" id="replay" ' + (save.energy < r.plan.cost ? "disabled" : "") + ">\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \xB7 " + r.plan.cost + " \u03DF</button>";
        $("#return").onclick = leaveRun;
        $("#replay").onclick = () => action(async () => {
          leaveRun();
          await start();
        });
      } catch (e) {
        $("#result-title").textContent = "\u041D\u0435\u0442 \u0441\u0432\u044F\u0437\u0438";
        $("#result-text").textContent = e.message;
        $("#result-actions").innerHTML = '<button class="primary" id="retry-save">\u041F\u041E\u0412\u0422\u041E\u0420\u0418\u0422\u042C \u0421\u041E\u0425\u0420\u0410\u041D\u0415\u041D\u0418\u0415</button>';
        $("#retry-save").onclick = submit;
      }
    };
    await submit();
  }
  async function finishArena(survived) {
    var _a2;
    const r = run;
    if (r.ended) return;
    r.ended = true;
    r.paused = false;
    updateHud();
    $("#overlay").hidden = false;
    (_a2 = $("#battle-report")) == null ? void 0 : _a2.remove();
    $("#result-tag").textContent = r.practice ? "\u041F\u041E\u041B\u0418\u0413\u041E\u041D \u0423\u0411\u0415\u0416\u0418\u0429\u0410" : "\u042D\u0412\u0410\u041A\u0423\u0410\u0426\u0418\u042F \u0421 \u0410\u0420\u0415\u041D\u042B";
    $("#result-title").textContent = "\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u0438\u0435\u2026";
    $("#result-text").textContent = "\u041F\u0435\u0440\u0435\u0434\u0430\u0451\u043C \u0432\u043A\u043B\u0430\u0434 \u0432 \u043E\u0431\u0449\u0438\u0439 \u0440\u0435\u0439\u0434.";
    $("#result-actions").innerHTML = "";
    const submit = async () => {
      try {
        const result = r.practice ? { damage: 0, cap: r.contract.cap } : await api("raids/" + r.arenaRaidId + "/attack", { arena: "finish", ticket: r.ticket, damage: r.rawDamage });
        if (result.raid) {
          raid = result.raid;
          r.sharedHp = raid.hp;
          updateHud(true);
        }
        $("#result-title").textContent = r.practice ? "\u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430." : result.refunded ? "\u0411\u043E\u0441\u0441 \u0443\u0436\u0435 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D." : survived ? "\u041E\u0442\u0440\u044F\u0434 \u0443\u0434\u0435\u0440\u0436\u0430\u043B \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443." : "\u0422\u044B \u044D\u0432\u0430\u043A\u0443\u0438\u0440\u043E\u0432\u0430\u043D.";
        $("#result-text").textContent = r.practice ? "\u0411\u0435\u0437 \u0440\u0430\u0441\u0445\u043E\u0434\u0430 \u044D\u043D\u0435\u0440\u0433\u0438\u0438, \u043E\u043F\u044B\u0442\u0430 \u0438 \u0434\u043E\u0431\u044B\u0447\u0438. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u0431\u043E\u0439, \u0447\u0442\u043E\u0431\u044B \u043E\u0441\u0432\u043E\u0438\u0442\u044C \u0437\u043E\u043D\u044B \u0443\u0434\u0430\u0440\u0430." : result.refunded ? "\u0414\u0440\u0443\u0433\u0438\u0435 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u0434\u043E\u0431\u0438\u043B\u0438 \u0431\u043E\u0441\u0441\u0430 \u0432\u043E \u0432\u0440\u0435\u043C\u044F \u0442\u0432\u043E\u0435\u0433\u043E \u0431\u043E\u044F. 12 \u044D\u043D\u0435\u0440\u0433\u0438\u0438 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u044B." : "\u0412 \u043E\u0431\u0449\u0438\u0439 \u0440\u0435\u0439\u0434 \u0437\u0430\u0447\u0442\u0435\u043D\u043E " + raidNumber(result.damage) + " \u0443\u0440\u043E\u043D\u0430. \u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u0432\u044B\u0434\u0430\u0451\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u043E\u0431\u0449\u0435\u0439 \u043F\u043E\u0431\u0435\u0434\u044B.";
        const report = battleReport(r), panel = document.createElement("div");
        panel.id = "battle-report";
        panel.innerHTML = '<div class="battle-report">' + [[report.duration, "\u0412\u0420\u0415\u041C\u042F"], [r.hits, "\u041F\u041E\u041F\u0410\u0414\u0410\u041D\u0418\u0419"], [Math.min(100, Math.floor(r.rawDamage / r.contract.target * 100)) + "%", "\u041D\u0410\u041F\u041E\u0420"]].map(([v, label2]) => "<div><b>" + v + "</b><small>" + label2 + "</small></div>").join("") + '</div><div class="arena-result-contribution"><span>' + (r.practice ? "\u0422\u0420\u0415\u041D\u0418\u0420\u041E\u0412\u041A\u0410" : "\u0412\u041A\u041B\u0410\u0414 \u0412 \u041E\u0411\u0429\u0423\u042E \u041F\u041E\u0411\u0415\u0414\u0423") + "</span><strong>" + raidNumber(result.damage) + "</strong><small>" + (r.practice ? "\u0411\u0435\u0437 \u043D\u0430\u0433\u0440\u0430\u0434\u044B" : "\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u0437\u0430 \u0431\u043E\u0439: " + raidNumber(result.cap)) + "</small></div>";
        $("#result-text").after(panel);
        $("#result-actions").innerHTML = '<button class="primary" id="arena-return">\u0412 \u0443\u0431\u0435\u0436\u0438\u0449\u0435</button>' + (r.practice ? '<button class="secondary" id="arena-repeat">\u0415\u0449\u0451 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430</button>' : "");
        $("#arena-return").onclick = leaveRun;
        const repeat = $("#arena-repeat");
        if (repeat) repeat.onclick = () => action(async () => {
          const map = r.map;
          leaveRun();
          await startArena(true, map);
        });
      } catch (e) {
        $("#result-title").textContent = "\u041D\u0435\u0442 \u0441\u0432\u044F\u0437\u0438";
        $("#result-text").textContent = e.message + " \u0423\u0440\u043E\u043D \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435.";
        $("#result-actions").innerHTML = '<button class="primary" id="arena-retry">\u041F\u041E\u0412\u0422\u041E\u0420\u0418\u0422\u042C \u0421\u041E\u0425\u0420\u0410\u041D\u0415\u041D\u0418\u0415</button>';
        $("#arena-retry").onclick = submit;
      }
    };
    await submit();
  }
  function frame(t) {
    let dt = Math.min((t - last) / 1e3, 0.035);
    last = t;
    update(dt);
    if (run && !$("#game").hidden) {
      draw();
      let ratio = canvas.clientWidth / Math.max(1, canvas.clientHeight), vw = Math.min(960, Math.max(240, Math.round(600 * ratio)));
      let portrait2 = vw < 960;
      let vh = Math.min(600, Math.round(vw / ratio));
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }
      let left = portrait2 ? Math.max(0, Math.min(960 - vw, run.x - vw / 2)) : 0;
      display.imageSmoothingEnabled = false;
      let top = Math.max(0, Math.min(600 - vh, run.y - vh / 2));
      if (canvas.height !== vh) canvas.height = vh;
      display.drawImage(world, left, top, vw, vh, 0, 0, vw, vh);
    }
    requestAnimationFrame(frame);
  }
  async function pollRaid() {
    if (raidPolling || document.hidden) return;
    raidPolling = true;
    const expected = raid.id;
    try {
      const updated = (await api("raids/" + expected)).raid;
      if ((raid == null ? void 0 : raid.id) === expected) {
        const changed = JSON.stringify(raid) !== JSON.stringify(updated);
        raid = updated;
        if ((run == null ? void 0 : run.kind) === "arena" && !run.practice && run.arenaRaidId === updated.id) {
          run.sharedHp = updated.hp;
          if (updated.hp <= 0 && !run.ended) finishArena(true);
        }
        if (page === "raids" && changed) renderRaids();
      }
    } catch (e) {
    } finally {
      raidPolling = false;
    }
  }
  function renderRaids() {
    const root = $("#raids-page");
    renderRaidView(root, {
      raid,
      save,
      selected,
      rareMode,
      offset: serverOffset,
      onMode: (value) => {
        if (activeRaidId) {
          toast("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u043E\u0431\u0435\u0434\u0438 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0431\u043E\u0441\u0441\u0430");
          return;
        }
        rareMode = value;
        raid = null;
        renderRaids();
        root.querySelector('[data-mode="' + (value ? "rare" : "normal") + '"]').focus({ preventScroll: true });
      },
      onMap: (value) => {
        selected = value;
        renderRaids();
      },
      onCreate: () => action(async () => {
        const created = (await api("raids", { map: selected, rare: rareMode })).raid;
        if (rareMode && !created.rare) throw new Error("\u0421\u0435\u0440\u0432\u0435\u0440 \u0435\u0449\u0451 \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0435\u0442\u0441\u044F. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u043F\u043E\u0437\u0436\u0435.");
        raid = created;
      }),
      onPrepare: () => navigate("map"),
      onArena: () => action(() => startArena(false)),
      onPractice: () => action(() => {
        var _a2;
        return startArena(true, (_a2 = raid == null ? void 0 : raid.map) != null ? _a2 : selected);
      }),
      onAttack: () => action(async () => {
        const result = await api("raids/" + raid.id + "/attack", {});
        raid = result.raid;
        toast("\u0423\u0440\u043E\u043D: " + raidNumber(result.damage));
      }),
      onJoin: () => action(async () => {
        raid = (await api("raids/" + raid.id + "/join", {})).raid;
      }),
      onClaim: () => action(async () => {
        raid = (await api("raids/" + raid.id + "/claim", {})).raid;
        toast("\u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0430");
      }),
      onClose: () => {
        if (activeRaidId) {
          action(async () => {
            raid = (await api("raids/" + activeRaidId)).raid;
          });
          return;
        }
        rareMode = !!raid.rare;
        selected = raid.map;
        raid = null;
        renderRaids();
      },
      onCopy: async () => {
        const link = inviteLink("raid", raid.id);
        try {
          await navigator.clipboard.writeText(link);
          toast("\u0421\u0441\u044B\u043B\u043A\u0430 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0430");
        } catch (e) {
          const input = document.createElement("input");
          input.value = link;
          input.readOnly = true;
          input.setAttribute("aria-label", "\u0421\u0441\u044B\u043B\u043A\u0430 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F");
          root.querySelector(".raid-controls").append(input);
          input.select();
        }
      }
    });
  }
  function renderSettings() {
    const el = $("#settings-page");
    el.innerHTML = '<div class="settings-layout"><div class="settings-card"><span class="eyebrow orange">\u0423\u041F\u0420\u0410\u0412\u041B\u0415\u041D\u0418\u0415 \u0418 \u042D\u041A\u0420\u0410\u041D</span><h2>\u041F\u043E\u0434 \u0442\u0435\u0431\u044F.</h2><p>\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u043D\u0430 \u044D\u0442\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435.</p>' + [["runToggle", "\u0411\u0435\u0433 \u043F\u043E \u043D\u0430\u0436\u0430\u0442\u0438\u044E", "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0431\u0435\u0433 \u043E\u0434\u043D\u0438\u043C \u043D\u0430\u0436\u0430\u0442\u0438\u0435\u043C \u0432\u043C\u0435\u0441\u0442\u043E \u0443\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u044F."], ["leftHanded", "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u043B\u0435\u0432\u0448\u0435\u0439", "\u0414\u0436\u043E\u0439\u0441\u0442\u0438\u043A \u0441\u043F\u0440\u0430\u0432\u0430, \u0431\u0435\u0433 \u0438 \u043E\u0442\u043F\u043E\u0440 \u0441\u043B\u0435\u0432\u0430."], ["largeControls", "\u041A\u0440\u0443\u043F\u043D\u044B\u0435 \u0431\u043E\u0435\u0432\u044B\u0435 \u043A\u043D\u043E\u043F\u043A\u0438", "\u0423\u0432\u0435\u043B\u0438\u0447\u0438\u0442\u044C \u0434\u0436\u043E\u0439\u0441\u0442\u0438\u043A \u0438 \u043A\u043D\u043E\u043F\u043A\u0438 \u0431\u043E\u044F."], ["particles", "\u042D\u0444\u0444\u0435\u043A\u0442\u044B \u043F\u043E\u043F\u0430\u0434\u0430\u043D\u0438\u0439", "\u0427\u0430\u0441\u0442\u0438\u0446\u044B \u043E\u0442 \u043F\u043E\u043F\u0430\u0434\u0430\u043D\u0438\u0439 \u0438 \u0443\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0445."], ["contrast", "\u041F\u043E\u0432\u044B\u0448\u0435\u043D\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0440\u0430\u0441\u0442", "\u0411\u043E\u043B\u0435\u0435 \u0447\u0451\u0442\u043A\u0438\u0435 \u0433\u0440\u0430\u043D\u0438\u0446\u044B \u043F\u0430\u043D\u0435\u043B\u0435\u0439 \u0438 \u044F\u0440\u043A\u0438\u0435 \u043F\u043E\u0434\u043F\u0438\u0441\u0438."]].map(([k, title, desc]) => '<label class="setting-row"><span><b>' + title + "</b><small>" + desc + '</small></span><input type="checkbox" data-setting="' + k + '" ' + (prefs[k] ? "checked" : "") + "><i></i></label>").join("") + '</div><div class="settings-card controls-guide"><span class="eyebrow">\u041F\u041E\u041B\u0415\u0412\u0410\u042F \u041F\u0410\u041C\u042F\u0422\u041A\u0410</span><h3>\u0414\u0435\u0440\u0436\u0438 \u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u044E.</h3><p><kbd>W A S D</kbd> \u0438\u043B\u0438 \u0441\u0442\u0440\u0435\u043B\u043A\u0438 \u2014 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435</p><p><kbd>SHIFT</kbd> / <kbd>\u041F\u0420\u041E\u0411\u0415\u041B</kbd> \u2014 \u0431\u0435\u0433</p><p><kbd>Q</kbd> \u2014 \u043E\u0442\u043F\u043E\u0440: 35 \u0432\u044B\u043D\u043E\u0441\u043B\u0438\u0432\u043E\u0441\u0442\u0438, \u043F\u0435\u0440\u0435\u0440\u044B\u0432 9 \u0441\u0435\u043A\u0443\u043D\u0434</p><p><kbd>ESC</kbd> \u2014 \u043F\u0430\u0443\u0437\u0430</p><p>\u041D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435: \u0434\u0436\u043E\u0439\u0441\u0442\u0438\u043A \u0438 \u0434\u0432\u0435 \u0431\u043E\u0435\u0432\u044B\u0435 \u043A\u043D\u043E\u043F\u043A\u0438. \u0421\u0442\u0440\u0435\u043B\u044C\u0431\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F. \u041E\u0442\u043F\u043E\u0440 \u043E\u0442\u0442\u0430\u043B\u043A\u0438\u0432\u0430\u0435\u0442 \u0432\u0440\u0430\u0433\u043E\u0432 \u0438 \u043F\u0440\u0435\u0440\u044B\u0432\u0430\u0435\u0442 \u0438\u0445 \u0443\u0434\u0430\u0440; \u0443\u0440\u043E\u043D\u0430 \u043D\u0435 \u043D\u0430\u043D\u043E\u0441\u0438\u0442.</p><span class="settings-version">\u041E\u0411\u0418\u0422\u0415\u041B\u042C \xB7 \u0412\u0415\u0420\u0421\u0418\u042F 0.13</span></div></div>';
    el.insertAdjacentHTML("beforeend", '<button class="secondary" id="repeat-tutorial">\u041F\u041E\u0412\u0422\u041E\u0420\u0418\u0422\u042C \u041E\u0411\u0423\u0427\u0415\u041D\u0418\u0415</button>');
    el.querySelector("#repeat-tutorial").onclick = () => onboarding(navigate, true);
    const account = document.createElement("p");
    account.className = "account-notice";
    account.textContent = playerProfile.account === "vk" ? "\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D \u043A VK. \u041D\u0430 \u0434\u0440\u0443\u0433\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435 \u043E\u0442\u043A\u0440\u043E\u0439 \u0438\u0433\u0440\u0443 \u0438\u0437 \u0442\u043E\u0433\u043E \u0436\u0435 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430 VK." : "\u0413\u043E\u0441\u0442\u0435\u0432\u043E\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C: \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D \u043A \u044D\u0442\u043E\u043C\u0443 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0443. \u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043C\u0435\u0436\u0434\u0443 \u041F\u041A \u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u043E\u043C \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0430.";
    el.prepend(account);
    profileEditor(el, playerProfile, api, toast, showProfile);
    el.querySelectorAll("[data-setting]").forEach((input) => input.onchange = () => {
      prefs[input.dataset.setting] = input.checked;
      localStorage.setItem(prefsKey, JSON.stringify(prefs));
      applyControlPrefs();
      setSprint(false);
    });
  }
  async function initializeGame() {
    var _a2, _b2;
    initLandscape();
    $("#retry-connection").onclick = connect;
    refresh();
    const connection = connect();
    let artTimer;
    try {
      await Promise.race([loadArt((done, total) => {
        const percent = Math.round(done / total * 100), bar = document.querySelector("#art-loading-screen .loading-track");
        if (bar) {
          bar.setAttribute("aria-valuenow", percent);
          bar.firstElementChild.style.width = percent + "%";
        }
        const caption = $("#art-loading-caption");
        if (caption) caption.textContent = "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u0433\u043E\u0440\u043E\u0434\u0430 \xB7 " + percent + "%";
      }), new Promise((_, reject) => {
        artTimer = setTimeout(() => reject(new Error("ART_TIMEOUT")), 6e4);
      })]);
    } catch (error) {
      (_a2 = window.obitelStartupFailure) == null ? void 0 : _a2.call(window, error.message === "ART_TIMEOUT" ? "ART_TIMEOUT" : "ART_LOAD");
      return;
    } finally {
      clearTimeout(artTimer);
    }
    refresh();
    document.body.classList.remove("art-loading");
    (_b2 = document.getElementById("art-loading-screen")) == null ? void 0 : _b2.remove();
    requestAnimationFrame(frame);
    await connection;
    setInterval(() => {
      if (!document.hidden && page === "raids") tickRaid($("#raids-page"), raid, save, serverOffset);
    }, 1e3);
    setInterval(() => {
      if (networkReady) energyHud();
      if (networkReady && !document.hidden && page === "leaderboard" && !busy) leaderboardUI($("#leaderboard-page"), api, toast);
      if (!document.hidden && page === "raids" && raid && !busy) pollRaid();
    }, 4e3);
    const invited = launchValue("raid");
    if (invited && /^[a-f0-9]{12}$/.test(invited)) {
      try {
        raid = (await api("raids/" + invited)).raid;
        navigate("raids");
      } catch (e) {
        toast(e.message);
      }
    }
    if (launchValue("friend")) navigate("friends");
    else if (!invited) onboarding(navigate);
  }
  var playerProfile, $, key, save, gearTab, journalTab, sortieMode, selected, page, run, last, toastTimer, keys, stick, activeRaidId, raid, serverOffset, networkReady, busy, sprintHeld, prefsKey, prefs, item, upgrade, itemArt, canvas, display, world, g, bg, pointer, joy, raidPolling, rareMode, raidNumber;
  var init_game = __esm({
    "game.js"() {
      init_boss_arena();
      init_arena_art();
      init_campaign();
      init_campaign_ui();
      init_combat_tactics();
      init_operations();
      init_operations_ui();
      init_ui_icons();
      init_landscape_ui();
      init_raid_view();
      init_garage_ui();
      init_gear_catalogue();
      init_onboarding();
      init_ads_ui();
      init_conflict_ui();
      init_profile_ui();
      init_clans_ui();
      init_friends_ui();
      init_leaderboard_ui();
      init_platform_entry();
      init_client_api();
      init_balance();
      init_art();
      playerProfile = { name: "\u0421\u0442\u0440\u0430\u043D\u043D\u0438\u043A", avatar: 0 };
      $ = (s) => document.querySelector(s);
      key = "obitel-save-v1";
      save = freshSave();
      try {
        const v = JSON.parse(localStorage.getItem(key));
        if ((v == null ? void 0 : v.version) === 1 && Array.isArray(v.owned) && Array.isArray(v.cleared)) save = { ...save, ...v };
      } catch (e) {
      }
      gearTab = "weapons";
      journalTab = "campaign";
      sortieMode = "standard";
      selected = 0;
      page = "map";
      run = null;
      last = 0;
      keys = /* @__PURE__ */ new Set();
      stick = { x: 0, y: 0 };
      activeRaidId = null;
      raid = null;
      serverOffset = 0;
      networkReady = false;
      busy = false;
      sprintHeld = false;
      prefsKey = "obitel-settings-v1";
      prefs = { particles: true, contrast: false, runToggle: false, leftHanded: false, largeControls: false };
      try {
        prefs = { ...prefs, ...JSON.parse(localStorage.getItem(prefsKey) || "{}") };
      } catch (e) {
      }
      applyControlPrefs();
      item = (glyph, title, badge, desc, action2) => `<article class="item"><div class="item-icon">${shelterIcon({ "\u25A4": "daily", "\u25C7": "diamond", "\u271A": "medical", "\u25B0": "garage", "\u26A1": "energy", "\u2699": "settings" }[glyph] || "gear")}</div><span class="badge">${badge}</span><h3>${title}</h3><p>${desc}</p>${action2}</article>`;
      upgrade = (field, name, desc) => item(field === "engine" ? "\u2699" : field === "trunk" ? "\u25A4" : "\u25C7", name, `\u0423\u0420\u041E\u0412\u0415\u041D\u042C ${save[field]} / 10`, desc, `<button class="primary" data-upgrade="${field}" ${save[field] >= 10 || save.scrap < upgradeCost(save[field]) ? "disabled" : ""}>${save[field] >= 10 ? "\u041C\u0410\u041A\u0421\u0418\u041C\u0423\u041C" : `\u0423\u041B\u0423\u0427\u0428\u0418\u0422\u042C \xB7 ${upgradeCost(save[field])} \u0414\u0415\u0422.`}</button>`);
      itemArt = (i) => '<canvas class="loot-art" data-item="' + i + '" width="180" height="180"></canvas>';
      document.querySelectorAll("nav [data-page]").forEach((b) => b.querySelector("span").innerHTML = shelterIcon(b.dataset.page));
      document.querySelector(".contract-icon").innerHTML = shelterIcon("daily");
      document.querySelector(".garage-banner>span").innerHTML = shelterIcon("garage");
      document.querySelector(".energy-resource>i").innerHTML = shelterIcon("energy");
      document.querySelector("#pause").innerHTML = shelterIcon("pause");
      document.querySelector("#boss-open").innerHTML = '\u041A \u0420\u0415\u0419\u0414-\u0411\u041E\u0421\u0421\u0423 <span class="action-glyph">' + shelterIcon("arrow") + "</span>";
      document.querySelectorAll("[data-page]").forEach((b) => b.onclick = () => navigate(b.dataset.page));
      $(".brand").onclick = (e) => {
        e.preventDefault();
        navigate("map");
      };
      $("#deploy").onclick = () => action(() => start());
      $("#boss-open").onclick = () => navigate("raids");
      canvas = $("#battle");
      display = canvas.getContext("2d");
      world = document.createElement("canvas");
      world.width = 960;
      world.height = 600;
      g = world.getContext("2d");
      bg = document.createElement("canvas");
      bg.width = 960;
      bg.height = 600;
      $("#repulse").innerHTML = shelterIcon("repulse") + "<span>\u041E\u0422\u041F\u041E\u0420<small>35 \u0432\u044B\u043D\u043E\u0441\u043B.</small></span>";
      $("#repulse").onpointerdown = (e) => {
        e.preventDefault();
        repulse();
      };
      addEventListener("keydown", (e) => {
        if ($("#game").hidden) return;
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
        keys.add(e.code);
        if (["ShiftLeft", "ShiftRight", "Space"].includes(e.code) && !e.repeat) {
          setSprint(prefs.runToggle ? !sprintHeld : true);
        }
        if (e.code === "KeyQ" && !e.repeat) repulse();
        if (e.code === "Escape") pause();
      });
      addEventListener("keyup", (e) => {
        keys.delete(e.code);
        if (["ShiftLeft", "ShiftRight", "Space"].includes(e.code) && !prefs.runToggle) setSprint(false);
      });
      addEventListener("blur", () => {
        keys.clear();
        setSprint(false);
        stick = { x: 0, y: 0 };
        if (run && !run.ended && !run.paused) pause();
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && run && !run.ended && !run.paused) pause();
      });
      $("#dash").onpointerdown = (e) => {
        if (!run || run.paused || run.ended) return;
        e.preventDefault();
        $("#dash").setPointerCapture(e.pointerId);
        setSprint(prefs.runToggle ? !sprintHeld : true);
      };
      $("#dash").onpointerup = $("#dash").onpointercancel = $("#dash").onlostpointercapture = () => {
        if (!prefs.runToggle) setSprint(false);
      };
      $("#pause").onclick = pause;
      pointer = null;
      joy = $("#joystick");
      joy.onpointerdown = (e) => {
        if (pointer !== null || !run || run.paused || run.ended) return;
        e.preventDefault();
        pointer = e.pointerId;
        joy.setPointerCapture(pointer);
        joystick(e);
      };
      joy.onpointermove = joystick;
      joy.onpointerup = joy.onpointercancel = joy.onlostpointercapture = (e) => {
        if (e.pointerId !== pointer) return;
        pointer = null;
        stick = { x: 0, y: 0 };
        joy.firstElementChild.style.transform = "";
      };
      new MutationObserver(() => {
        var _a2;
        if (!$("#overlay").hidden) (_a2 = $("#result-actions button:not(:disabled)")) == null ? void 0 : _a2.focus({ preventScroll: true });
      }).observe($("#result-actions"), { childList: true });
      raidPolling = false;
      rareMode = false;
      raidNumber = (n) => Math.floor(n).toLocaleString("ru-RU");
      initializeGame().catch(() => {
        var _a2;
        return (_a2 = window.obitelStartupFailure) == null ? void 0 : _a2.call(window, "GAME_START");
      });
    }
  });

  // boot-entry.js
  init_platform_entry();
  Promise.resolve().then(() => (init_game(), game_exports)).then(() => {
    var _a2;
    window.__obitelGameReady = true;
    (_a2 = document.getElementById("startup-error")) == null ? void 0 : _a2.remove();
  }).catch(() => {
    var _a2;
    return (_a2 = window.obitelStartupFailure) == null ? void 0 : _a2.call(window, "GAME_INIT");
  });
})();
