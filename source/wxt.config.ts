import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: '广告净化',
    short_name: '广告净化',
    description: '减少常见广告请求，并可逆隐藏高置信广告容器。',
    version: '0.1.0',
    minimum_chrome_version: '121',
    permissions: ['storage', 'tabs', 'declarativeNetRequest'],
    options_ui: { page: 'options.html', open_in_tab: true },
    declarative_net_request: {
      rule_resources: [{ id: 'core', enabled: true, path: 'rules/network-rules.json' }],
    },
  },
});
