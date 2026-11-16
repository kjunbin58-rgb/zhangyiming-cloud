/* 一鸣出海 · 站点交互 */
(function () {
  /* 滚动渐显 */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach(function (el) {
        if (el.dataset.done) return;
        el.dataset.done = 1;
        var to = parseFloat(el.dataset.count), t0 = performance.now();
        (function tick(t) {
          var p = Math.min((t - t0) / 1600, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
      io.unobserve(e.target);
    });
  }, { threshold: 0.02, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* 移动端菜单 */
  var burger = document.querySelector('.burger');
  var menu = document.querySelector('.menu');
  if (burger && menu) {
    burger.addEventListener('click', function () { menu.classList.toggle('open'); });
    menu.querySelectorAll('.has-sub > a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (window.innerWidth <= 1024) { e.preventDefault(); a.parentElement.classList.toggle('expand'); }
      });
    });
  }

  /* 手风琴 */
  document.querySelectorAll('.acc-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.parentElement, was = item.classList.contains('open');
      item.parentElement.querySelectorAll('.acc-item').forEach(function (i) { i.classList.remove('open'); });
      if (!was) item.classList.add('open');
    });
  });

  /* 新闻分类筛选 + 分页 */
  var tabs = document.querySelectorAll('.tab[data-cat]');
  if (tabs.length) {
    var list = document.querySelector('.news-list');
    var rows = [].slice.call(document.querySelectorAll('.news-row[data-cat]'));
    var PSIZE = 12, cur = 1, cat = 'all';
    var pager = document.getElementById('newsPagerSlot');
    /* 自愈兜底：自动发文会用构建模板重建列表页；即便模板被旧版覆盖，
       这里也会移除渐显类并补建分页容器，杜绝白屏和一次性全量展示。 */
    if (list) {
      list.classList.remove('reveal');
      list.style.opacity = '1';
      list.style.transform = 'none';
      if (!pager) {
        pager = document.createElement('div');
        pager.id = 'newsPagerSlot';
        list.parentNode.insertBefore(pager, list.nextSibling);
      }
    }
    /* 分页器文案跟随页面语言，避免在 en/th/id 页出现中文 */
    var pgLang = (document.documentElement.lang || 'zh-CN').toLowerCase();
    var pgInfo = {
      'zh-cn': function (n, c, p) { return '共 ' + n + ' 篇 · 第 ' + c + ' / ' + p + ' 页'; },
      'en': function (n, c, p) { return n + ' articles · Page ' + c + ' of ' + p; },
      'th': function (n, c, p) { return 'บทความ ' + n + ' รายการ · หน้า ' + c + ' / ' + p; },
      'id': function (n, c, p) { return n + ' artikel · Halaman ' + c + ' dari ' + p; }
    }[pgLang] || function (n, c, p) { return '共 ' + n + ' 篇 · 第 ' + c + ' / ' + p + ' 页'; };
    var pgPrev = { 'zh-cn': '上一页', 'en': 'Prev', 'th': 'ก่อนหน้า', 'id': 'Sebelumnya' }[pgLang] || '上一页';
    var pgNext = { 'zh-cn': '下一页', 'en': 'Next', 'th': 'ถัดไป', 'id': 'Berikutnya' }[pgLang] || '下一页';
    if (pager && list && rows.length) {
      var apply = function (scroll) {
        var shown = rows.filter(function (r) { return cat === 'all' || r.dataset.cat === cat; });
        var pages = Math.max(1, Math.ceil(shown.length / PSIZE));
        if (cur > pages) cur = pages;
        rows.forEach(function (r) { r.style.display = 'none'; });
        shown.slice((cur - 1) * PSIZE, cur * PSIZE).forEach(function (r) { r.style.display = 'grid'; });
        var btns = '';
        for (var i = 1; i <= pages; i++) btns += '<button type="button" class="pg-num' + (i === cur ? ' active' : '') + '" data-p="' + i + '">' + i + '</button>';
        pager.innerHTML = '<div class="news-pager"><span class="pg-info">' + pgInfo(shown.length, cur, pages) + '</span>'
          + '<span class="pg-btns"><button type="button" class="pg-nav" data-d="-1"' + (cur <= 1 ? ' disabled' : '') + '>' + pgPrev + '</button>' + btns
          + '<button type="button" class="pg-nav" data-d="1"' + (cur >= pages ? ' disabled' : '') + '>' + pgNext + '</button></span></div>';
        pager.style.display = pages > 1 ? 'block' : 'none';
        if (scroll) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      tabs.forEach(function (t) {
        t.addEventListener('click', function () {
          tabs.forEach(function (x) { x.classList.remove('active'); });
          t.classList.add('active');
          cat = t.dataset.cat; cur = 1;
          apply(false);
        });
      });
      pager.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b || b.disabled) return;
        if (b.dataset.p) cur = +b.dataset.p;
        else if (b.dataset.d) cur += +b.dataset.d;
        if (cur < 1) cur = 1;
        apply(true);
      });
      apply(false);
      /* 通过锚点直达分类（news.html#guide / #industry / #policy） */
      if (/guide|industry|policy/.test(location.hash)) {
        var tg = document.querySelector('.tab[data-cat="' + location.hash.slice(1) + '"]');
        if (tg) tg.click();
      }
    }
  }

  /* 回到顶部 */
  var bt = document.querySelector('.backtop');
  if (bt) {
    window.addEventListener('scroll', function () {
      bt.classList.toggle('show', window.scrollY > 640);
    }, { passive: true });
    bt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* 顶部滚动进度 */
  var sb = document.querySelector('.scrollbar');
  if (sb) {
    var raf = false;
    var upd = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      sb.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
      raf = false;
    };
    window.addEventListener('scroll', function () {
      if (!raf) { raf = true; requestAnimationFrame(upd); }
    }, { passive: true });
    upd();
  }

  /* 导航滚动投影 */
  var navEl = document.querySelector('.nav');
  if (navEl) {
    window.addEventListener('scroll', function () {
      navEl.classList.toggle('scrolled', window.scrollY > 12);
    }, { passive: true });
  }

  /* 表单提交：静态托管下由 FormSubmit 转发到邮箱。
     后端恢复后把 LEAD_API 改回 'api/lead' 即可，降级分支自动失效。
     _captcha=false 必须带：FormSubmit 默认开启验证码，AJAX 提交会被挡。 */
  var toast = document.querySelector('.toast');
  function showToast(msg, ms) {
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(function () { toast.classList.remove('show'); }, ms || 3600);
    }
  }
  var LEAD_API = 'https://formsubmit.co/ajax/dsp592@88.com';
  var CONTACT_MAIL = 'dsp592@88.com';
  var CONTACT_TEL = '400-789-136';
  /* 第三方不可用时的兜底：把填写内容复制到剪贴板，线索不至于凭空丢掉 */
  function copyLead(data, isSub) {
    var lines = Object.keys(data).map(function (k) { return k + '：' + data[k]; });
    var text = (isSub ? '【官网简报订阅】' : '【官网咨询表单】') + '\n' + lines.join('\n');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {});
      }
    } catch (e) {}
  }
  document.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = f.querySelector('button[type="submit"]');
      var data = {};
      var labels = {};
      f.querySelectorAll('[name],input,select,textarea').forEach(function (el) {
        var key = el.closest('.field') ? (el.closest('.field').querySelector('label') || {}).textContent : '';
        key = (key || el.name || el.placeholder || '字段').replace(/[*：:]\s*$/, '').trim();
        var val = (el.value || '').trim();
        if (val) data[key + (labels[key] ? '_' + (++labels[key]) : '')] = val, labels[key] = labels[key] || 1;
      });
      data['提交页面'] = location.pathname;
      var isSub = f.getAttribute('data-subscribe') != null; // 订阅简报表单
      if (isSub) data['提交类型'] = '简报订阅';
      var payload = {};
      Object.keys(data).forEach(function (k) { payload[k] = data[k]; });
      payload['_subject'] = isSub ? '官网简报订阅' : '官网新线索（' + location.hostname + '）';
      payload['_captcha'] = 'false';
      payload['_template'] = 'table';
      if (btn) { btn.disabled = true; btn.style.opacity = .6; }
      function fallback() {
        copyLead(data, isSub);
        showToast('在线提交暂不可用，已复制您填写的内容。请拨打电话 ' + CONTACT_TEL +
                  '，或粘贴到微信/邮件发至 ' + CONTACT_MAIL, 9000);
      }
      fetch(LEAD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok && j.ok !== false && j.success !== false && j.success !== 'false' };
        }).catch(function () { return { ok: r.ok }; });
      })
        .then(function (res) {
          if (res.ok) {
            showToast(isSub ? '订阅成功！每月合规简报将发送至您的邮箱' : '已收到您的信息，顾问将在 1 个工作日内联系您');
            f.reset();
          } else {
            fallback();
          }
        })
        .catch(function () { fallback(); })
        .finally(function () { if (btn) { btn.disabled = false; btn.style.opacity = ''; } });
    });
  });
})();

  /* 服务版图交互 */
  var MAP_DATA = {
    philippines:{name:'菲律宾',en:'Philippines',img:'assets/country-ph.jpg',link:'certification-philippines-fda.html',
      list:['FDA 认证：食品 / 化妆品 / 器械 LTO 与 CPR','PS / ICC 认证：电子电器产品','SEC / DTI 公司注册与变更','BIR 税务登记与申报']},
    indonesia:{name:'印度尼西亚',en:'Indonesia',img:'assets/country-id.jpg',link:'product-certification.html',
      list:['BPOM：食品 / 保健品 / 化妆品','SNI 强制性国标认证','SDPPI：无线与通信设备','PT PMA 外资公司设立与税务']},
    thailand:{name:'泰国',en:'Thailand',img:'assets/country-th.jpg',link:'product-certification.html',
      list:['泰国 FDA：食品 / 化妆品 / 药品','TISI 工业标准认证','外资公司注册与牌照','税务申报与年审']},
    vietnam:{name:'越南',en:'Vietnam',img:'assets/country-vn.jpg',link:'product-certification.html',
      list:['工贸部 / MIC 产品认证','公司注册与投资许可','税务与劳动合规','商标注册与维权']},
    malaysia:{name:'马来西亚',en:'Malaysia',img:'assets/country-my.jpg',link:'product-certification.html',
      list:['SIRIM 电气产品认证','MDA 医疗器械 / NPRA 注册','Sdn Bhd 公司注册','MCMC 通信设备认证']},
    singapore:{name:'新加坡',en:'Singapore',img:'assets/country-sg.jpg',link:'business-registration.html',
      list:['ACRA 公司注册','商标注册与知识产权','税务合规与年审','银行开户协助']}
  };
  var mapDots = document.querySelectorAll('.map-dot');
  if (mapDots.length) {
    var mp = document.getElementById('mapPhoto'),
        mn = document.getElementById('mapName'),
        ml = document.getElementById('mapList'),
        mk = document.getElementById('mapLink');
    var renderCountry = function (key) {
      var d = MAP_DATA[key]; if (!d) return;
      mp.src = d.img; mp.alt = d.name;
      mn.innerHTML = d.name + ' <em>' + d.en + '</em>';
      ml.innerHTML = d.list.map(function (t) { return '<li>' + t + '</li>'; }).join('');
      mk.href = d.link;
      var side = mp.closest('.map-side');
      side.classList.remove('map-fade'); void side.offsetWidth; side.classList.add('map-fade');
    };
    mapDots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        mapDots.forEach(function (d) { d.classList.remove('active'); });
        dot.classList.add('active');
        renderCountry(dot.dataset.key);
      });
    });
    // 默认选中菲律宾
    mapDots.forEach(function (d) { d.classList.toggle('active', d.dataset.key === 'philippines'); });
    renderCountry('philippines');
  }


/* 联系页地图新址自愈（2026-11-12）：旧模板或缓存带回旧坐标时自动校正 */
(function () {
  var YM_NEW = [24.572606, 118.240042];
  function ymFix() {
    if (!document.getElementById('ymap') || typeof window.L === 'undefined' || !window.ymap) return;
    try {
      var m = window.ymap, c = m.getCenter();
      if (Math.abs(c.lat - YM_NEW[0]) > 0.0005 || Math.abs(c.lng - YM_NEW[1]) > 0.0005) {
        m.setView(YM_NEW, 16);
        m.eachLayer(function (l) { if (l instanceof L.Marker) l.setLatLng(YM_NEW); });
      }
    } catch (e) {}
  }
  window.addEventListener('load', function () { setTimeout(ymFix, 800); });
})();
