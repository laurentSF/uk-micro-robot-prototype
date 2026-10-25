/* River Lane Coffee — shared prototype state (localStorage) */
(function (global) {
  "use strict";

  var STORAGE_KEY = "rlc_proto_v1";

  var DEFAULT_MENU = [
    { id: "m1", name: "Flat White", desc: "Double shot, silky milk", price: 3.4, cat: "Coffee", avail: true, emoji: "☕" },
    { id: "m2", name: "Cappuccino", desc: "Foam + cocoa dust", price: 3.5, cat: "Coffee", avail: true, emoji: "☕" },
    { id: "m3", name: "Filter of the day", desc: "Single-origin pour-over", price: 3.2, cat: "Coffee", avail: true, emoji: "🫘" },
    { id: "m4", name: "Chai Latte", desc: "Spiced, oat milk ok", price: 3.6, cat: "Coffee", avail: true, emoji: "🍵" },
    { id: "m5", name: "Banana bread", desc: "Warm, with butter", price: 3.0, cat: "Food", avail: true, emoji: "🍌" },
    { id: "m6", name: "Croissant", desc: "Butter, baked this morning", price: 2.8, cat: "Food", avail: true, emoji: "🥐" },
    { id: "m7", name: "Avocado toast", desc: "Sourdough, chilli flakes", price: 6.5, cat: "Food", avail: true, emoji: "🥑" },
    { id: "m8", name: "Still water", desc: "500ml", price: 1.5, cat: "Drinks", avail: true, emoji: "💧" }
  ];

  var DEFAULT_AGENTS = {
    sales: true,
    insights: true,
    accountant: true,
    marketing: true,
    orders: true,
    loyalty: true
  };

  var DEFAULT_QUEUE = [
    {
      id: "q1",
      agent: "Marketing",
      title: "Google Business post — Tuesday quiet hour",
      draft: "Quiet mid-morning? Grab a flat white and banana bread — show this post for 10% off before 11am. See you on River Lane ☕",
      status: "pending"
    },
    {
      id: "q2",
      agent: "Insights",
      title: "Weekly insight — oat milk & repeats",
      draft: "Oat flat whites are +18% vs last week. Guests with 6+ stamps return within 5 days on average. Try: ‘1 stamp away’ nudge to the 12 guests at 8/9 (consented only).",
      status: "pending"
    },
    {
      id: "q3",
      agent: "Marketing",
      title: "Loyalty winback (PECR-safe)",
      draft: "Hi {{name}} — you’re 1 stamp from a free coffee at River Lane. Valid this week. Reply STOP to opt out.",
      status: "pending"
    }
  ];

  function defaultState() {
    return {
      menu: DEFAULT_MENU.map(function (m) { return Object.assign({}, m); }),
      agents: Object.assign({}, DEFAULT_AGENTS),
      loyaltyRule: { stampsNeeded: 9, rewardLabel: "1 free coffee" },
      loyaltyMembers: {
        guest_demo: { name: "Alex (you)", stamps: 3, phone: "+44 7700 900123" }
      },
      orders: [],
      queue: DEFAULT_QUEUE.map(function (q) { return Object.assign({}, q); }),
      siteJoined: false
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var parsed = JSON.parse(raw);
      var base = defaultState();
      return {
        menu: parsed.menu || base.menu,
        agents: Object.assign({}, base.agents, parsed.agents || {}),
        loyaltyRule: Object.assign({}, base.loyaltyRule, parsed.loyaltyRule || {}),
        loyaltyMembers: parsed.loyaltyMembers || base.loyaltyMembers,
        orders: parsed.orders || [],
        queue: parsed.queue || base.queue,
        siteJoined: !!parsed.siteJoined
      };
    } catch (e) {
      return defaultState();
    }
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    try {
      global.dispatchEvent(new CustomEvent("rlc-state", { detail: state }));
    } catch (e) { /* old browsers */ }
  }

  function getState() { return load(); }

  function update(mutator) {
    var state = load();
    mutator(state);
    save(state);
    return state;
  }

  function money(n) {
    return "£" + Number(n).toFixed(2);
  }

  function uid(prefix) {
    return (prefix || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function formatTime(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 2800);
  }

  function placeOrder(opts) {
    /* opts: { guest, items:[{id,name,price,qty}], channel, pay, pickup, notes, stamp } */
    var orderId = uid("ord");
    var total = 0;
    var lines = (opts.items || []).map(function (it) {
      total += it.price * (it.qty || 1);
      return { id: it.id, name: it.name, price: it.price, qty: it.qty || 1 };
    });
    var order = {
      id: orderId,
      guest: opts.guest || "Guest",
      items: lines,
      total: Math.round(total * 100) / 100,
      channel: opts.channel || "whatsapp",
      pay: opts.pay || "pay-at-pickup",
      pickup: opts.pickup || "ASAP",
      notes: opts.notes || "",
      status: "new",
      stamped: false,
      createdAt: new Date().toISOString()
    };

    update(function (s) {
      s.orders.unshift(order);
      if (opts.stamp !== false && s.agents.loyalty) {
        var mid = opts.memberId || "guest_demo";
        if (!s.loyaltyMembers[mid]) {
          s.loyaltyMembers[mid] = { name: opts.guest || "Guest", stamps: 0, phone: "" };
        }
        var member = s.loyaltyMembers[mid];
        var needed = s.loyaltyRule.stampsNeeded || 9;
        /* count coffee-ish items for stamps */
        var coffeeCats = { Coffee: true };
        var stampsEarn = 0;
        lines.forEach(function (l) {
          var menuItem = s.menu.find(function (m) { return m.id === l.id; });
          if (menuItem && coffeeCats[menuItem.cat]) stampsEarn += l.qty;
          else if (!menuItem && /coffee|flat|capp|latte|filter|chai/i.test(l.name)) stampsEarn += l.qty;
        });
        if (stampsEarn === 0 && lines.length) stampsEarn = 1; /* at least one stamp for any order in demo */
        member.stamps = Math.min(needed, (member.stamps || 0) + stampsEarn);
        order.stamped = true;
        order.stampsAfter = member.stamps;
      }
    });

    return order;
  }

  function markOrder(id, status) {
    update(function (s) {
      s.orders.forEach(function (o) {
        if (o.id === id) o.status = status;
      });
    });
  }

  function approveQueue(id, approve) {
    update(function (s) {
      s.queue.forEach(function (q) {
        if (q.id === id) q.status = approve ? "approved" : "rejected";
      });
    });
  }

  function setAgent(key, on) {
    update(function (s) { s.agents[key] = !!on; });
  }

  function setMenu(menu) {
    update(function (s) { s.menu = menu; });
  }

  function setLoyaltyRule(stampsNeeded, rewardLabel) {
    update(function (s) {
      s.loyaltyRule.stampsNeeded = Number(stampsNeeded) || 9;
      if (rewardLabel) s.loyaltyRule.rewardLabel = rewardLabel;
    });
  }

  function joinLoyalty(name) {
    update(function (s) {
      s.siteJoined = true;
      if (!s.loyaltyMembers.guest_demo) {
        s.loyaltyMembers.guest_demo = { name: name || "Alex (you)", stamps: 0, phone: "" };
      } else if (name) {
        s.loyaltyMembers.guest_demo.name = name;
      }
    });
  }

  function resetDemo() {
    localStorage.removeItem(STORAGE_KEY);
    toast("Demo reset — reload pages to see defaults");
    return defaultState();
  }

  function availableMenu() {
    return load().menu.filter(function (m) { return m.avail !== false; });
  }

  global.RLC = {
    load: load,
    getState: getState,
    update: update,
    save: save,
    money: money,
    uid: uid,
    formatTime: formatTime,
    toast: toast,
    placeOrder: placeOrder,
    markOrder: markOrder,
    approveQueue: approveQueue,
    setAgent: setAgent,
    setMenu: setMenu,
    setLoyaltyRule: setLoyaltyRule,
    joinLoyalty: joinLoyalty,
    resetDemo: resetDemo,
    availableMenu: availableMenu,
    DEFAULT_MENU: DEFAULT_MENU
  };
})(window);
