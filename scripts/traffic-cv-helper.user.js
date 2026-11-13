// UserScript

// @name         Traffic.cv Compact Badge & Exporter

// @namespace    http://tampermonkey.net/

// @version      21.0

// @description  Compact and lightweight floating badge with clean iframe modal and Markdown export.

// @match        :///*

// @grant        GM_setValue

// @grant        GM_getValue

// @run-at       document-start

// /UserScript

(function() {

'use strict';

// 如果在 traffic.cv 内部，自动注入 CSS 隐藏头尾、侧边栏

if (window.location.hostname.includes('traffic.cv')) {

    const cleanStyle = document.createElement('style');

    cleanStyle.innerHTML = `

        header, footer, aside, nav { display: none !important; }

        body, html { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }

        main { width: 100% !important; max-width: 100% !important; padding: 16px !important; margin: 0 !important; }

    `;

    window.addEventListener('DOMContentLoaded', () => document.head.appendChild(cleanStyle));

    if (document.head) document.head.appendChild(cleanStyle);

    return;

}

window.addEventListener('DOMContentLoaded', initPlugin);

if (document.readyState === 'complete' || document.readyState === 'interactive') {

    setTimeout(initPlugin, 300);

}

function initPlugin() {

    if (document.getElementById('traffic-cv-badge')) return;

    let rawHostname = window.location.hostname;

    if (!rawHostname || rawHostname.includes('localhost') || rawHostname.startsWith('192.') || rawHostname.startsWith('127.')) {

        return;

    }

    const domain = rawHostname.replace(/^www\./, '');

    // 1. 自动记录访问历史，并检查是否满 10 个

    checkAndRecordVisit(domain);

    // 2. 创建极简、小巧的悬浮按钮

    const badge = document.createElement('div');

    badge.id = 'traffic-cv-badge';

    badge.style.cssText = `

        position: fixed !important;

        bottom: 24px !important;

        right: 16px !important;

        z-index: 2147483647 !important;

        background: rgba(17, 17, 17, 0.85) !important;

        backdrop-filter: blur(8px) !important;

        color: #ffffff !important;

        padding: 6px 12px !important;

        border-radius: 20px !important;

        font-size: 11px !important;

        font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;

        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;

        cursor: pointer !important;

        display: flex !important;

        align-items: center !important;

        gap: 6px !important;

        border: 1px solid rgba(255,255,255,0.15) !important;

        opacity: 0.9;

        transition: opacity 0.2s;

    `;

    badge.innerHTML = `

        <span style="width: 6px; height: 6px; background: #10B981; border-radius: 50%; display:inline-block;"></span>

        <span style="color: #fff; font-weight: 500;">📊 查流量</span>

    `;

    

    badge.onmouseover = () => badge.style.opacity = '1';

    badge.onmouseout = () => badge.style.opacity = '0.9';

    // 3. 点击时打开 traffic.cv 弹窗

    badge.onclick = () => {

        showTrafficModal(domain);

    };

    document.body.appendChild(badge);

}

function checkAndRecordVisit(domain) {

    const today = new Date().toISOString().slice(0, 10);

    let history = GM_getValue('traffic_history', {});

    if (!history[today]) history[today] = [];

    if (!history[today].includes(domain)) {

        history[today].push(domain);

        GM_setValue('traffic_history', history);

        if (history[today].length === 10 && !GM_getValue('notified_' + today, false)) {

            GM_setValue('notified_' + today, true);

            setTimeout(() => {

                alert(`🎉 恭喜！你今天已经累计浏览了 10 个 SEO 目标网站，快去导出 Markdown 报告吧！`);

                showStatsModal();

            }, 1000);

        }

    }

}

function showTrafficModal(domain) {

    let modalOverlay = document.getElementById('traffic-cv-modal-overlay');

    if (!modalOverlay) {

        modalOverlay = document.createElement('div');

        modalOverlay.id = 'traffic-cv-modal-overlay';

        modalOverlay.style.cssText = `

            position: fixed !important;

            top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important;

            background: rgba(0,0,0,0.6) !important;

            backdrop-filter: blur(4px) !important;

            z-index: 2147483647 !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            padding: 12px !important;

        `;

        modalOverlay.onclick = (e) => {

            if (e.target === modalOverlay) modalOverlay.style.display = 'none';

        };

        document.body.appendChild(modalOverlay);

    }

    modalOverlay.innerHTML = `

        <div style="background: #ffffff; width: 100%; max-width: 380px; height: 78vh; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.3);">

            <div style="padding: 10px 14px; background: #0f172a; color: #fff; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">

                <div style="font-size: 12px; font-weight: 600;">

                    <span>📊 ${domain} 流量报告</span>

                </div>

                <div style="display:flex; gap:6px; align-items:center;">

                    <button id="view-stats-btn" style="background:#334155; color:#fff; border:none; padding:3px 6px; border-radius:4px; font-size:10px; cursor:pointer;">今日统计 (${getTodayCount()})</button>

                    <button id="close-modal-btn" style="background:none; border:none; font-size:18px; color:#cbd5e1; cursor:pointer; line-height:1;">&times;</button>

                </div>

            </div>

            <div style="flex: 1; background: #ffffff; position: relative; overflow: hidden;">

                <iframe src="https://traffic.cv/${domain}" style="width: 100%; height: 100%; border: none;"></iframe>

            </div>

        </div>

    `;

    modalOverlay.style.display = 'flex';

    document.getElementById('close-modal-btn').onclick = () => {

        modalOverlay.style.display = 'none';

    };

    document.getElementById('view-stats-btn').onclick = () => {

        showStatsModal();

    };

}

function getTodayCount() {

    const today = new Date().toISOString().slice(0, 10);

    let history = GM_getValue('traffic_history', {});

    return history[today] ? history[today].length : 0;

}

function showStatsModal() {

    const today = new Date().toISOString().slice(0, 10);

    let history = GM_getValue('traffic_history', {});

    let domains = history[today] || [];

    let listHtml = domains.map((d, index) => `

        <tr style="border-bottom: 1px solid #f1f5f9;">

            <td style="padding: 5px 6px; color: #94a3b8; width: 20px;">${index + 1}.</td>

            <td style="padding: 5px 6px; color: #334155; font-weight: 500; font-size: 11px;">${d}</td>

            <td style="padding: 5px 6px; color: #0ea5e9; text-align: right; font-size: 11px;"><a href="https://traffic.cv/${d}" target="_blank" style="color:inherit; text-decoration:none;">查看 ↗</a></td>

        </tr>

    `).join('');

    if (domains.length === 0) {

        listHtml = '<tr><td colspan="3" style="padding: 10px; text-align:center; color:#64748b; font-size: 11px;">今天还没有记录到浏览网站。</td></tr>';

    }

    const modalOverlay = document.getElementById('traffic-cv-modal-overlay');

    modalOverlay.innerHTML = `

        <div style="background: #ffffff; width: 100%; max-width: 350px; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">

            <div style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">

                <h3 style="margin: 0; font-size: 13px; color: #0f172a; font-weight: 600;">📅 今日查看网站统计</h3>

                <button id="close-stats" style="background:none; border:none; font-size:16px; color:#94a3b8; cursor:pointer;">&times;</button>

            </div>

            <div style="padding: 14px;">

                <div style="margin-bottom: 8px; font-size: 12px; color: #0f172a; font-weight: 600;">

                    今日已访问：<span style="color: #10B981;">${domains.length} 个</span> 网站

                </div>

                <div style="max-height: 160px; overflow-y: auto; border: 1px solid #f1f5f9; border-radius: 6px; background: #f8fafc; margin-bottom: 12px;">

                    <table style="width: 100%; border-collapse: collapse;">

                       <tbody>${listHtml}</tbody>

                    </table>

                </div>

                <div style="display: flex; gap: 6px;">

                    <button id="export-md-btn" style="flex: 1; background: #10B981; color: #fff; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 600;">📥 导出 Markdown 报告</button>

                    <button id="close-stats-btn" style="background: #0f172a; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 600;">关闭</button>

                </div>

            </div>

        </div>

    `;

    document.getElementById('close-stats').onclick = () => { modalOverlay.style.display = 'none'; };

    document.getElementById('close-stats-btn').onclick = () => { modalOverlay.style.display = 'none'; };

    document.getElementById('export-md-btn').onclick = () => { exportMarkdown(today, domains); };

}

function exportMarkdown(date, domains) {

    let mdContent = `# SEO 流量调研与浏览报告\n\n`;

    mdContent += `- **导出日期**: ${date}\n`;

    mdContent += `- **总访问网站数**: ${domains.length} 个\n\n`;

    mdContent += `## 📋 调研明细表\n\n`;

    mdContent += `| 序号 | 目标网址 (Domain) | 月访问量/关键词备注 | 详情链接 |\n`;

    mdContent += `| :--- | :--- | :--- | :--- |\n`;

    domains.forEach((d, index) => {

        mdContent += `| ${index + 1} | \`${d}\` | (在此处填写/粘贴查看后的数据) | [查看 Traffic.cv 报告](https://traffic.cv/${d}) |\n`;

    });

    mdContent += `\n\n> 本报告由 iPhone Safari 油猴脚本自动生成于 ${new Date().toLocaleString()}。`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = `SEO-Traffic-Report-${date}.md`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

}
})();
