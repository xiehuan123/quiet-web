import { describe, expect, it } from 'vitest';
import cases from './network-cases.json';
import rules from '../public/rules/network-rules.json';
import { evaluateRequestAgainstRules, validateNetworkRules, type NetworkRequest, type NetworkRule } from '../lib/network-policy';

describe('production network policy', () => {
  it('blocks every declared advertising subresource case', () => {
    for (const request of cases.blocked) {
      expect(evaluateRequestAgainstRules(request as NetworkRequest, rules as NetworkRule[]), request.url).toEqual({
        action: 'block',
        ruleId: expect.any(Number),
      });
    }
  });

  it('allows similar legitimate URLs and every top-level navigation', () => {
    for (const request of cases.allowed) {
      expect(evaluateRequestAgainstRules(request as NetworkRequest, rules as NetworkRule[]), request.url).toEqual({ action: 'allow' });
    }
  });

  it('ships a small, structurally safe rule set', () => {
    expect(validateNetworkRules(rules as NetworkRule[])).toEqual([]);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.length).toBeLessThanOrEqual(20);
  });
});
