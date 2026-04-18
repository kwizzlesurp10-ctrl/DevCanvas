import {
  MOBILE_BREAKPOINT,
  PANEL_SIZE_KEYS,
  DEFAULT_PANEL_SIZES,
  TIMING,
  CANVAS_SYNC_FPS,
  CANVAS_THROTTLE_MS,
  WEBRTC_ICE_SERVERS,
  PANEL_CONSTRAINTS,
} from '@/lib/constants';

describe('constants', () => {
  describe('MOBILE_BREAKPOINT', () => {
    it('is a media query string for max-width 767px', () => {
      expect(MOBILE_BREAKPOINT).toBe('(max-width: 767px)');
    });
  });

  describe('PANEL_SIZE_KEYS', () => {
    it('contains keys for all panel types', () => {
      expect(PANEL_SIZE_KEYS).toHaveProperty('sidebar');
      expect(PANEL_SIZE_KEYS).toHaveProperty('canvas');
      expect(PANEL_SIZE_KEYS).toHaveProperty('chat');
      expect(PANEL_SIZE_KEYS).toHaveProperty('voice');
      expect(PANEL_SIZE_KEYS).toHaveProperty('main');
    });

    it('has string values prefixed with devcanvas-panel-', () => {
      Object.values(PANEL_SIZE_KEYS).forEach((key) => {
        expect(key).toMatch(/^devcanvas-panel-/);
      });
    });
  });

  describe('DEFAULT_PANEL_SIZES', () => {
    it('has numeric values for all panel types', () => {
      expect(typeof DEFAULT_PANEL_SIZES.sidebar).toBe('number');
      expect(typeof DEFAULT_PANEL_SIZES.canvas).toBe('number');
      expect(typeof DEFAULT_PANEL_SIZES.chat).toBe('number');
      expect(typeof DEFAULT_PANEL_SIZES.voice).toBe('number');
      expect(typeof DEFAULT_PANEL_SIZES.main).toBe('number');
    });

    it('has values between 0 and 100 (percentages)', () => {
      Object.values(DEFAULT_PANEL_SIZES).forEach((size) => {
        expect(size).toBeGreaterThan(0);
        expect(size).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('TIMING', () => {
    it('has positive millisecond values', () => {
      expect(TIMING.PANEL_SWITCH_FOCUS_DELAY).toBeGreaterThan(0);
      expect(TIMING.CANVAS_CHANNEL_SUBSCRIPTION_DELAY).toBeGreaterThan(0);
      expect(TIMING.TOOLBAR_DRAGGABLE_INIT_DELAY).toBeGreaterThan(0);
      expect(TIMING.WEBRTC_INITIATOR_TIMEOUT).toBeGreaterThan(0);
    });
  });

  describe('CANVAS_SYNC_FPS and CANVAS_THROTTLE_MS', () => {
    it('CANVAS_SYNC_FPS is 30', () => {
      expect(CANVAS_SYNC_FPS).toBe(30);
    });

    it('CANVAS_THROTTLE_MS is derived from FPS (floor(1000/30))', () => {
      expect(CANVAS_THROTTLE_MS).toBe(Math.floor(1000 / CANVAS_SYNC_FPS));
    });

    it('CANVAS_THROTTLE_MS is approximately 33ms', () => {
      expect(CANVAS_THROTTLE_MS).toBe(33);
    });
  });

  describe('WEBRTC_ICE_SERVERS', () => {
    it('contains at least one STUN server', () => {
      expect(WEBRTC_ICE_SERVERS.length).toBeGreaterThanOrEqual(1);
    });

    it('each server has a urls property with stun: prefix', () => {
      WEBRTC_ICE_SERVERS.forEach((server) => {
        expect(server.urls).toMatch(/^stun:/);
      });
    });
  });

  describe('PANEL_CONSTRAINTS', () => {
    it('has min and max for each panel type', () => {
      const panels = ['sidebar', 'canvas', 'chat', 'voice', 'main'] as const;
      panels.forEach((panel) => {
        expect(PANEL_CONSTRAINTS[panel]).toHaveProperty('min');
        expect(PANEL_CONSTRAINTS[panel]).toHaveProperty('max');
        expect(PANEL_CONSTRAINTS[panel].min).toBeLessThan(PANEL_CONSTRAINTS[panel].max);
      });
    });

    it('default sizes fall within constraints', () => {
      const panels = ['sidebar', 'canvas', 'chat', 'voice', 'main'] as const;
      panels.forEach((panel) => {
        expect(DEFAULT_PANEL_SIZES[panel]).toBeGreaterThanOrEqual(PANEL_CONSTRAINTS[panel].min);
        expect(DEFAULT_PANEL_SIZES[panel]).toBeLessThanOrEqual(PANEL_CONSTRAINTS[panel].max);
      });
    });
  });
});
