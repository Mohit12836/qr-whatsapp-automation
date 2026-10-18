import { describe, it, expect, beforeEach } from 'vitest';
import { GroupIntelEngine } from './group-intel-engine';

describe('GroupIntelEngine', () => {
  let engine: GroupIntelEngine;

  beforeEach(() => {
    engine = new GroupIntelEngine([
      { groupId: 'grp_textile_1', groupName: 'Surat Textile Traders', memberCount: 1024 },
      { groupId: 'grp_solar_1', groupName: 'Gujarat Solar Installers', memberCount: 850 },
    ]);
  });

  it('detects commercial buying intent signals in Hindi/Hinglish messages', () => {
    const signal = engine.ingestGroupMessage({
      messageId: 'msg_01',
      groupId: 'grp_textile_1',
      groupName: 'Surat Textile Traders',
      anonymizedSenderHash: 'hash_abc123',
      text: 'Bhai mujhe 500 meter cotton fabric chahiye urgently for manufacturing',
      timestamp: '2026-10-18T10:00:00Z',
    });

    expect(signal).not.toBeNull();
    expect(signal?.intentCategory).toBe('buying_intent');
    expect(signal?.matchedKeywords).toContain('chahiye');
    expect(signal?.confidenceScore).toBeGreaterThanOrEqual(0.85);
  });

  it('detects price check inquiries', () => {
    const signal = engine.ingestGroupMessage({
      messageId: 'msg_02',
      groupId: 'grp_solar_1',
      groupName: 'Gujarat Solar Installers',
      anonymizedSenderHash: 'hash_xyz789',
      text: 'Kisi ke paas 5kw on-grid inverter ka best price / rate list hai?',
      timestamp: '2026-10-18T10:05:00Z',
    });

    expect(signal).not.toBeNull();
    expect(signal?.intentCategory).toBe('price_check');
    expect(signal?.matchedKeywords).toContain('price');
  });

  it('ignores casual chit-chat to avoid noise', () => {
    const signal = engine.ingestGroupMessage({
      messageId: 'msg_03',
      groupId: 'grp_textile_1',
      groupName: 'Surat Textile Traders',
      anonymizedSenderHash: 'hash_casual',
      text: 'Good morning all friends, have a nice day!',
      timestamp: '2026-10-18T08:00:00Z',
    });

    expect(signal).toBeNull();
  });

  it('aggregates community radar metrics across connected groups', () => {
    // Ingest some signals
    engine.ingestGroupMessage({
      messageId: 'msg_10',
      groupId: 'grp_textile_1',
      groupName: 'Surat Textile Traders',
      anonymizedSenderHash: 'h1',
      text: 'Looking for raw silk supplier',
      timestamp: '2026-10-18T11:00:00Z',
    });

    const metrics = engine.getRadarMetrics();
    expect(metrics.monitoredGroupsCount).toBe(2);
    expect(metrics.estimatedMemberReach).toBe(1874); // 1024 + 850
    expect(metrics.totalSignalsDetected).toBe(1);
    expect(metrics.topTopics.length).toBeGreaterThan(0);
  });
});
