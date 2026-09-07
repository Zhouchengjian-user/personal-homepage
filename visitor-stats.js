/* Public Site Counter protocol adapted from https://github.com/qiushaocloud/site-counter.
 * ISC License — Copyright (c) 2022, qiushaocloud
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
(() => {
  const host = 'zhouchengjian-user.github.io';
  const path = '/personal-homepage/';
  const status = document.getElementById('visitor-stats-status');
  if (!status) return;
  if (location.hostname !== host || ![path, path + 'index.html'].includes(location.pathname)) {
    status.textContent = '本地预览不计入访问统计';
    return;
  }
  // Only the canonical homepage is sent; query strings and section hashes are excluded.
  const storageKey = 'homepage-visitor-day-v1';
  const day = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());

  function sign(data) {
    // This is the provider's PUBLIC browser protocol identifier, not a private credential.
    const chars = 'RLU_VJAS_EMSUG';
    const offset = [...chars].reduce((sum, ch) => sum + 39 * ch.charCodeAt(0) - ch.charCodeAt(0) % 5, 0);
    const codes = '43974-43966-43978-43988-43976-43965-43958-43972-43988-43960-43969-43972-43978-43961-43988-43976-43962-43960-43975-43962-43977-43988-43968-43962-43982';
    const key = host + codes.split('-').map(code => String.fromCharCode(Number(code) - offset)).join('');
    const value = Object.keys(data).sort().map(name => name + data[name]).join('');
    let result = data.nonce_ts;
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      const index = code % key.length;
      result += code * index * (key.charCodeAt(index) + code) + result % code;
    }
    return data.nonce_ts + '_' + result;
  }

  async function count() {
    const today = day();
    const previousDay = localStorage.getItem(storageKey);
    const data = {
      site_host: host,
      site_page_pathname: path,
      is_incr_site: false,
      is_incr_page: true,
      // Upstream page UV requires BOTH history flags, even when site PV is disabled.
      is_histroy_session: previousDay === today,
      is_histroy_session_page: previousDay === today,
      href: 'https://' + host + path,
      nonce_ts: Date.now(),
      nonce: Math.random().toString(36).slice(2, 12)
    };
    data.sign = sign(data);
    const body = new FormData();
    Object.entries(data).forEach(([name, value]) => body.append(name, String(value)));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('https://www.qiushaocloud.top/site_counter', {
        method: 'POST', body, credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal
      });
      if (!response.ok) throw new Error('Statistics unavailable');
      const result = await response.json();
      const counts = [result.page_uv, result.page_pv, result.yesterday?.page_uv, result.yesterday?.page_pv];
      if (!counts.every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error('Invalid statistics');
      const todayUV = result.page_uv - result.yesterday.page_uv;
      const todayPV = result.page_pv - result.yesterday.page_pv;
      if (todayUV < 0 || todayPV < 0 || todayUV > todayPV) throw new Error('Invalid daily statistics');
      localStorage.setItem(storageKey, today);
      document.getElementById('visitors-today').textContent = todayUV.toLocaleString('zh-CN');
      document.getElementById('views-today').textContent = todayPV.toLocaleString('zh-CN');
      document.getElementById('views-total').textContent = result.page_pv.toLocaleString('zh-CN');
      status.textContent = '同一浏览器当日去重 · 自接入日起统计';
    } finally {
      clearTimeout(timeout);
    }
  }

  // Serialize simultaneous tabs so the same browser does not register twice that day.
  const request = navigator.locks
    ? navigator.locks.request(storageKey, count)
    : Promise.resolve().then(count);
  request.catch(() => {
    status.textContent = '统计暂时不可用，请稍后刷新';
  });
})();
