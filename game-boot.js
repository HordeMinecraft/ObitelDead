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
  async function inviteVK(link = "") {
    if (!inVK) throw new Error("\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F \u0412\u041A \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u043F\u0440\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0435 \u0438\u0433\u0440\u044B \u0432\u043D\u0443\u0442\u0440\u0438 \u0412\u041A.");
    if (link) {
      try {
        return await withTimeout(dist_default.send("VKWebAppShare", { link }), "\u0412\u041A \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B. \u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439 \u0441\u0441\u044B\u043B\u043A\u0443 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F.");
      } catch (e) {
      }
    }
    return withTimeout(dist_default.send("VKWebAppShowInviteBox", {}), "\u0412\u041A \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B. \u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439 \u0441\u0441\u044B\u043B\u043A\u0443 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F.");
  }
  async function inviteVKFriends(code) {
    if (!inVK) throw new Error("\u0412\u044B\u0431\u043E\u0440 \u0434\u0440\u0443\u0437\u0435\u0439 \u0412\u041A \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u043D\u0443\u0442\u0440\u0438 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u0412\u041A.");
    const result = await withTimeout(dist_default.send("VKWebAppGetFriends", { multi: true }), "\u0412\u041A \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u043B \u0441\u043F\u0438\u0441\u043E\u043A \u0434\u0440\u0443\u0437\u0435\u0439.");
    const users = Array.isArray(result == null ? void 0 : result.users) ? result.users : [];
    if (!users.length) return { sent: 0, users: [] };
    let sent = 0;
    for (const user of users.slice(0, 20)) {
      try {
        await withTimeout(dist_default.send("VKWebAppShowRequestBox", {
          uid: user.id,
          message: "\u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u044F\u0439\u0441\u044F \u043A\u043E \u043C\u043D\u0435 \u0432 \xAB\u041E\u0431\u0438\u0442\u0435\u043B\u0438 \u041C\u0451\u0440\u0442\u0432\u044B\u0445\xBB!",
          requestKey: "friend=" + code
        }), "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435.");
        sent++;
      } catch (e) {
      }
    }
    if (!sent) await inviteVK(inviteLink("friend", code));
    return { sent, users };
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
  var VK_APP_ID, launch, inVK, withTimeout;
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
    toggle.textContent = "\u2630";
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
      toggle.textContent = open ? "\xD7" : "\u2630";
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
      title.textContent = (((_a2 = aside.querySelector("nav button.active")) == null ? void 0 : _a2.innerText) || "\u0423\u0431\u0435\u0436\u0438\u0449\u0435").replace(/\s*\d+\s*$/, "").trim();
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
      query = "(orientation: landscape) and (max-width: 1100px) and (max-height: 550px)";
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
      ].map(([id, name, type, level, cost, damage, hp, loot2, description], art2) => ({ id, name, type, level, cost, damage, hp, loot: loot2, description, art: art2 }));
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
  var MAPS, WEAPONS, MAX_LEVEL, weaponUnlocked, expeditionRank, ENERGY_MAX, raidProfile, ENERGY_INTERVAL, RAID_COST, BOSS_COST, freshSave, bossUnlocked, xpForLevel, playerLevel, levelProgress, raidDamage, stats, upgradeCost, unlocked, enemyStats, ARMOR, armorUnlocked;
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
      RAID_COST = 8;
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

  // raid-view.js
  function tickRaid(root, raid2, save2, offset) {
    const button = root.querySelector("#raid-attack");
    if (!button || !raid2) return;
    const seconds = Math.max(0, Math.ceil((raid2.nextAttack - Date.now() - offset) / 1e3));
    button.disabled = !raid2.joined || !raidAllowed(save2, raid2.map, raid2.rare) || raid2.hp <= 0 || seconds > 0 || save2.energy < BOSS_COST;
    button.textContent = raid2.hp <= 0 ? "\u0411\u041E\u0421\u0421 \u041F\u041E\u0412\u0415\u0420\u0416\u0415\u041D" : seconds ? "\u041F\u041E\u0412\u0422\u041E\u0420 \u0427\u0415\u0420\u0415\u0417 " + seconds + " \u0421\u0415\u041A" : save2.energy < BOSS_COST ? "\u041D\u0423\u0416\u041D\u041E 12 \u042D\u041D\u0415\u0420\u0413\u0418\u0418" : "\u0410\u0422\u0410\u041A\u041E\u0412\u0410\u0422\u042C \xB7 12 \u042D\u041D\u0415\u0420\u0413\u0418\u0418";
  }
  function renderRaidView(root, { raid: raid2, save: save2, selected: selected2, rareMode: rareMode2, offset, onMode, onMap, onCreate, onAttack, onJoin, onClaim, onClose, onCopy }) {
    var _a2, _b2, _c, _d;
    const map = raid2 ? raid2.map : selected2, rare = raid2 ? !!raid2.rare : rareMode2, m = MAPS[map], profile = RARE_RAIDS[map], allowed = raidAllowed(save2, map, rare), mine = raid2 == null ? void 0 : raid2.members.find((p) => p.me);
    const reward = (raid2 == null ? void 0 : raid2.reward) || { scrap: m.reward * 2, xp: 45, cores: 3, cloth: 6 };
    const capacity = (raid2 == null ? void 0 : raid2.capacity) || RAID_CAPACITY;
    const hit = (_a2 = raid2 == null ? void 0 : raid2.estimatedDamage) != null ? _a2 : raidHit(save2, map, rare);
    const hp = (_b2 = raid2 == null ? void 0 : raid2.hp) != null ? _b2 : rare ? profile.hp : raidProfile(map).hp, maxHp = (_c = raid2 == null ? void 0 : raid2.maxHp) != null ? _c : hp;
    const party = (raid2 == null ? void 0 : raid2.members) || [];
    const oldDetails = (_d = root.querySelector(".raid-rules")) == null ? void 0 : _d.open, oldPage = Number(root.dataset.partyPage || 0);
    const same = root.dataset.encounter === ((raid2 == null ? void 0 : raid2.id) || "catalog");
    root.dataset.encounter = (raid2 == null ? void 0 : raid2.id) || "catalog";
    root.dataset.partyPage = String(same ? oldPage : 0);
    root.innerHTML = `<div class="raid-tabs" role="group" aria-label="\u0422\u0438\u043F \u0431\u043E\u0441\u0441\u0430"><button class="secondary" data-mode="normal" aria-pressed="${!rare}">\u041E\u0431\u044B\u0447\u043D\u044B\u0435</button><button class="secondary" data-mode="rare" aria-pressed="${rare}">\u0420\u0435\u0434\u043A\u0438\u0435</button></div>
 ${!raid2 ? `<label class="raid-select" for="raid-map">\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0431\u043E\u0441\u0441\u0430</label><select id="raid-map" class="boss-select">${MAPS.map((v, i) => `<option value="${i}" ${map === i ? "selected" : ""}>${v.boss}${rare ? " \xB7 \u0443\u0440. " + RARE_RAIDS[i].level : ""}</option>`).join("")}</select>` : ""}
 <article class="boss-encounter ${rare ? "is-rare" : ""}">
 <div class="boss-stage" style="--boss-scene:url('assets/district-${map}.png')"><span class="boss-rarity">${rare ? "\u0420\u0415\u0414\u041A\u0418\u0419" : "\u0411\u041E\u0421\u0421 \u0420\u0410\u0419\u041E\u041D\u0410"} \xB7 ${escape(m.name)}</span><img class="boss-character" src="assets/boss-${BOSS_ART[map]}.png" alt="${escape(m.boss)} \u2014 ${roles[map]}" width="512" height="512" decoding="async"><span class="boss-stage-caption">${roles[map]}</span></div>
 <div class="boss-brief"><span class="eyebrow">${raid2 ? "\u041E\u0411\u0429\u0418\u0419 \u0420\u0415\u0419\u0414" : "\u0414\u041E\u0421\u042C\u0415 \u041F\u0420\u041E\u0422\u0418\u0412\u041D\u0418\u041A\u0410"}</span><h2>${m.boss}</h2><div class="boss-hp-label"><b>${fmt(hp)}</b><span>/ ${fmt(maxHp)} HP</span></div><div class="raid-health" role="progressbar" aria-label="\u0417\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u0431\u043E\u0441\u0441\u0430" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(hp / maxHp * 1e4) / 100}" aria-valuetext="${fmt(hp)} \u0438\u0437 ${fmt(maxHp)} HP"><i style="width:${hp / maxHp * 100}%"></i></div>
 <div class="boss-facts"><div><span>\u0422\u0432\u043E\u044F \u0430\u0442\u0430\u043A\u0430</span><b>${fmt(hit)}</b></div><div><span>\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438</span><b>${party.length} / ${capacity}</b></div><div><span>\u041F\u043E\u0432\u0442\u043E\u0440</span><b>${raidProfile(map).cooldown / 1e3} \u0441\u0435\u043A</b></div></div>
 ${!raid2 ? `<p class="boss-access">\u0423\u0440\u043E\u0432\u0435\u043D\u044C ${rare ? profile.level : m.level} \xB7 3 \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0438${rare ? " \xB7 \u043F\u043E\u0431\u0435\u0434\u0430 \u043D\u0430\u0434 \u043E\u0431\u044B\u0447\u043D\u043E\u0439 \u0432\u0435\u0440\u0441\u0438\u0435\u0439" : ""}<br><span>${allowed ? "\u0414\u043E\u0441\u0442\u0443\u043F \u043E\u0442\u043A\u0440\u044B\u0442" : "\u0423\u0441\u043B\u043E\u0432\u0438\u044F \u0435\u0449\u0451 \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u044B"}</span></p><button class="primary boss-action" id="create-raid" ${!allowed ? "disabled" : ""}>\u0421\u041E\u0417\u0414\u0410\u0422\u042C \u0420\u0415\u0419\u0414</button>` : `<button class="primary boss-action" id="raid-attack">\u0410\u0422\u0410\u041A\u041E\u0412\u0410\u0422\u042C</button>${!raid2.joined && hp > 0 ? `<button class="secondary boss-action" id="join-raid" ${!allowed || party.length >= capacity ? "disabled" : ""}>${!allowed ? "\u041D\u0423\u0416\u0415\u041D \u041F\u0420\u041E\u0413\u0420\u0415\u0421\u0421" : party.length >= capacity ? "\u041E\u0422\u0420\u042F\u0414 \u0417\u0410\u041F\u041E\u041B\u041D\u0415\u041D" : "\u041F\u0420\u0418\u0421\u041E\u0415\u0414\u0418\u041D\u0418\u0422\u042C\u0421\u042F"}</button>` : ""}`}
 </div></article>
 <section class="raid-loot"><div class="section-title"><h3>${raid2 ? "\u0422\u0432\u043E\u044F \u043D\u0430\u0433\u0440\u0430\u0434\u0430 \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0431\u0435\u0434\u044B" : rare ? "\u041E\u0431\u0449\u0438\u0439 \u0444\u043E\u043D\u0434 \u0440\u0435\u0439\u0434\u0430" : "\u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u0437\u0430 \u043F\u043E\u0431\u0435\u0434\u0443"}</h3></div><div class="raid-rewards">${rewards(raid2 ? reward : rare ? profile.pool : reward)}</div>${rare ? "<p>\u0424\u043E\u043D\u0434 \u0434\u0435\u043B\u0438\u0442\u0441\u044F \u043F\u043E \u043D\u0430\u043D\u0435\u0441\u0451\u043D\u043D\u043E\u043C\u0443 \u0443\u0440\u043E\u043D\u0443. \u0411\u0435\u0437 \u0443\u0447\u0430\u0441\u0442\u0438\u044F \u0432 \u0430\u0442\u0430\u043A\u0435 \u043D\u0430\u0433\u0440\u0430\u0434\u044B \u043D\u0435\u0442.</p>" : ""}${raid2 && hp === 0 && (mine == null ? void 0 : mine.damage) && !mine.claimed ? '<button class="primary" id="raid-claim">\u0417\u0410\u0411\u0420\u0410\u0422\u042C \u041D\u0410\u0413\u0420\u0410\u0414\u0423</button>' : ""}</section>
 <details class="raid-rules" ${oldDetails && same ? "open" : ""}><summary>\u041F\u0440\u0430\u0432\u0438\u043B\u0430 \u0438 \u0443\u0441\u043B\u043E\u0432\u0438\u044F \u0440\u0435\u0439\u0434\u0430</summary><p>\u0410\u0442\u0430\u043A\u0438 \u0432 \u0443\u0434\u043E\u0431\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F, \u043E\u0431\u0449\u0435\u0435 \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F. \u0426\u0435\u043D\u0430 \u2014 12 \u044D\u043D\u0435\u0440\u0433\u0438\u0438. ${rare ? "\u041E\u0441\u0430\u0434\u043D\u043E\u0435 \u0443\u0441\u0438\u043B\u0435\u043D\u0438\u0435 \xD7" + profile.multiplier.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + ". \u041E\u043D\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u0440\u0435\u0434\u043A\u0438\u0445 \u0431\u043E\u0441\u0441\u043E\u0432. \u041D\u0430\u0433\u0440\u0430\u0434\u044B \u043E\u043A\u0440\u0443\u0433\u043B\u044F\u044E\u0442\u0441\u044F \u0432\u043D\u0438\u0437 \u0438 \u0432\u044B\u0434\u0430\u044E\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0431\u0435\u0434\u044B. \u0420\u0435\u0439\u0434 \u0431\u0435\u0437 \u0441\u0440\u043E\u043A\u0430 \u0438\u0441\u0442\u0435\u0447\u0435\u043D\u0438\u044F." : raidProfile(map).trait}</p><p>\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u043F\u043E \u0441\u0441\u044B\u043B\u043A\u0435. \u0413\u043E\u0441\u0442\u0435\u0432\u043E\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D \u043A \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0443; \u0441\u043F\u0438\u0441\u043E\u043A \u0434\u0440\u0443\u0437\u0435\u0439 VK \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D.</p></details>
 ${raid2 ? '<div class="raid-controls"><button class="secondary" id="copy-raid">\u041F\u0420\u0418\u0413\u041B\u0410\u0421\u0418\u0422\u042C \u041F\u041E \u0421\u0421\u042B\u041B\u041A\u0415</button><button class="secondary" id="close-raid">\u041A \u0421\u041F\u0418\u0421\u041A\u0423 \u0411\u041E\u0421\u0421\u041E\u0412</button></div><section class="raid-party"><h3>\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \xB7 ' + party.length + '</h3><div class="party-list"></div><div class="party-pagination"></div></section>' : ""}`;
    root.querySelectorAll("[data-mode]").forEach((b) => b.onclick = () => onMode(b.dataset.mode === "rare"));
    const bind = (id, fn) => {
      const el = root.querySelector("#" + id);
      if (el) el.onclick = fn;
    };
    const select = root.querySelector("#raid-map");
    if (select) select.onchange = (e) => onMap(Number(e.target.value));
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
        root.querySelector(".party-list").innerHTML = sorted.slice(page2 * 20, page2 * 20 + 20).map((p) => `<div><span>${escape(p.name)}${p.me ? " \xB7 \u0422\u042B" : ""}</span><b>${fmt(p.damage)} \u0443\u0440\u043E\u043D\u0430</b>${p.claimed ? "<small>\u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0430</small>" : ""}</div>`).join("");
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
      init_balance();
      init_rare_raids();
      BOSS_ART = ["watcher", "arsonist", "crane", "doctor", "root", "driver", "smelter", "admiral"];
      roles = ["\u0425\u0440\u0430\u043D\u0438\u0442\u0435\u043B\u044C \u043F\u0443\u0441\u0442\u044B\u0445 \u0434\u043E\u043C\u043E\u0432", "\u041E\u0433\u043E\u043D\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0439 \u0437\u0430\u043F\u0440\u0430\u0432\u043A\u0438", "\u0425\u043E\u0437\u044F\u0438\u043D \u0433\u0440\u0443\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u0432\u043E\u0440\u0430", "\u041A\u0430\u0440\u0430\u043D\u0442\u0438\u043D \u043D\u0435 \u043E\u043A\u043E\u043D\u0447\u0435\u043D", "\u0421\u0435\u0440\u0434\u0446\u0435 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u043E\u0433\u043E \u043B\u0435\u0441\u0430", "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0440\u0435\u0439\u0441", "\u0416\u0430\u0440 \u043C\u0451\u0440\u0442\u0432\u044B\u0445 \u043F\u0435\u0447\u0435\u0439", "\u041A\u043E\u043C\u0430\u043D\u0434\u0438\u0440 \u0437\u0430\u0442\u043E\u043D\u0443\u0432\u0448\u0435\u0433\u043E \u0444\u043B\u043E\u0442\u0430"];
      fmt = (n) => Math.floor(n || 0).toLocaleString("ru-RU");
      escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      rewards = (r) => Object.entries({ scrap: "\u0414\u0435\u0442\u0430\u043B\u0438", xp: "\u041E\u043F\u044B\u0442", cores: "\u042F\u0434\u0440\u0430", cloth: "\u0422\u043A\u0430\u043D\u044C" }).map(([k, name]) => "<div><strong>" + fmt(r[k]) + "</strong><span>" + name + "</span></div>").join("");
    }
  });

  // garage-ui.js
  function garageUI(root, save2, level, upgrades, buy, rerender) {
    const current = vehicleFor(save2), owned = save2.ownedVehicles || ["nomad"];
    const options = [["all", "\u0412\u0441\u0435 \xB7 20"], ["scrap", "\u0417\u0430 \u0434\u0435\u0442\u0430\u043B\u0438 \xB7 13"], ["votes", "\u0417\u0430 \u0433\u043E\u043B\u043E\u0441\u0430 \xB7 6"], ["owned", "\u041C\u043E\u0438 \xB7 " + owned.length]];
    const list = VEHICLES.filter((v) => filter === "all" || filter === "scrap" && v.cost > 0 || filter === "votes" && v.votes || filter === "owned" && owned.includes(v.id));
    root.innerHTML = `<div class="garage-showroom"><div class="garage-platform">${art(current)}<span class="garage-stamp">\u041C\u041E\u0411\u0418\u041B\u042C\u041D\u0410\u042F \u0411\u0410\u0417\u0410 / ${String(current.art + 1).padStart(2, "0")}</span></div><div class="garage-summary"><span class="eyebrow orange">\u0410\u041A\u0422\u0418\u0412\u041D\u042B\u0419 \u0410\u0412\u0422\u041E\u041C\u041E\u0411\u0418\u041B\u042C</span><h2>\xAB${current.name}\xBB</h2><p>${current.description}</p><div class="vehicle-bonuses">${bonus(current)}</div><small>\u0411\u043E\u043D\u0443\u0441\u044B \u043A\u0443\u0437\u043E\u0432\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044E\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0443 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0439 \u043C\u0430\u0448\u0438\u043D\u044B. \u0423\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u044F \u043C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u043E\u0439 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u043F\u0440\u0438 \u0441\u043C\u0435\u043D\u0435 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044F.</small></div></div><div class="section-title"><h3>\u041C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u0430\u044F</h3><span>\u041E\u0411\u0429\u0418\u0415 \u041C\u041E\u0414\u0423\u041B\u0418 \u0410\u0412\u0422\u041E\u041F\u0410\u0420\u041A\u0410</span></div><div class="item-grid">${upgrades}</div><div class="section-title"><h3>\u0410\u0432\u0442\u043E\u043F\u0430\u0440\u043A \u0443\u0431\u0435\u0436\u0438\u0449\u0430</h3><span>${owned.length} / 20 \u0412 \u041A\u041E\u041B\u041B\u0415\u041A\u0426\u0418\u0418</span></div><div class="vehicle-filters" role="group" aria-label="\u0424\u0438\u043B\u044C\u0442\u0440 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u0435\u0439">${options.map(([id, label2]) => `<button class="secondary ${filter === id ? "selected" : ""}" data-vehicle-filter="${id}" aria-pressed="${filter === id}">${label2}</button>`).join("")}</div><p class="page-intro">\u041F\u043E\u043A\u0443\u043F\u043A\u0430 \u0437\u0430 \u0434\u0435\u0442\u0430\u043B\u0438 \u043D\u0430\u0432\u0441\u0435\u0433\u0434\u0430. \u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u043A\u0443\u0437\u043E\u0432\u0430 \u0437\u0430 \u0433\u043E\u043B\u043E\u0441\u0430 \u0438\u043C\u0435\u044E\u0442 \u0445\u0430\u0440\u0430\u043A\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043A\u0438 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0445 \u0430\u043D\u0430\u043B\u043E\u0433\u043E\u0432 \u0438 \u0442\u0435 \u0436\u0435 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F \u043A \u0443\u0440\u043E\u0432\u043D\u044E. \u041E\u043F\u043B\u0430\u0442\u0430 \u0433\u043E\u043B\u043E\u0441\u0430\u043C\u0438 \u043F\u043E\u043A\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u2014 \u0443\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u043C\u044B\u0435 \u0446\u0435\u043D\u044B.</p><div class="vehicle-grid">${list.map((v) => {
      const have = owned.includes(v.id), active = current.id === v.id, locked = level < v.level, disabled = active || locked || !have && (!!v.votes || save2.scrap < v.cost);
      const label2 = active ? "\u0412\u042B\u0411\u0420\u0410\u041D" : locked ? "\u041D\u0423\u0416\u0415\u041D \u0423\u0420\u041E\u0412\u0415\u041D\u042C " + v.level : have ? "\u0412\u042B\u0411\u0420\u0410\u0422\u042C" : v.votes ? "\u0421\u041A\u041E\u0420\u041E \xB7 " + v.votes + " \u0413\u041E\u041B\u041E\u0421\u041E\u0412" : save2.scrap < v.cost ? "\u041D\u0415 \u0425\u0412\u0410\u0422\u0410\u0415\u0422 \u0414\u0415\u0422\u0410\u041B\u0415\u0419" : "\u041A\u0423\u041F\u0418\u0422\u042C \xB7 " + v.cost.toLocaleString("ru-RU");
      return `<article class="vehicle-card ${active ? "equipped" : ""} ${v.votes ? "collectible" : ""}"><div class="vehicle-picture">${art(v)}<span class="vehicle-number">${String(v.art + 1).padStart(2, "0")}</span><span class="vehicle-tag">${v.votes ? "\u041A\u041E\u041B\u041B\u0415\u041A\u0426\u0418\u041E\u041D\u041D\u042B\u0419" : have ? "\u0412 \u0413\u0410\u0420\u0410\u0416\u0415" : "\u0417\u0410 \u0414\u0415\u0422\u0410\u041B\u0418"}</span></div><div class="vehicle-info"><small>${v.type} \xB7 \u0423\u0420. ${v.level}</small><h3>${v.name}</h3><p>${v.description}</p><div class="vehicle-bonuses">${bonus(v)}</div><div class="vehicle-price">${v.votes ? v.votes + " \u0433\u043E\u043B\u043E\u0441\u043E\u0432" : v.cost ? v.cost.toLocaleString("ru-RU") + " \u0434\u0435\u0442\u0430\u043B\u0435\u0439" : "\u0421\u0442\u0430\u0440\u0442\u043E\u0432\u044B\u0439 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044C"}</div><button class="${active ? "secondary" : "primary"}" data-vehicle="${v.id}" ${disabled ? "disabled" : ""}>${label2}</button></div></article>`;
    }).join("")}</div>`;
    root.querySelectorAll("[data-vehicle-filter]").forEach((b) => b.onclick = () => {
      filter = b.dataset.vehicleFilter;
      rerender();
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
        ["\u0414\u0432\u0438\u0433\u0430\u0439\u0441\u044F. \u041E\u0433\u043E\u043D\u044C \u2014 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439.", "\u0422\u0435\u043B\u0435\u0444\u043E\u043D: \u0434\u0436\u043E\u0439\u0441\u0442\u0438\u043A \u0441\u043B\u0435\u0432\u0430, \u043A\u043D\u043E\u043F\u043A\u0430 \u0431\u0435\u0433\u0430 \u0441\u043F\u0440\u0430\u0432\u0430. \u041A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440: WASD \u0438\u043B\u0438 \u0441\u0442\u0440\u0435\u043B\u043A\u0438, Shift \u2014 \u0431\u0435\u0433. \u0414\u0435\u0440\u0436\u0438 \u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u044E, \u043F\u043E\u0434\u0431\u0438\u0440\u0430\u0439 \u0430\u043F\u0442\u0435\u0447\u043A\u0438 \u0438 \u0441\u043B\u0435\u0434\u0438 \u0437\u0430 \u0432\u044B\u043D\u043E\u0441\u043B\u0438\u0432\u043E\u0441\u0442\u044C\u044E. \u041F\u0430\u0443\u0437\u0430 \u2014 \u043A\u043D\u043E\u043F\u043A\u0430 \u2161.", "map", "\u041A\u0410\u041A \u041E\u0422\u041A\u0420\u042B\u0422\u042C \u0411\u041E\u0421\u0421\u0410"],
        ["\u0422\u0440\u0438 \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0438 \u0434\u043E \u0431\u043E\u0441\u0441\u0430", "\u041E\u0434\u043D\u0430 \u0432\u044B\u043B\u0430\u0437\u043A\u0430 \u0441\u0442\u043E\u0438\u0442 8 \u044D\u043D\u0435\u0440\u0433\u0438\u0438 \u0438 \u0441\u043E\u0441\u0442\u043E\u0438\u0442 \u0438\u0437 \u0442\u0440\u0451\u0445 \u0432\u043E\u043B\u043D. \u041F\u043E\u0441\u043B\u0435 \u0442\u0440\u0451\u0445 \u0443\u0441\u043F\u0435\u0448\u043D\u044B\u0445 \u0437\u0430\u0447\u0438\u0441\u0442\u043E\u043A \u0438 \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F \u043D\u0443\u0436\u043D\u043E\u0433\u043E \u0443\u0440\u043E\u0432\u043D\u044F \u043E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u0431\u043E\u0441\u0441. \u041F\u043E\u0431\u0435\u0434\u0438 \u0435\u0433\u043E, \u0447\u0442\u043E\u0431\u044B \u043F\u0435\u0440\u0435\u0439\u0442\u0438 \u0432 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0440\u0430\u0439\u043E\u043D. \u042D\u043D\u0435\u0440\u0433\u0438\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0441\u0430\u043C\u0430.", "map", "\u041A\u0410\u041A \u0421\u0422\u0410\u0422\u042C \u0421\u0418\u041B\u042C\u041D\u0415\u0415"],
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
      root.innerHTML = `<div class="clan-banner"><span class="eyebrow orange">\u041E\u041F\u0415\u0420\u0410\u0426\u0418\u042F \xAB\u0412\u041E\u0417\u0412\u0420\u0410\u0429\u0415\u041D\u0418\u0415 \u0421\u0412\u0415\u0422\u0410\xBB</span><h2>\u0423\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0433\u043E\u0440\u043E\u0434.</h2><p>\u0417\u0430\u0447\u0438\u0449\u0430\u0439 \u0440\u0430\u0439\u043E\u043D\u044B \u2192 \u0443\u0441\u0438\u043B\u0438\u0432\u0430\u0439 \u0441\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u2192 \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u044F\u0439\u0441\u044F \u0432 \u043A\u043B\u0430\u043D \u2192 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438 \u043F\u043E\u0434\u0437\u0435\u043C\u043D\u044B\u0439 \u0440\u0435\u0430\u043A\u0442\u043E\u0440.</p><small>\u0421\u0435\u0437\u043E\u043D \u0434\u043E ${new Date(d.endsAt).toLocaleDateString("ru-RU")} \xB7 \u0422\u0432\u043E\u044F \u0431\u043E\u0435\u0432\u0430\u044F \u043C\u043E\u0449\u044C ${d.power}</small></div><div class="clan-columns"><section class="settings-card"><h3>\u0410\u0440\u0435\u043D\u0430 / \u041A\u043B\u0430\u043D\u043E\u0432\u044B\u0439 \u0444\u0440\u043E\u043D\u0442</h3><p>\u0410\u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u044B\u0439 \u0431\u043E\u0439 \u0441 \u044D\u043A\u0438\u043F\u0438\u0440\u043E\u0432\u043A\u043E\u0439 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u0438\u0433\u0440\u043E\u043A\u0430. \u0414\u043E\u0441\u0442\u0443\u043F \u0441\u043E 2 \u0443\u0440\u043E\u0432\u043D\u044F. \u041F\u043E 3 \u043F\u043E\u043F\u044B\u0442\u043A\u0438 \u0432 \u0434\u0435\u043D\u044C \u043D\u0430 \u0440\u0435\u0436\u0438\u043C. \u041F\u0440\u043E\u0442\u0438\u0432\u043D\u0438\u043A\u0438 \u0431\u043B\u0438\u0437\u043A\u0438 \u043F\u043E \u0443\u0440\u043E\u0432\u043D\u044E. \u041F\u043E\u0431\u0435\u0434\u0430: 10 \u043E\u0447\u043A\u043E\u0432 \u0438 40 \u0434\u0435\u0442\u0430\u043B\u0435\u0439; \u043E\u0442\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0435: 2 \u043E\u0447\u043A\u0430 \u0438 10 \u0434\u0435\u0442\u0430\u043B\u0435\u0439. \u0417\u0430\u0449\u0438\u0449\u0430\u044E\u0449\u0438\u0439\u0441\u044F \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0442\u0435\u0440\u044F\u0435\u0442.</p><p>\u041E\u0431\u0445\u043E\u0434 \u043F\u043E\u0431\u0435\u0436\u0434\u0430\u0435\u0442 \u0448\u0442\u0443\u0440\u043C, \u0443\u043A\u0440\u044B\u0442\u0438\u0435 \u2014 \u043E\u0431\u0445\u043E\u0434, \u0448\u0442\u0443\u0440\u043C \u2014 \u0443\u043A\u0440\u044B\u0442\u0438\u0435. \u041F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u043E \u0434\u0430\u0451\u0442 +20% \u043C\u043E\u0449\u043D\u043E\u0441\u0442\u0438; \u043D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0439 \u0432\u044B\u0431\u043E\u0440 \u221220%. \u041F\u0440\u0438 \u0440\u0430\u0432\u0435\u043D\u0441\u0442\u0432\u0435 \u043F\u043E\u0431\u0435\u0436\u0434\u0430\u0435\u0442 \u0437\u0430\u0449\u0438\u0442\u0430.</p><label>\u0422\u0430\u043A\u0442\u0438\u043A\u0430 <select id="combat-tactic">${Object.entries(names).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label><p>\u0410\u0440\u0435\u043D\u0430: ${d.arenaLeft}/3 \xB7 \u041A\u043B\u0430\u043D: ${d.warLeft}/3 \xB7 \u041F\u0435\u0440\u0435\u0440\u044B\u0432 \u043C\u0435\u0436\u0434\u0443 \u0430\u0442\u0430\u043A\u0430\u043C\u0438: 30 \u0441.</p>${d.opponents.map((q) => `<div class="clan-row"><div><strong>${esc(q.name)}</strong><small>\u0423\u0440. ${q.level} \xB7 ${q.power} \u043C\u043E\u0449\u0438 \xB7 ${names[q.stance]} \xB7 ${esc(q.clan || "\u0411\u0435\u0437 \u043A\u043B\u0430\u043D\u0430")}</small></div><button class="primary" data-fight="arena" data-code="${esc(q.code)}" ${!d.arenaLeft ? "disabled" : ""}>\u0410\u0420\u0415\u041D\u0410</button>${d.clan && q.clan && q.clan !== d.clan ? `<button class="secondary" data-fight="war" data-code="${esc(q.code)}" ${!d.warLeft ? "disabled" : ""}>\u041A\u041B\u0410\u041D\u041E\u0412\u042B\u0419 \u0411\u041E\u0419</button>` : ""}</div>`).join("") || "<p>\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0434\u0440\u0443\u0433\u0438\u0445 \u0438\u0433\u0440\u043E\u043A\u043E\u0432 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0435\u0433\u043E \u0443\u0440\u043E\u0432\u043D\u044F. \u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438 \u0434\u0440\u0443\u0437\u0435\u0439.</p>"}</section><section class="settings-card depth-card"><span class="eyebrow orange">\u041F\u041E\u0414\u0417\u0415\u041C\u041D\u042B\u0419 \u041A\u041E\u041C\u041F\u041B\u0415\u041A\u0421 \xB7 6+</span><h3>${["\u0413\u0435\u0440\u043C\u0435\u0442\u0438\u0447\u043D\u0430\u044F \u0441\u0442\u0430\u043D\u0446\u0438\u044F / \u0421\u0442\u0440\u0430\u0436 \u0448\u043B\u044E\u0437\u0430", "\u0427\u0451\u0440\u043D\u044B\u0439 \u0442\u043E\u043D\u043D\u0435\u043B\u044C / \u041C\u0430\u0442\u043A\u0430 \u0440\u043E\u044F", "\u0420\u0435\u0430\u043A\u0442\u043E\u0440 / \u041D\u0443\u043B\u0435\u0432\u043E\u0439 \u043F\u0430\u0446\u0438\u0435\u043D\u0442", "\u0420\u0435\u0430\u043A\u0442\u043E\u0440 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D"][d.boss.stage]}</h3><p>\u0422\u0440\u0438 \u0431\u043E\u0441\u0441\u0430: 12 000 \u2192 24 000 \u2192 36 000 HP. \u0417\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u043E\u0431\u0449\u0435\u0435 \u0434\u043B\u044F \u043A\u043B\u0430\u043D\u0430. \u0412\u0445\u043E\u0434 \u043F\u043E\u0441\u043B\u0435 \u0427\u0451\u0440\u043D\u043E\u0433\u043E \u043B\u0435\u0441\u0430. \u0423\u0434\u0430\u0440: 12 \u044D\u043D\u0435\u0440\u0433\u0438\u0438, \u043F\u0435\u0440\u0435\u0440\u044B\u0432 30 \u0441\u0435\u043A\u0443\u043D\u0434.</p><div class="xp-track"><i style="width:${100 * d.boss.hp / d.boss.maxHp}%"></i></div><p>${d.boss.hp} / ${d.boss.maxHp} HP</p><p>\u0423\u044F\u0437\u0432\u0438\u043C\u043E\u0441\u0442\u044C: ${names[["assault", "flank", "cover"][d.boss.stage]] || "\u041F\u043E\u0445\u043E\u0434 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D"}. \u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0430\u044F \u0442\u0430\u043A\u0442\u0438\u043A\u0430: 125% \u0443\u0440\u043E\u043D\u0430, \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435: 65%.</p><p>\u0417\u0430 \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0431\u043E\u0441\u0441\u0430 \u0432\u0441\u0435 \u043D\u0430\u043D\u0435\u0441\u0448\u0438\u0435 \u0443\u0440\u043E\u043D \u043F\u043E\u043B\u0443\u0447\u0430\u044E\u0442 300 / 600 / 900 \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \u0438 3 / 6 / 9 \u044F\u0434\u0435\u0440 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043D\u043D\u043E. \u041D\u043E\u0432\u044B\u0439 \u043F\u043E\u0445\u043E\u0434 \u043A\u0430\u0436\u0434\u044B\u0439 \u043F\u043E\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u0438\u043A. \u041A\u043B\u0430\u043D \u0434\u043B\u044F \u0431\u043E\u0451\u0432 \u0437\u0430\u043A\u0440\u0435\u043F\u043B\u044F\u0435\u0442\u0441\u044F \u0434\u043E \u043A\u043E\u043D\u0446\u0430 \u043D\u0435\u0434\u0435\u043B\u0438. \u0411\u0435\u0437 \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u043E\u0433\u043E \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043D\u0430\u0433\u0440\u0430\u0434.</p><button class="primary" data-fight="depth" ${!d.clan || d.boss.stage === 3 ? "disabled" : ""}>\u0410\u0422\u0410\u041A\u041E\u0412\u0410\u0422\u042C \xB7 12 \u042D\u041D\u0415\u0420\u0413\u0418\u0418</button><p>${d.clan ? esc(d.clan) : "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u0441\u0442\u0443\u043F\u0438 \u0432 \u043A\u043B\u0430\u043D"}</p></section></div><div class="clan-columns">${[["\u0410\u0440\u0435\u043D\u0430", d.arena], ["\u041A\u043B\u0430\u043D\u043E\u0432\u044B\u0439 \u0441\u0435\u0437\u043E\u043D", d.wars]].map(([title, rows]) => `<section class="settings-card"><h3>${title}</h3>${rows.map((r, i) => `<div class="clan-row"><strong>${i + 1}. ${esc(r.name)}</strong><span>${r.points} \u043E\u0447\u043A\u043E\u0432</span></div>`).join("") || "<p>\u041F\u0435\u0440\u0432\u044B\u0435 \u043C\u0435\u0441\u0442\u0430 \u0435\u0449\u0451 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B.</p>"}</section>`).join("")}</div><div id="combat-report" role="status"></div>`;
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
      root.innerHTML = "<p>" + esc(e.message) + "</p>";
    }
  }
  var esc, names;
  var init_conflict_ui = __esm({
    "conflict-ui.js"() {
      esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      names = { assault: "\u0428\u0442\u0443\u0440\u043C", flank: "\u041E\u0431\u0445\u043E\u0434", cover: "\u0423\u043A\u0440\u044B\u0442\u0438\u0435" };
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
      AVATARS = ["\u271A", "\u25C8", "\u265C", "\u26A1", "\u2620", "\u2605"];
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
      root.innerHTML = '<div class="clan-banner"><span class="eyebrow orange">\u0421\u0418\u041B\u0410 \u0412 \u0415\u0414\u0418\u041D\u0421\u0422\u0412\u0415</span><h2>' + esc2((c == null ? void 0 : c.name) || "\u041D\u0430\u0439\u0434\u0438 \u0441\u0432\u043E\u0438\u0445.") + "</h2><p>\u0414\u043E 20 \u0432\u044B\u0436\u0438\u0432\u0448\u0438\u0445. \u0421\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0435 \u0440\u0435\u0439\u0434\u044B. \u041E\u0431\u0449\u0430\u044F \u0446\u0435\u043B\u044C.</p></div>" + (c ? '<div class="clan-columns"><section class="settings-card"><h3>\u041E\u0442\u0440\u044F\u0434 \xB7 ' + c.members.length + "/20</h3>" + c.members.map((m) => row(esc2(m.name), "\u0423\u0440\u043E\u0432\u0435\u043D\u044C " + m.level)).join("") + '<button class="secondary" data-clan-action="leave">\u041F\u041E\u041A\u0418\u041D\u0423\u0422\u042C \u041A\u041B\u0410\u041D</button></section><section class="settings-card"><h3>\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u0440\u0435\u0439\u0434\u044B</h3>' + (c.raids.map((r) => row(esc2(MAPS[r.map].boss), r.hp + " / " + r.maxHp + " HP", '<button class="primary" data-raid="' + r.id + '">\u041A \u0411\u041E\u0421\u0421\u0423</button>')).join("") || "<p>\u0421\u043E\u0437\u0434\u0430\u0439 \u0440\u0435\u0439\u0434 \u043D\u0430 \u043A\u0430\u0440\u0442\u0435. \u041E\u043D \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0443 \u0432\u0441\u0435\u0433\u043E \u043A\u043B\u0430\u043D\u0430.</p>") + (c.owner ? "<h3>\u0417\u0430\u044F\u0432\u043A\u0438</h3>" + (c.requests.map((m) => row(esc2(m.name), "\u0423\u0440\u043E\u0432\u0435\u043D\u044C " + m.level, '<button class="primary" data-clan-action="accept" data-code="' + m.code + '">\u041F\u0420\u0418\u041D\u042F\u0422\u042C</button><button class="secondary" data-clan-action="decline" data-code="' + m.code + '">\u041E\u0422\u041A\u041B\u041E\u041D\u0418\u0422\u042C</button>')).join("") || "<p>\u041D\u043E\u0432\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A \u043D\u0435\u0442.</p>") : "") + "</section></div>" : '<div class="clan-columns"><section class="settings-card"><h3>\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043B\u0430\u043D</h3><p>\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \u0441\u043E 2 \u0443\u0440\u043E\u0432\u043D\u044F. \u041F\u0440\u0438\u043D\u0438\u043C\u0430\u0439 \u0437\u0430\u044F\u0432\u043A\u0438 \u0438 \u0441\u043E\u0431\u0438\u0440\u0430\u0439 \u043E\u0442\u0440\u044F\u0434.</p><form id="clan-create" class="friend-form"><input aria-label="\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043B\u0430\u043D\u0430" placeholder="\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043B\u0430\u043D\u0430" minlength="3" maxlength="28" required><button class="primary">\u0421\u041E\u0417\u0414\u0410\u0422\u042C</button></form></section><section class="settings-card"><h3>\u041E\u0442\u043A\u0440\u044B\u0442\u044B\u0435 \u043A\u043B\u0430\u043D\u044B</h3>' + (data.clans.map((x) => row(esc2(x.name), x.count + "/20 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432", '<button class="secondary" data-clan-action="request" data-code="' + x.code + '" ' + (x.requested || x.count >= 20 ? "disabled" : "") + ">" + (x.requested ? "\u0417\u0410\u042F\u0412\u041A\u0410 \u041E\u0422\u041F\u0420\u0410\u0412\u041B\u0415\u041D\u0410" : "\u0412\u0421\u0422\u0423\u041F\u0418\u0422\u042C") + "</button>")).join("") || "<p>\u0421\u0442\u0430\u043D\u044C \u043E\u0441\u043D\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u043C \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u043A\u043B\u0430\u043D\u0430.</p>") + "</section></div>");
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
      root.innerHTML = '<p class="page-intro">' + esc2(e.message) + '</p><button class="secondary">\u041F\u041E\u0412\u0422\u041E\u0420\u0418\u0422\u042C</button>';
      root.querySelector("button").onclick = () => clansUI(root, api2, toast2, openRaid);
    }
  }
  var esc2;
  var init_clans_ui = __esm({
    "clans-ui.js"() {
      init_balance();
      esc2 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
  });

  // friends-ui.js
  function friendsUI(root, api2, toast2, openRaid) {
    let loading = false;
    async function render() {
      if (loading) return;
      loading = true;
      try {
        const [data, onlineData, leaderData] = await Promise.all([api2("friends"), api2("online"), api2("leaderboard")]);
        const invited = String(launchValue("friend") || "").toLowerCase();
        const leaderboard = (leaderData.players || []).slice(0, 10);
        root.innerHTML = `
    <div class="settings-card">
     <span class="eyebrow orange">\u0421\u0412\u041E\u0418 \u0412 \u0413\u041E\u0420\u041E\u0414\u0415 \xB7 ${Number(onlineData.online || 0)} \u0412 \u0421\u0415\u0422\u0418</span>
     <h2>\u0412\u044B\u0436\u0438\u0432\u0430\u0442\u044C \u0432\u043C\u0435\u0441\u0442\u0435.</h2>
     <p>\u0414\u043E\u0431\u0430\u0432\u043B\u044F\u0439 \u0438\u0433\u0440\u043E\u043A\u043E\u0432 \u043F\u043E \u043A\u043E\u0434\u0443 \u0438\u043B\u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0439 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u0447\u0435\u0440\u0435\u0437 \u0412\u041A. \u041A\u043E\u0433\u0434\u0430 \u0434\u0440\u0443\u0433 \u043F\u0440\u0438\u043C\u0435\u0442 \u0437\u0430\u044F\u0432\u043A\u0443, \u0437\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0435\u0442 \u0432\u0438\u0434\u0435\u043D \u0435\u0433\u043E \u0441\u0442\u0430\u0442\u0443\u0441 \u0438 \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u0440\u0435\u0439\u0434.</p>
     <div class="friend-code"><span>\u0422\u0412\u041E\u0419 \u041A\u041E\u0414</span><strong>${data.code}</strong><button class="secondary" id="friend-copy">\u0421\u0421\u042B\u041B\u041A\u0410 \u041F\u0420\u0418\u0413\u041B\u0410\u0428\u0415\u041D\u0418\u042F</button>${inVK ? '<button class="primary" id="vk-friends">\u0412\u042B\u0411\u0420\u0410\u0422\u042C \u0414\u0420\u0423\u0417\u0415\u0419 \u0412\u041A</button><button class="secondary" id="vk-invite">\u041F\u041E\u0414\u0415\u041B\u0418\u0422\u042C\u0421\u042F \u0421\u0421\u042B\u041B\u041A\u041E\u0419</button>' : ""}</div>
     <form id="friend-form"><label for="friend-code-input">\u041A\u043E\u0434 \u0434\u0440\u0443\u0433\u0430</label><div class="friend-form"><input id="friend-code-input" maxlength="12" required pattern="[a-fA-F0-9]{12}" autocomplete="off" placeholder="12 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432" value="${escape2(invited)}"><button class="primary">\u0414\u041E\u0411\u0410\u0412\u0418\u0422\u042C \u0412 \u0414\u0420\u0423\u0417\u042C\u042F</button></div></form>
    </div>
    <div class="section-title"><h3>\u0412\u0445\u043E\u0434\u044F\u0449\u0438\u0435 \u0437\u0430\u044F\u0432\u043A\u0438</h3><span>${data.requests.length}</span></div>
    <div class="party-list">${data.requests.map((p) => `<div><span><b>${escape2(p.name)}</b><small>${p.online ? "\u25CF \u0412 \u0421\u0415\u0422\u0418" : "\u041D\u0435 \u0432 \u0441\u0435\u0442\u0438"} \xB7 \u0443\u0440\u043E\u0432\u0435\u043D\u044C ${p.level || 1}</small></span><button class="primary" data-accept="${p.code}">\u041F\u0420\u0418\u041D\u042F\u0422\u042C</button><button class="secondary" data-decline="${p.code}">\u041E\u0422\u041A\u041B\u041E\u041D\u0418\u0422\u042C</button></div>`).join("") || '<p class="page-intro">\u041D\u043E\u0432\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.</p>'}</div>
    <div class="section-title"><h3>\u0422\u0432\u043E\u0439 \u043E\u0442\u0440\u044F\u0434</h3><button class="secondary" id="friends-refresh">\u041E\u0411\u041D\u041E\u0412\u0418\u0422\u042C</button></div>
    <div class="party-list">${data.friends.map((p) => `<div><span><b>${escape2(p.name)}</b><small>${p.online ? "\u25CF \u0412 \u0421\u0415\u0422\u0418" : "\u041D\u0435 \u0432 \u0441\u0435\u0442\u0438"} \xB7 \u0443\u0440\u043E\u0432\u0435\u043D\u044C ${p.level || 1}${p.raid ? " \xB7 \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u0440\u0435\u0439\u0434 " + p.raid.hp + " HP" : ""}</small></span>${p.raid ? `<button class="primary" data-friend-raid="${p.raid.id}">\u041A \u0411\u041E\u0421\u0421\u0423 \u2192</button>` : ""}<button class="secondary" data-remove="${p.code}">\u0423\u0414\u0410\u041B\u0418\u0422\u042C</button></div>`).join("") || '<p class="page-intro">\u041E\u0442\u043F\u0440\u0430\u0432\u044C \u0434\u0440\u0443\u0433\u0443 \u0441\u0441\u044B\u043B\u043A\u0443. \u041F\u043E\u0441\u043B\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u0438\u044F \u0437\u0430\u044F\u0432\u043A\u0438 \u043E\u043D \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C.</p>'}</div>
    <div class="section-title"><h3>\u0422\u043E\u043F \u0432\u044B\u0436\u0438\u0432\u0448\u0438\u0445</h3><span>\u0422\u0412\u041E\u0401 \u041C\u0415\u0421\u0422\u041E: ${leaderData.meRank || "\u2014"}</span></div>
    <div class="party-list leaderboard-list">${leaderboard.map((p) => `<div><strong>#${p.rank}</strong><span><b>${escape2(p.name)}</b><small>${p.online ? "\u25CF \u0412 \u0421\u0415\u0422\u0418 \xB7 " : ""}\u0443\u0440. ${p.level} \xB7 ${p.xp} XP \xB7 \u0431\u043E\u0441\u0441\u044B ${p.bossKills}</small></span></div>`).join("") || '<p class="page-intro">\u0420\u0435\u0439\u0442\u0438\u043D\u0433 \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442.</p>'}</div>`;
        root.querySelector("#friends-refresh").onclick = render;
        const mutate = async (path, code) => {
          try {
            await api2(path, { code });
            toast2(path.endsWith("request") ? "\u0417\u0430\u044F\u0432\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430" : "\u0421\u043F\u0438\u0441\u043E\u043A \u0434\u0440\u0443\u0437\u0435\u0439 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D");
            await render();
          } catch (e) {
            toast2(e.message);
          }
        };
        root.querySelector("#friend-form").onsubmit = (e) => {
          e.preventDefault();
          mutate("friends/request", root.querySelector("input").value.trim().toLowerCase());
        };
        root.querySelectorAll("[data-accept]").forEach((b) => b.onclick = () => mutate("friends/accept", b.dataset.accept));
        root.querySelectorAll("[data-decline]").forEach((b) => b.onclick = () => mutate("friends/decline", b.dataset.decline));
        root.querySelectorAll("[data-remove]").forEach((b) => b.onclick = () => mutate("friends/remove", b.dataset.remove));
        root.querySelectorAll("[data-friend-raid]").forEach((b) => b.onclick = () => openRaid(b.dataset.friendRaid));
        root.querySelector("#friend-copy").onclick = async () => {
          const link = inviteLink("friend", data.code);
          try {
            await navigator.clipboard.writeText(link);
            toast2("\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E");
          } catch (e) {
            root.querySelector("input").value = data.code;
            toast2("\u041F\u0435\u0440\u0435\u0434\u0430\u0439 \u0434\u0440\u0443\u0433\u0443 \u0441\u0432\u043E\u0439 \u043A\u043E\u0434: " + data.code);
          }
        };
        if (root.querySelector("#vk-friends")) root.querySelector("#vk-friends").onclick = async () => {
          try {
            const r = await inviteVKFriends(data.code);
            toast2(r.sent ? "\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u044B: " + r.sent : "\u041D\u0438\u043A\u0442\u043E \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D");
          } catch (e) {
            toast2(e.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0434\u0440\u0443\u0437\u0435\u0439 \u0412\u041A");
          }
        };
        if (root.querySelector("#vk-invite")) root.querySelector("#vk-invite").onclick = () => inviteVK(inviteLink("friend", data.code)).catch((e) => toast2(e.message || "\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u043E"));
        if (/^[a-f0-9]{12}$/.test(invited) && invited !== data.code) {
          const key2 = "obitel-friend-invite:" + invited;
          if (!sessionStorage.getItem(key2)) {
            sessionStorage.setItem(key2, "1");
            try {
              await api2("friends/request", { code: invited });
              toast2("\u0417\u0430\u044F\u0432\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430 \u0438\u0433\u0440\u043E\u043A\u0443, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u043B \u0442\u0435\u0431\u044F");
            } catch (e) {
            }
          }
        }
      } catch (e) {
        root.innerHTML = '<div class="settings-card"><p>' + escape2(e.message) + '</p><button class="secondary" id="friends-retry">\u041F\u041E\u0412\u0422\u041E\u0420\u0418\u0422\u042C</button></div>';
        root.querySelector("button").onclick = render;
      } finally {
        loading = false;
      }
    }
    render();
  }
  var escape2;
  var init_friends_ui = __esm({
    "friends-ui.js"() {
      init_platform_entry();
      escape2 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
  });

  // config.js
  var CLOUD_API, isRemoteFrontend, normalize, override, API_BASE;
  var init_config = __esm({
    "config.js"() {
      CLOUD_API = "https://obiteldead.deniswww127.workers.dev/api/";
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
    const headers = {};
    if (body !== void 0) headers["Content-Type"] = "application/json";
    if (tokenMode && token) headers["X-Obitel-Session"] = token;
    const controller = new AbortController(), started = performance.now();
    const timeout = setTimeout(() => controller.abort(), 15e3);
    try {
      const response = await fetch(new URL(path, API_BASE), { method: body === void 0 ? "GET" : "POST", headers, credentials: crossOrigin ? "omit" : "same-origin", body: body === void 0 ? void 0 : JSON.stringify(body), signal: controller.signal });
      if (!((_a2 = response.headers.get("content-type")) == null ? void 0 : _a2.includes("application/json"))) throw new Error("\u0421\u0435\u0440\u0432\u0435\u0440 \u0432\u0435\u0440\u043D\u0443\u043B \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u043F\u043E\u0437\u0436\u0435.");
      const data = await response.json();
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
      if (error instanceof TypeError) throw new Error("\u041D\u0435\u0442 \u0441\u0432\u044F\u0437\u0438 \u0441 \u0441\u0435\u0440\u0432\u0435\u0440\u043E\u043C. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442.");
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
      } catch (e) {
      }
      reads = /* @__PURE__ */ new Map();
    }
  });

  // art.js
  function setAppearance(save2) {
    var _a2, _b2, _c, _d, _e, _f;
    appearance = { weapon: (_c = (_b2 = (_a2 = WEAPONS[save2.weapon]) == null ? void 0 : _a2.pose) != null ? _b2 : save2.weapon) != null ? _c : 0, armor: (_f = (_e = (_d = ARMOR[save2.armorTier]) == null ? void 0 : _d.pose) != null ? _e : save2.armorTier) != null ? _f : save2.armor > 0 ? 1 : 0 };
  }
  async function loadSprite(path) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
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
        resolve(c);
      };
      img.onerror = () => resolve(null);
      img.src = path;
    });
  }
  async function loadArt() {
    await Promise.all([Promise.all(Array.from({ length: 8 }, (_, i) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        environments[i] = img;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = "assets/district-" + i + ".png";
    }))), loadSprite("assets/characters.png").then((c) => spriteAtlas = c), loadSprite("assets/equipment.png").then((c) => equipmentAtlas = c), loadSprite("assets/armor-tiers.png").then((c) => armorAtlas = c), loadSprite("assets/items.png").then((c) => itemAtlas = c), loadSprite("assets/weapons-loot.png").then((c) => weaponAtlas = c), loadSprite("assets/arsenal-expanded.png").then((c) => expandedAtlas = c)]);
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

  // game.js
  var game_exports = {};
  function showProfile(data) {
    playerProfile = { ...playerProfile, ...data };
    const name = document.getElementById("profile-name");
    if (name) name.textContent = playerProfile.name;
    const avatar = document.querySelector(".profile .avatar");
    if (avatar) {
      avatar.textContent = AVATARS[playerProfile.avatar || 0];
      avatar.className = "avatar avatar-" + (playerProfile.avatar || 0);
    }
  }
  async function api(path, body) {
    const data = await requestAPI(path, body);
    if (path === "profile") showProfile({ name: data.name, avatar: data.avatar || 0 });
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
        try {
          await requestAPI("auth/vk", { launch: new URLSearchParams([...params].filter(([k]) => k.startsWith("vk_") || k === "sign")).toString() });
        } catch (e) {
          if (e.status !== 503 && e.status !== 404) throw e;
        }
      }
      const profile = await api("profile");
      networkReady = true;
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
    if (page === "map") $("#deploy").disabled = !networkReady || !unlocked(save, selected) || save.energy < RAID_COST;
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
    $("#map-name").textContent = m.name;
    $("#map-desc").textContent = m.desc;
    $("#mission").textContent = m.goal;
    $("#map-threat").textContent = `\u0423\u0413\u0420\u041E\u0417\u0410 ${["I", "II", "III", "IV", "V"][i]}`;
    $("#deploy").disabled = !networkReady || !unlocked(save, i) || save.energy < RAID_COST;
    $("#deploy-hint").textContent = !unlocked(save, i) ? "\u041F\u041E\u0411\u0415\u0414\u0418 \u0411\u041E\u0421\u0421\u0410 \u041F\u0420\u0415\u0414\u042B\u0414\u0423\u0429\u0415\u0413\u041E \u0420\u0410\u0419\u041E\u041D\u0410" : save.energy < RAID_COST ? "\u041D\u0415\u0414\u041E\u0421\u0422\u0410\u0422\u041E\u0427\u041D\u041E \u042D\u041D\u0415\u0420\u0413\u0418\u0418 \xB7 +1 \u041A\u0410\u0416\u0414\u042B\u0415 5 \u041C\u0418\u041D\u0423\u0422" : `\u0417\u0410\u0427\u0418\u0421\u0422\u041E\u041A: ${save.districtRuns[i]} / 3 \u0414\u041E \u0411\u041E\u0421\u0421\u0410`;
    $("#boss-open").disabled = !bossUnlocked(save, i);
    $("#boss-progress").textContent = bossUnlocked(save, i) ? "\u0411\u041E\u0421\u0421 \u0414\u041E\u0421\u0422\u0423\u041F\u0415\u041D" : `\u041D\u0423\u0416\u041D\u041E 3 \u0417\u0410\u0427\u0418\u0421\u0422\u041A\u0418 \u0418 \u0423\u0420\u041E\u0412\u0415\u041D\u042C ${MAPS[i].level}`;
    scene($("#scene"), i);
    document.querySelectorAll(".map-card").forEach((el, j) => el.classList.toggle("selected", i === j));
  }
  function mapCards() {
    $("#maps").innerHTML = MAPS.map((m, i) => `<button class="map-card ${i === selected ? "selected" : ""}" data-map="${i}" aria-label="${m.name}, ${unlocked(save, i) ? "\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E" : "\u0437\u0430\u043A\u0440\u044B\u0442\u043E"}"><canvas width="260" height="140"></canvas><span class="number">0${i + 1}</span><div class="map-info"><b>${m.name}</b><small>\u0417\u0410\u0427\u0418\u0421\u0422\u041A\u0418 ${save.districtRuns[i]} / 3<span class="status">${save.cleared.includes(i) ? "\u2713" : unlocked(save, i) ? "\u2192" : "\u0417\u0410\u041A\u0420\u042B\u0422\u041E"}</span></small></div></button>`).join("");
    document.querySelectorAll(".map-card").forEach((el, i) => {
      scene(el.querySelector("canvas"), i);
      el.onclick = () => selectMap(i);
    });
  }
  function renderInventory() {
    return '<div class="section-title"><h3>\u0421\u043A\u043B\u0430\u0434 \u0443\u0431\u0435\u0436\u0438\u0449\u0430</h3><span>\u041C\u0410\u0422\u0415\u0420\u0418\u0410\u041B\u042B \u0418 \u0411\u0420\u041E\u041D\u042F</span></div><div class="supply-grid">' + [[0, "\u0414\u0435\u0442\u0430\u043B\u0438", save.scrap, "\u041E\u0440\u0443\u0436\u0438\u0435, \u043C\u0430\u0448\u0438\u043D\u0430 \u0438 \u043C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u0430\u044F"], [1, "\u042F\u0434\u0440\u0430", save.cores, "\u0420\u0435\u0439\u0434-\u0431\u043E\u0441\u0441\u044B \u0438 \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0435 \u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442\u044B"], [2, "\u0422\u043A\u0430\u043D\u044C", save.cloth || 0, "3\u201310 \u0437\u0430 \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0443 \xB7 6 \u0437\u0430 \u0431\u043E\u0441\u0441\u0430"]].map(([i, n, v, d]) => '<article class="supply">' + itemArt(i) + "<div><small>" + n + "</small><strong>" + v + "</strong><p>" + d + "</p></div></article>").join("") + '</div><div class="section-title"><h3>\u0417\u0430\u0449\u0438\u0442\u0430 \u0432\u044B\u0436\u0438\u0432\u0448\u0435\u0433\u043E</h3><span>\u041F\u041E\u0411\u0415\u0414\u042B \u041D\u0410\u0414 \u0411\u041E\u0421\u0421\u0410\u041C\u0418: ' + (save.bossKills || 0) + '</span></div><div class="armor-grid">' + ARMOR.map((a, i) => {
      const owned = (save.ownedArmor || [0]).includes(i), active = (save.armorTier || 0) === i, open = armorUnlocked(save, i), afford = save.scrap >= a.cost && (save.cloth || 0) >= a.cloth && save.cores >= a.cores;
      return '<article class="armor-card ' + (active ? "equipped" : "") + '">' + itemArt(a.icon) + '<span class="badge">' + (active ? "\u042D\u041A\u0418\u041F\u0418\u0420\u041E\u0412\u0410\u041D\u041E" : owned ? "\u0412 \u0418\u041D\u0412\u0415\u041D\u0422\u0410\u0420\u0415" : open ? "\u0427\u0415\u0420\u0422\u0401\u0416 \u041E\u0422\u041A\u0420\u042B\u0422" : "\u0417\u0410\u041A\u0420\u042B\u0422\u041E") + "</span><h3>" + a.name + '</h3><strong class="armor-stat">+' + a.hp + " HP</strong><p>" + a.description + "</p><small>" + (!owned ? "\u0423\u0440\u043E\u0432\u0435\u043D\u044C " + a.level + (a.bosses ? " \u0438\u043B\u0438 " + a.bosses + " \u043F\u043E\u0431\u0435\u0434 \u043D\u0430\u0434 \u0431\u043E\u0441\u0441\u0430\u043C\u0438" : "") : "\u041A\u043E\u043C\u043F\u043B\u0435\u043A\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D \u043D\u0430\u0432\u0441\u0435\u0433\u0434\u0430") + "</small>" + (!owned ? '<div class="recipe">' + (a.votes ? "\u0426\u0435\u043D\u0430: " + a.votes + " \u0433\u043E\u043B\u043E\u0441\u043E\u0432" : a.cost + " \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \xB7 " + a.cloth + " \u0442\u043A\u0430\u043D\u0438" + (a.cores ? " \xB7 " + a.cores + " \u044F\u0434\u0435\u0440" : "")) + "</div>" : "") + '<button class="' + (active ? "secondary" : "primary") + '" data-armor="' + i + '" ' + (active || !owned && (a.votes || !open || !afford) ? "disabled" : "") + ">" + (active ? "\u041D\u0410\u0414\u0415\u0422\u041E" : owned ? "\u041D\u0410\u0414\u0415\u0422\u042C" : a.votes ? a.votes + " \u0413\u041E\u041B\u041E\u0421\u041E\u0412 \xB7 \u0421\u041A\u041E\u0420\u041E" : open ? "\u0421\u041E\u0417\u0414\u0410\u0422\u042C" : "\u041D\u0423\u0416\u0415\u041D \u041E\u041F\u042B\u0422") + "</button></article>";
    }).join("") + "</div>";
  }
  function renderWeapons() {
    const boost = (1 + save.weaponLevel * 0.08) * (1 + save.engine * 0.04);
    return '<div class="section-title"><h3>\u0410\u0440\u0441\u0435\u043D\u0430\u043B \u0443\u0431\u0435\u0436\u0438\u0449\u0430</h3><span>10 \u041C\u041E\u0414\u0415\u041B\u0415\u0419 \xB7 \u041C\u0410\u0421\u0422\u0415\u0420\u0421\u041A\u0410\u042F</span></div><div class="weapon-grid">' + WEAPONS.map((w, i) => {
      const owned = save.owned.includes(i), equipped = save.weapon === i, dps = w.damage * (w.pellets || 1) / w.rate * boost;
      return '<article class="weapon-card ' + (equipped ? "equipped" : "") + '"><div class="weapon-stage"><span class="weapon-number">0' + (i + 1) + '</span><span class="weapon-type">' + (w.votes ? "\u041A\u041E\u041B\u041B\u0415\u041A\u0426\u0418\u042F \u0417\u0410 \u0413\u041E\u041B\u041E\u0421\u0410" : w.pellets ? "\u0414\u0420\u041E\u0411\u041E\u0412\u0418\u041A" : "\u041E\u0413\u041D\u0415\u0421\u0422\u0420\u0415\u041B\u042C\u041D\u041E\u0415") + '</span><canvas data-weapon-art="' + i + '" width="440" height="440"></canvas><span class="weapon-state">' + (equipped ? "\u25CF \u0412 \u0420\u0423\u041A\u0410\u0425" : owned ? "\u0412 \u0418\u041D\u0412\u0415\u041D\u0422\u0410\u0420\u0415" : "\u0427\u0415\u0420\u0422\u0401\u0416") + '</span></div><div class="weapon-info"><h3>' + w.name + "</h3><p>" + w.description + " \u0423\u0440\u043E\u0432\u0435\u043D\u044C " + (w.level || 1) + '.</p><div class="weapon-stats"><div><small>\u0423\u0420\u041E\u041D</small><b>' + Math.round(w.damage * boost) + (w.pellets ? " \xD7 " + w.pellets : "") + "</b></div><div><small>\u041F\u0415\u0420\u0415\u0417\u0410\u0420\u042F\u0414\u041A\u0410</small><b>" + w.rate + " \u0441</b></div><div><small>\u0414\u0410\u041B\u042C\u041D\u041E\u0421\u0422\u042C</small><b>" + w.range + '</b></div></div><div class="power-label"><span>\u0423\u0420\u041E\u041D \u0412 \u0421\u0415\u041A\u0423\u041D\u0414\u0423</span><strong>' + Math.round(dps) + '</strong></div><div class="weapon-power"><i style="width:' + Math.min(100, dps / 200 * 100) + '%"></i></div><small class="weapon-note">' + (w.pellets ? "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C \u043F\u0440\u0438 \u043F\u043E\u043F\u0430\u0434\u0430\u043D\u0438\u0438 \u0432\u0441\u0435\u0445 \u0434\u0440\u043E\u0431\u0438\u043D." : "\u0421 \u0443\u0447\u0451\u0442\u043E\u043C \u043C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u043E\u0439 \u0438 \u0433\u0435\u043D\u0435\u0440\u0430\u0442\u043E\u0440\u0430.") + '</small><button class="' + (equipped ? "secondary" : "primary") + '" data-weapon="' + i + '" ' + (equipped || !weaponUnlocked(save, i) || !owned && (w.votes || save.scrap < w.cost) ? "disabled" : "") + ">" + (equipped ? "\u042D\u041A\u0418\u041F\u0418\u0420\u041E\u0412\u0410\u041D\u041E" : owned ? "\u0412\u0417\u042F\u0422\u042C \u0412 \u0420\u0423\u041A\u0418" : w.votes ? w.votes + " \u0413\u041E\u041B\u041E\u0421\u041E\u0412 \xB7 \u0421\u041A\u041E\u0420\u041E" : !weaponUnlocked(save, i) ? "\u0423\u0420\u041E\u0412\u0415\u041D\u042C " + w.level : "\u0421\u041E\u0417\u0414\u0410\u0422\u042C \xB7 " + w.cost + " \u0414\u0415\u0422\u0410\u041B\u0415\u0419") + "</button></div></article>";
    }).join("") + "</div>";
  }
  function renderPage() {
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
    if (page === "gear") {
      $("#gear-page").innerHTML = `<div class="loadout-hero"><canvas id="loadout-avatar" width="400" height="380"></canvas><div><span class="eyebrow orange">\u0422\u0412\u041E\u0419 \u0412\u042B\u0416\u0418\u0412\u0428\u0418\u0419</span><h2>${ARMOR[save.armorTier || 0].name}</h2><p>${ARMOR[save.armorTier || 0].description}</p><strong>${WEAPONS[save.weapon].name}</strong><div class="stat-pills"><span>${stats(save).hp} HP</span><span>${Math.round(stats(save).damage)} \u0423\u0420\u041E\u041D</span><span>${playerLevel(save)} \u0423\u0420\u041E\u0412\u0415\u041D\u042C</span></div></div></div><p class="page-intro">\u041A\u0430\u0436\u0434\u043E\u0435 \u043E\u0440\u0443\u0436\u0438\u0435 \u043C\u0435\u043D\u044F\u0435\u0442 \u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u044E \u0431\u043E\u044F. \u0423\u0440\u043E\u0432\u043D\u0438 1\u2013500. \u041A\u0430\u0436\u0434\u044B\u0435 25 \u0443\u0440\u043E\u0432\u043D\u0435\u0439 \u0440\u0430\u0441\u0442\u0443\u0442 \u0441\u043B\u043E\u0436\u043D\u043E\u0441\u0442\u044C \u0432\u044B\u043B\u0430\u0437\u043E\u043A \u0438 \u043D\u0430\u0433\u0440\u0430\u0434\u0430 \u043E\u043F\u044B\u0442\u043E\u043C. \u041F\u0430\u0442\u0440\u043E\u043D\u044B \u043D\u0435 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u044B; \u0441\u0442\u0440\u0435\u043B\u044C\u0431\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F. \u0423\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u044F \u043C\u0430\u0441\u0442\u0435\u0440\u0441\u043A\u043E\u0439 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044E\u0442 \u043D\u0430 \u0432\u0441\u0451 \u043E\u0440\u0443\u0436\u0438\u0435.</p>${renderWeapons()}<div class="item-grid">${upgrade("weaponLevel", "\u0412\u0435\u0440\u0441\u0442\u0430\u043A \u043E\u0440\u0443\u0436\u0435\u0439\u043D\u0438\u043A\u0430", `+8% \u0431\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0443\u0440\u043E\u043D\u0430 \u0437\u0430 \u0443\u0440\u043E\u0432\u0435\u043D\u044C. \u0421\u0435\u0439\u0447\u0430\u0441 +${save.weaponLevel * 8}%.`)}${upgrade("armor", "\u0423\u0441\u0438\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u0434\u043A\u043B\u0430\u0434\u043A\u0438", `+8 \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u044F \u0437\u0430 \u0443\u0440\u043E\u0432\u0435\u043D\u044C. \u0421\u0435\u0439\u0447\u0430\u0441 +${save.armor * 8} HP. \u0420\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0441 \u043B\u044E\u0431\u044B\u043C \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u043E\u043C.`)}${item("\u271A", "\u041F\u043E\u043B\u0435\u0432\u043E\u0439 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442", "\u0410\u0412\u0422\u041E\u041C\u0410\u0422\u0418\u0427\u0415\u0421\u041A\u041E\u0415 \u041B\u0415\u0427\u0415\u041D\u0418\u0415", "\u0410\u043F\u0442\u0435\u0447\u043A\u0438 \u0432\u044B\u043F\u0430\u0434\u0430\u044E\u0442 \u0432 \u0431\u043E\u044E. \u041F\u043E\u0434\u043E\u0439\u0434\u0438, \u0447\u0442\u043E\u0431\u044B \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C 28 \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u044F.", "")}</div>` + renderInventory();
    }
    if (page === "gear") {
      document.querySelectorAll("[data-item]").forEach((c) => drawItem(c, Number(c.dataset.item)));
      document.querySelectorAll("[data-armor]").forEach((b) => b.onclick = () => action(() => api("armor", { armor: Number(b.dataset.armor) })));
    }
    if (page === "garage") garageUI($("#garage-page"), save, playerLevel(save), [upgrade("engine", "\u0413\u0435\u043D\u0435\u0440\u0430\u0442\u043E\u0440", `+4% \u0443\u0440\u043E\u043D\u0430 \u0437\u0430 \u0443\u0440\u043E\u0432\u0435\u043D\u044C. \u0421\u0435\u0439\u0447\u0430\u0441 +${save.engine * 4}%.`), upgrade("body", "\u0411\u0440\u043E\u043D\u0435\u043A\u043E\u0440\u043F\u0443\u0441", `+4% \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u044F \u0437\u0430 \u0443\u0440\u043E\u0432\u0435\u043D\u044C. \u0421\u0435\u0439\u0447\u0430\u0441 +${save.body * 4}%.`), upgrade("trunk", "\u0413\u0440\u0443\u0437\u043E\u0432\u043E\u0439 \u043E\u0442\u0441\u0435\u043A", `+5% \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \u0437\u0430 \u0432\u044B\u043B\u0430\u0437\u043A\u0443 \u0437\u0430 \u0443\u0440\u043E\u0432\u0435\u043D\u044C. \u0421\u0435\u0439\u0447\u0430\u0441 +${save.trunk * 5}%.`)].join(""), (id) => action(() => api("vehicle", { vehicle: id })), renderPage);
    if (page === "daily") {
      $("#daily-page").innerHTML = adCard() + `<p class="page-intro">\u041E\u0434\u043D\u0430 \u043F\u043E\u043D\u044F\u0442\u043D\u0430\u044F \u0446\u0435\u043B\u044C \u043D\u0430 \u0434\u0435\u043D\u044C. \u041A\u043E\u043D\u0442\u0440\u0430\u043A\u0442 \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0432 00:00 \u043F\u043E \u041C\u043E\u0441\u043A\u0432\u0435. \u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043D\u044B\u0439 \u0434\u0435\u043D\u044C \u043D\u0435 \u043E\u0442\u043D\u0438\u043C\u0430\u0435\u0442 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441. \u041D\u0430\u0433\u0440\u0430\u0434\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435.</p><div class="item-grid">${item("\u25A4", "\u0413\u043E\u0440\u043E\u0434 \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u0442\u0430\u0442\u044C \u0442\u0438\u0448\u0435", `\u0421\u0415\u0413\u041E\u0414\u041D\u042F \xB7 ${Math.min(save.daily.kills, 20)} / 20`, `\u0423\u0441\u0442\u0440\u0430\u043D\u0438 20 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0445 \u0432 \u043B\u044E\u0431\u044B\u0445 \u0440\u0430\u0439\u043E\u043D\u0430\u0445. \u041D\u0430\u0433\u0440\u0430\u0434\u0430: 120 \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \u0438 1 \u044F\u0434\u0440\u043E.`, `<button class="primary" id="claim" ${save.daily.claimed || save.daily.kills < 20 ? "disabled" : ""}>${save.daily.claimed ? "\u041D\u0410\u0413\u0420\u0410\u0414\u0410 \u041F\u041E\u041B\u0423\u0427\u0415\u041D\u0410" : save.daily.kills < 20 ? "\u041A\u041E\u041D\u0422\u0420\u0410\u041A\u0422 \u0412 \u041F\u0420\u041E\u0426\u0415\u0421\u0421\u0415" : "\u0417\u0410\u0411\u0420\u0410\u0422\u042C \u041D\u0410\u0413\u0420\u0410\u0414\u0423"}</button>`)}${item("\u25C7", "\u0422\u0440\u043E\u0444\u0435\u0438 \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u043E\u0439 \u0437\u043E\u043D\u044B", `${save.cores} \u042F\u0414\u0415\u0420`, `\u042F\u0434\u0440\u043E \u0432\u044B\u0434\u0430\u0451\u0442\u0441\u044F \u0437\u0430 \u043F\u043E\u0431\u0435\u0434\u0443 \u043D\u0430\u0434 \u0431\u043E\u0441\u0441\u043E\u043C. \u041F\u043E\u0442\u0440\u0430\u0442\u044C \u044F\u0434\u0440\u0430 \u043D\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0440\u0435\u0434\u043A\u043E\u0439 \u0431\u0440\u043E\u043D\u0438.`, "")}</div>`;
    }
    if (page === "raids") renderRaids();
    if (page === "settings") renderSettings();
    if (page === "guide") $("#guide-page").innerHTML = `<div class="journal"><h3>\u0422\u0432\u043E\u0439 \u043F\u0435\u0440\u0432\u044B\u0439 \u0432\u044B\u0445\u043E\u0434</h3><p>\u0412\u044B\u0431\u0435\u0440\u0438 \u0440\u0430\u0439\u043E\u043D \u0438 \u043D\u0430\u0447\u043D\u0438 \u0432\u044B\u043B\u0430\u0437\u043A\u0443. \u041F\u0435\u0440\u0435\u043C\u0435\u0449\u0430\u0439\u0441\u044F WASD \u0438\u043B\u0438 \u0441\u0442\u0440\u0435\u043B\u043A\u0430\u043C\u0438; \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u043B\u0435\u0432\u044B\u0439 \u0434\u0436\u043E\u0439\u0441\u0442\u0438\u043A. \u041E\u0440\u0443\u0436\u0438\u0435 \u0441\u0430\u043C\u043E \u0441\u0442\u0440\u0435\u043B\u044F\u0435\u0442 \u0432 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0433\u043E \u0432\u0440\u0430\u0433\u0430 \u0432 \u0440\u0430\u0434\u0438\u0443\u0441\u0435. \u0423\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0439 Shift, \u043F\u0440\u043E\u0431\u0435\u043B \u0438\u043B\u0438 \u043A\u043D\u043E\u043F\u043A\u0443 \xAB\u0411\u0435\u0436\u0430\u0442\u044C\xBB: \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0432\u044B\u0448\u0435 \u043D\u0430 65%, \u0440\u0430\u0441\u0445\u043E\u0434\u0443\u0435\u0442\u0441\u044F \u0432\u044B\u043D\u043E\u0441\u043B\u0438\u0432\u043E\u0441\u0442\u044C. \u0411\u0435\u0433 \u043D\u0435 \u0434\u0430\u0451\u0442 \u043D\u0435\u0443\u044F\u0437\u0432\u0438\u043C\u043E\u0441\u0442\u044C. \u041F\u043E\u0441\u043B\u0435 \u0438\u0441\u0442\u043E\u0449\u0435\u043D\u0438\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438 30%.</p><h3>\u041D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0435 \u0441\u0442\u043E\u0439 \u043D\u0430 \u043C\u0435\u0441\u0442\u0435</h3><p>\u0425\u043E\u0434\u043E\u043A\u0438 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u0435\u0435, \u0431\u0435\u0433\u0443\u043D\u044B \u0431\u044B\u0441\u0442\u0440\u0435\u0435, \u0433\u0440\u043E\u043C\u0438\u043B\u044B \u0436\u0438\u0432\u0443\u0447\u0435\u0435. \u0417\u0430\u0447\u0438\u0441\u0442\u043A\u0430 \u0441\u0442\u043E\u0438\u0442 8 \u044D\u043D\u0435\u0440\u0433\u0438\u0438 \u0438 \u0437\u0430\u0432\u0435\u0440\u0448\u0430\u0435\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0442\u0440\u0451\u0445 \u0432\u043E\u043B\u043D. \u041F\u043E\u0441\u043B\u0435 \u0432\u043E\u043B\u043D\u044B \u043E\u0442\u0440\u044F\u0434 \u043F\u0440\u043E\u0434\u0432\u0438\u0433\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0443\u0447\u0430\u0441\u0442\u043E\u043A \u0443\u043B\u0438\u0446\u044B. \u0411\u043E\u0441\u0441 \u0441\u0430\u043C \u043D\u0435 \u043F\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F. \u0410\u043F\u0442\u0435\u0447\u043A\u0438 \u0438 \u0434\u0435\u0442\u0430\u043B\u0438 \u043D\u0443\u0436\u043D\u043E \u043F\u043E\u0434\u0431\u0438\u0440\u0430\u0442\u044C.</p><h3>\u0412\u0435\u0440\u043D\u0438\u0441\u044C \u0441\u0438\u043B\u044C\u043D\u0435\u0435</h3><p>\u0417\u0430\u0447\u0438\u0441\u0442\u043A\u0438 \u043F\u0440\u0438\u043D\u043E\u0441\u044F\u0442 \u0434\u0435\u0442\u0430\u043B\u0438 \u0438 \u043E\u043F\u044B\u0442. \u041F\u043E\u0441\u043B\u0435 \u0442\u0440\u0451\u0445 \u0437\u0430\u0447\u0438\u0441\u0442\u043E\u043A \u0438 \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u043C\u043E\u0433\u043E \u0443\u0440\u043E\u0432\u043D\u044F \u043E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u0440\u0435\u0439\u0434-\u0431\u043E\u0441\u0441. \u0421\u043E\u0437\u0434\u0430\u0439 \u0440\u0435\u0439\u0434, \u043F\u043E\u0434\u0435\u043B\u0438\u0441\u044C \u0441\u0441\u044B\u043B\u043A\u043E\u0439, \u0430\u0442\u0430\u043A\u0443\u0439\u0442\u0435 \u0432 \u0440\u0430\u0437\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F: \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u043E\u0431\u0449\u0435\u0435. \u0410\u0442\u0430\u043A\u0430 \u0441\u0442\u043E\u0438\u0442 12 \u044D\u043D\u0435\u0440\u0433\u0438\u0438. \u041F\u043E\u0441\u043B\u0435 \u043F\u043E\u0431\u0435\u0434\u044B \u0437\u0430\u0431\u0435\u0440\u0438 \u043D\u0430\u0433\u0440\u0430\u0434\u0443 \u2014 \u044D\u0442\u043E \u043E\u0442\u043A\u0440\u043E\u0435\u0442 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0440\u0430\u0439\u043E\u043D. \u041F\u0440\u0438 \u043E\u0442\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F 35% \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u043D\u043D\u044B\u0445 \u0434\u0435\u0442\u0430\u043B\u0435\u0439.</p><h3>\u041E \u043F\u0440\u043E\u0442\u043E\u0442\u0438\u043F\u0435</h3><p>\u041F\u044F\u0442\u044C \u0440\u0430\u0439\u043E\u043D\u043E\u0432 \u0441 \u0434\u0435\u0442\u0430\u043B\u044C\u043D\u044B\u043C\u0438 \u0444\u043E\u043D\u0430\u043C\u0438, \u043F\u0438\u043A\u0441\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0438, \u0442\u0440\u0438 \u043E\u0440\u0443\u0436\u0438\u044F, \u0431\u0440\u043E\u043D\u044F, \u043C\u0430\u0448\u0438\u043D\u0430, \u044D\u043D\u0435\u0440\u0433\u0438\u044F, \u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442\u044B \u0438 \u0430\u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u044B\u0435 \u0440\u0435\u0439\u0434\u044B. \u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u043D\u0430 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u043C \u0441\u0435\u0440\u0432\u0435\u0440\u0435. \u0415\u0441\u0442\u044C \u0433\u043E\u0441\u0442\u0435\u0432\u044B\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u0438 \u0438 \u0441\u0441\u044B\u043B\u043A\u0438 \u043D\u0430 \u0440\u0435\u0439\u0434. \u0412\u0445\u043E\u0434 \u0438 \u0434\u0440\u0443\u0437\u044C\u044F \u0412\u041A, \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442-\u0440\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0435, \u0440\u0435\u043A\u043B\u0430\u043C\u0430 \u0438 \u043F\u043B\u0430\u0442\u0435\u0436\u0438 \u0435\u0449\u0451 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u044B. \u0410\u043D\u0438\u043C\u0430\u0446\u0438\u044F \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439 \u043F\u043E\u043A\u0430 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0430.</p></div>`;
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
  function navigate(p) {
    page = p;
    document.querySelectorAll(".page").forEach((el) => el.hidden = el.id !== `${p}-page`);
    document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("active", b.dataset.page === p));
    $("#page-title").textContent = { map: "\u0413\u043E\u0440\u043E\u0434 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u0441\u043F\u0438\u0442.", gear: "\u0421\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u0440\u0435\u0448\u0430\u0435\u0442.", garage: "\u0414\u043E\u043C \u043D\u0430 \u0447\u0435\u0442\u044B\u0440\u0451\u0445 \u043A\u043E\u043B\u0451\u0441\u0430\u0445.", daily: "\u041A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C \u2014 \u043D\u043E\u0432\u0430\u044F \u0446\u0435\u043B\u044C.", guide: "\u0417\u043D\u0430\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0436\u0438\u0437\u043D\u044C.", raids: "\u041E\u0434\u0438\u043D \u0431\u043E\u0441\u0441. \u041E\u0431\u0449\u0430\u044F \u0446\u0435\u043B\u044C.", friends: "\u0421\u0432\u043E\u0438 \u043D\u0435 \u0431\u0440\u043E\u0441\u0430\u044E\u0442.", conflict: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0433\u043E\u0440\u043E\u0434\u0443 \u0441\u0432\u0435\u0442.", clans: "\u0412\u044B\u0436\u0438\u0432\u0430\u0435\u043C \u0432\u043C\u0435\u0441\u0442\u0435.", settings: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439 \u0441\u0432\u043E\u0439 \u0440\u0438\u0442\u043C." }[p];
    renderPage();
    if (p === "daily") bindAd($("#daily-page"), api, toast, refresh);
  }
  async function start() {
    if (!unlocked(save, selected)) return;
    let data = await api("run/start", { map: selected });
    let st = stats(save);
    run = { ticket: data.ticket, rank: expeditionRank(save), map: selected, hp: st.hp, maxHp: st.hp, x: 430, y: 410, face: 1, time: 0, wave: 0, enemies: [], shots: [], drops: [], particles: [], kills: 0, loot: 0, shotCd: 0.2, stamina: 100, exhausted: false, running: false, anim: 0, moving: false, travel: 0, transition: null, invulnerable: 0, paused: false, ended: false, next: 1, boss: false, damage: st.damage, speed: st.speed, lootMult: st.loot };
    background(bg.getContext("2d"), selected);
    sprintHeld = false;
    keys.clear();
    setSprint(false);
    stick = { x: 0, y: 0 };
    document.body.classList.add("in-battle");
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
        let type = i % 5 === 4 ? "tank" : i % 3 === 2 ? "runner" : "walker";
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
    let st = enemyStats(r.map, Math.min(r.wave, 3), type, r.rank);
    r.enemies.push({ x, y, type, ...st, maxHp: st.hp, cd: 1.8, flash: 0, attack: null });
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
    $("#wave-label").textContent = "\u041F\u0423\u0422\u042C \u0421\u0412\u041E\u0411\u041E\u0414\u0415\u041D \xB7 \u0414\u0412\u0418\u0416\u0415\u041C\u0421\u042F \u0414\u0410\u041B\u042C\u0428\u0415";
  }
  function movement() {
    return [(keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) + stick.x, (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) + stick.y];
  }
  function joystick(e) {
    if (e.pointerId !== pointer) return;
    let b = joy.getBoundingClientRect(), x = (e.clientX - b.left - b.width / 2) / (b.width * 0.36), y = (e.clientY - b.top - b.height / 2) / (b.height * 0.36), l = Math.max(1, Math.hypot(x, y));
    stick = { x: x / l, y: y / l };
    joy.firstElementChild.style.transform = `translate(${stick.x * 30}px,${stick.y * 30}px)`;
  }
  function pause() {
    if (!run || run.ended) return;
    run.paused = !run.paused;
    keys.clear();
    setSprint(false);
    stick = { x: 0, y: 0 };
    $("#overlay").hidden = !run.paused;
    if (run.paused) {
      $("#result-tag").textContent = "\u0421\u0412\u042F\u0417\u042C \u0421 \u0423\u0411\u0415\u0416\u0418\u0429\u0415\u041C";
      $("#result-title").textContent = "\u041F\u0435\u0440\u0435\u0434\u044B\u0448\u043A\u0430";
      $("#result-text").textContent = "\u0412\u044B\u043B\u0430\u0437\u043A\u0430 \u043F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430.\n\u041E\u0442\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442 35% \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u043D\u043D\u044B\u0445 \u0434\u0435\u0442\u0430\u043B\u0435\u0439.";
      $("#result-actions").innerHTML = '<button class="primary" id="resume">\u041F\u0420\u041E\u0414\u041E\u041B\u0416\u0418\u0422\u042C</button><button class="secondary" id="retreat">\u041E\u0422\u0421\u0422\u0423\u041F\u0418\u0422\u042C</button>';
      $("#resume").onclick = pause;
      $("#retreat").onclick = () => finish(false);
    }
  }
  function burst(x, y, color, n = 5) {
    if (!prefs.particles) return;
    for (let i = 0; i < n; i++) run.particles.push({ x, y: y - 20, vx: (Math.random() - 0.5) * 130, vy: (Math.random() - 0.5) * 100, life: 0.4, color });
  }
  function update(dt) {
    let r = run;
    if (!r || r.paused || r.ended) return;
    r.time += dt;
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
    r.y = Math.max(275, Math.min(535, r.y + dy / len * r.speed * 0.8 * sprint.multiplier * dt));
    if (dx) r.face = dx > 0 ? 1 : -1;
    if (!r.enemies.length) {
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
    let weapon = WEAPONS[save.weapon];
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
    for (let e of r.enemies) {
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
            r.hp -= e.damage * 1.6;
            r.invulnerable = 0.65;
          }
          burst(e.attack.x, e.attack.y, "#d2a270", 18);
          if (r.map === 3) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.03);
          if (r.map === 4 && r.enemies.length < 9) spawn("runner", Math.floor(r.time));
          e.attack = null;
        }
      } else if (dist > 22) {
        e.x += (r.x - e.x) / dist * e.speed * dt;
        e.y += (r.y - e.y) / dist * e.speed * 0.8 * dt;
      }
      if (dist < 25 && r.invulnerable <= 0) {
        r.hp -= e.damage;
        r.invulnerable = 0.65;
        burst(r.x, r.y, "#cf9b71", 6);
      }
    }
    for (let s of r.shots) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      for (let e of r.enemies) {
        if (e.hp <= 0) continue;
        if (Math.hypot(e.x - s.x, e.y - 55 - s.y) < (e.type === "boss" ? 29 : 18)) {
          e.hp -= s.damage;
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
      r.drops.push({ x: e.x, y: e.y, kind: "scrap", amount: 4 + Math.floor(Math.random() * 5) });
      if (Math.random() < 0.2) r.drops.push({ x: e.x + 14, y: e.y + 8, kind: "health" });
      burst(e.x, e.y, "#657554", 8);
    }
    r.enemies = r.enemies.filter((e) => e.hp > 0);
    for (let d of r.drops) {
      if (Math.hypot(d.x - r.x, d.y - r.y) < 33) {
        if (d.kind === "health") r.hp = Math.min(r.maxHp, r.hp + 28);
        else r.loot += d.amount;
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
    updateHud();
  }
  function updateHud() {
    let r = run;
    $("#hp-label").textContent = `${Math.max(0, Math.ceil(r.hp))} / ${r.maxHp}`;
    $("#hp-bar").style.width = `${Math.max(0, r.hp / r.maxHp * 100)}%`;
    $("#kill-label").textContent = `${r.kills} \u0423\u0421\u0422\u0420\u0410\u041D\u0415\u041D\u041E \xB7 ${r.loot} \u0414\u0415\u0422.`;
    $("#dash").innerHTML = (r.exhausted ? "\u041E\u0422\u0414\u042B\u0425" : r.running ? "\u0411\u0415\u0413" : "\u0411\u0415\u0416\u0410\u0422\u042C") + "<small>" + Math.ceil(r.stamina) + "%</small>";
    $("#dash").disabled = false;
    $("#stamina-fill").style.width = r.stamina + "%";
    $("#section-count").textContent = "\u0423\u0427\u0410\u0421\u0422\u041E\u041A " + Math.max(1, r.wave) + " / 3";
    let boss = r.enemies.find((e) => e.type === "boss");
    $("#boss-hud").hidden = !boss;
    if (boss) $("#boss-bar").style.width = `${Math.max(0, boss.hp / boss.maxHp * 100)}%`;
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
      if (e.attack) {
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
    let actors = [...r.enemies, { x: r.x, y: r.y, type: "hero" }].sort((a, b) => a.y - b.y);
    for (let e of actors) {
      let hero = e.type === "hero", scale = e.type === "boss" ? 2 : 1.15;
      if (hero && r.invulnerable > 0 && Math.floor(r.time * 20) % 2) continue;
      person(g, e.x, e.y, e.type, scale, hero ? r.anim : r.time, hero ? r.face : e.x > r.x ? -1 : 1, e.flash, hero ? r.moving : true, hero ? r.running : e.type === "runner");
      if (!hero && e.hp < e.maxHp) {
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
  async function finish(win) {
    let r = run;
    if (r.ended) return;
    r.ended = true;
    r.paused = false;
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
        $("#result-text").textContent = (result.win ? "\u0417\u0430\u0447\u0438\u0441\u0442\u043E\u043A \u0440\u0430\u0439\u043E\u043D\u0430: " + save.districtRuns[r.map] + " / 3. \u0411\u043E\u0441\u0441 \u0436\u0434\u0451\u0442 \u0432 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u043C \u0440\u0435\u0439\u0434\u0435." : "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E 35% \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u043D\u043D\u044B\u0445 \u0434\u0435\u0442\u0430\u043B\u0435\u0439.") + "\n+" + result.reward + " \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \xB7 +" + result.xp + " \u043E\u043F\u044B\u0442\u0430";
        $("#result-actions").innerHTML = '<button class="primary" id="return">\u0412 \u0423\u0411\u0415\u0416\u0418\u0429\u0415 \u2192</button>';
        $("#return").onclick = () => {
          $("#game").hidden = true;
          $("#overlay").hidden = true;
          document.body.classList.remove("in-battle");
          run = null;
          refresh();
        };
      } catch (e) {
        $("#result-title").textContent = "\u041D\u0435\u0442 \u0441\u0432\u044F\u0437\u0438";
        $("#result-text").textContent = e.message;
        $("#result-actions").innerHTML = '<button class="primary" id="retry-save">\u041F\u041E\u0412\u0422\u041E\u0420\u0418\u0422\u042C \u0421\u041E\u0425\u0420\u0410\u041D\u0415\u041D\u0418\u0415</button>';
        $("#retry-save").onclick = submit;
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
      let portrait = vw < 960;
      let vh = Math.min(600, Math.round(vw / ratio));
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }
      let left = portrait ? Math.max(0, Math.min(960 - vw, run.x - vw / 2)) : 0;
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
        rareMode = value;
        raid = null;
        renderRaids();
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
    el.innerHTML = '<div class="settings-layout"><div class="settings-card"><span class="eyebrow orange">\u0423\u041F\u0420\u0410\u0412\u041B\u0415\u041D\u0418\u0415 \u0418 \u042D\u041A\u0420\u0410\u041D</span><h2>\u041F\u043E\u0434 \u0442\u0435\u0431\u044F.</h2><p>\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u043D\u0430 \u044D\u0442\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435.</p>' + [["runToggle", "\u0411\u0435\u0433 \u043F\u043E \u043D\u0430\u0436\u0430\u0442\u0438\u044E", "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0431\u0435\u0433 \u043E\u0434\u043D\u0438\u043C \u043D\u0430\u0436\u0430\u0442\u0438\u0435\u043C \u0432\u043C\u0435\u0441\u0442\u043E \u0443\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u044F."], ["particles", "\u042D\u0444\u0444\u0435\u043A\u0442\u044B \u043F\u043E\u043F\u0430\u0434\u0430\u043D\u0438\u0439", "\u0427\u0430\u0441\u0442\u0438\u0446\u044B \u043E\u0442 \u043F\u043E\u043F\u0430\u0434\u0430\u043D\u0438\u0439 \u0438 \u0443\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0437\u0430\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0445."], ["contrast", "\u041F\u043E\u0432\u044B\u0448\u0435\u043D\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0440\u0430\u0441\u0442", "\u0411\u043E\u043B\u0435\u0435 \u0447\u0451\u0442\u043A\u0438\u0435 \u0433\u0440\u0430\u043D\u0438\u0446\u044B \u043F\u0430\u043D\u0435\u043B\u0435\u0439 \u0438 \u044F\u0440\u043A\u0438\u0435 \u043F\u043E\u0434\u043F\u0438\u0441\u0438."]].map(([k, title, desc]) => '<label class="setting-row"><span><b>' + title + "</b><small>" + desc + '</small></span><input type="checkbox" data-setting="' + k + '" ' + (prefs[k] ? "checked" : "") + "><i></i></label>").join("") + '</div><div class="settings-card controls-guide"><span class="eyebrow">\u041F\u041E\u041B\u0415\u0412\u0410\u042F \u041F\u0410\u041C\u042F\u0422\u041A\u0410</span><h3>\u0414\u0435\u0440\u0436\u0438 \u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u044E.</h3><p><kbd>W A S D</kbd> \u0438\u043B\u0438 \u0441\u0442\u0440\u0435\u043B\u043A\u0438 \u2014 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435</p><p><kbd>SHIFT</kbd> / <kbd>\u041F\u0420\u041E\u0411\u0415\u041B</kbd> \u2014 \u0431\u0435\u0433</p><p><kbd>ESC</kbd> \u2014 \u043F\u0430\u0443\u0437\u0430</p><p>\u041D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435: \u0434\u0436\u043E\u0439\u0441\u0442\u0438\u043A \u0441\u043B\u0435\u0432\u0430, \u0431\u0435\u0433 \u0441\u043F\u0440\u0430\u0432\u0430. \u0421\u0442\u0440\u0435\u043B\u044C\u0431\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F.</p><span class="settings-version">\u041E\u0411\u0418\u0422\u0415\u041B\u042C \xB7 \u0412\u0415\u0420\u0421\u0418\u042F 0.6</span></div></div>';
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
      document.body.classList.toggle("high-contrast", prefs.contrast);
      setSprint(false);
    });
  }
  async function initializeGame() {
    initLandscape();
    $("#retry-connection").onclick = connect;
    refresh();
    loadArt().then(refresh).catch(() => toast("\u0427\u0430\u0441\u0442\u044C \u0433\u0440\u0430\u0444\u0438\u043A\u0438 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0430\u0441\u044C. \u041C\u043E\u0436\u043D\u043E \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0438\u0433\u0440\u0443."));
    requestAnimationFrame(frame);
    await connect();
    setInterval(() => {
      if (!document.hidden && page === "raids") tickRaid($("#raids-page"), raid, save, serverOffset);
    }, 1e3);
    setInterval(() => {
      if (networkReady) energyHud();
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
  var playerProfile, $, key, save, selected, page, run, last, toastTimer, keys, stick, raid, serverOffset, networkReady, busy, sprintHeld, prefsKey, prefs, item, upgrade, itemArt, menuIcons, canvas, display, world, g, bg, pointer, joy, raidPolling, rareMode, raidNumber;
  var init_game = __esm({
    "game.js"() {
      init_landscape_ui();
      init_raid_view();
      init_garage_ui();
      init_onboarding();
      init_ads_ui();
      init_conflict_ui();
      init_profile_ui();
      init_clans_ui();
      init_friends_ui();
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
      selected = 0;
      page = "map";
      run = null;
      last = 0;
      keys = /* @__PURE__ */ new Set();
      stick = { x: 0, y: 0 };
      raid = null;
      serverOffset = 0;
      networkReady = false;
      busy = false;
      sprintHeld = false;
      prefsKey = "obitel-settings-v1";
      prefs = { particles: true, contrast: false, runToggle: false };
      try {
        prefs = { ...prefs, ...JSON.parse(localStorage.getItem(prefsKey) || "{}") };
      } catch (e) {
      }
      document.body.classList.toggle("high-contrast", prefs.contrast);
      item = (icon, title, badge, desc, action2) => `<article class="item"><div class="item-icon">${icon}</div><span class="badge">${badge}</span><h3>${title}</h3><p>${desc}</p>${action2}</article>`;
      upgrade = (field, name, desc) => item(field === "engine" ? "\u2699" : field === "trunk" ? "\u25A4" : "\u25C7", name, `\u0423\u0420\u041E\u0412\u0415\u041D\u042C ${save[field]} / 10`, desc, `<button class="primary" data-upgrade="${field}" ${save[field] >= 10 || save.scrap < upgradeCost(save[field]) ? "disabled" : ""}>${save[field] >= 10 ? "\u041C\u0410\u041A\u0421\u0418\u041C\u0423\u041C" : `\u0423\u041B\u0423\u0427\u0428\u0418\u0422\u042C \xB7 ${upgradeCost(save[field])} \u0414\u0415\u0422.`}</button>`);
      itemArt = (i) => '<canvas class="loot-art" data-item="' + i + '" width="180" height="180"></canvas>';
      menuIcons = { "map": "M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16", "gear": "M4 14l3-3 3 3 8-8 2 2-8 8 2 3-3 2-3-3-3 1-2-2z", "garage": "M4 15V9l3-5h10l3 5v6 M3 10h18v7H3z M6 17v3 M18 17v3 M6 13h2 M16 13h2", "daily": "M7 4H4v17h16V4h-3 M8 2h8v5H8z M8 11h8 M8 15h6", "raids": "M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6z M9 9l6 6 M15 9l-6 6", "guide": "M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3z M12 6v15", "settings": "M9 3h6l1 4 4 1v8l-4 1-1 4H9l-1-4-4-1V8l4-1z M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0" };
      document.querySelectorAll("nav [data-page]").forEach((b) => b.querySelector("span").innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (menuIcons[b.dataset.page] || "M4 20v-6h16v6 M8 14V8h8v6 M12 2v6") + '"/></svg>');
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
      addEventListener("keydown", (e) => {
        if ($("#game").hidden) return;
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
        keys.add(e.code);
        if (["ShiftLeft", "ShiftRight", "Space"].includes(e.code) && !e.repeat) {
          setSprint(prefs.runToggle ? !sprintHeld : true);
        }
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
        if (pointer !== null) return;
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
