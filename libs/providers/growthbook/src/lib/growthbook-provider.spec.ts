import type { ClientOptions, InitOptions } from '@growthbook/growthbook';
import { GrowthBookClient } from '@growthbook/growthbook';
import { GrowthbookProvider } from './growthbook-provider';
import type { Client } from '@openfeature/server-sdk';
import { OpenFeature } from '@openfeature/server-sdk';

jest.mock('@growthbook/growthbook');

const testFlagKey = 'flag-key';
const growthbookOptionsMock: ClientOptions = {
  apiHost: 'http://api.growthbook.io',
  clientKey: 'sdk-test-key',
  globalAttributes: {
    id: 1,
  },
};

const initOptionsMock: InitOptions = {
  timeout: 5000,
};

describe('GrowthbookProvider', () => {
  let gbProvider: GrowthbookProvider;
  let ofClient: Client;

  beforeAll(() => {
    gbProvider = new GrowthbookProvider(growthbookOptionsMock, initOptionsMock);
    OpenFeature.setProvider(gbProvider);
    ofClient = OpenFeature.getClient();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be and instance of GrowthbookProvider', () => {
    expect(new GrowthbookProvider(growthbookOptionsMock, initOptionsMock)).toBeInstanceOf(GrowthbookProvider);
  });

  describe('constructor', () => {
    it('should set the growthbook options & initOptions correctly', () => {
      const provider = new GrowthbookProvider(growthbookOptionsMock, initOptionsMock);

      expect(provider['options']).toEqual(growthbookOptionsMock);
      expect(provider['_initOptions']).toEqual(initOptionsMock);
    });
  });

  describe('initialize', () => {
    const provider = new GrowthbookProvider(growthbookOptionsMock, initOptionsMock);

    it('should call growthbook initialize function with correct arguments', async () => {
      const evalContext = { serverIp: '10.1.1.1' };
      await provider.initialize({ serverIp: '10.1.1.1' });

      const options = {
        ...provider['options'],
        globalAttributes: { ...provider['options'].globalAttributes, ...evalContext },
      };

      expect(GrowthBookClient).toHaveBeenCalledWith(options);
      expect(provider['_client']?.init).toHaveBeenCalledWith(initOptionsMock);
    });
  });

  describe('resolveBooleanEvaluation', () => {
    it('handles correct return types for boolean variations', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: true,
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'test',
        experimentResult: {
          value: true,
          variationId: 1,
          key: 'treatment',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'abc',
          featureId: testFlagKey,
        },
      }));

      const res = await ofClient.getBooleanDetails(testFlagKey, false);
      expect(res).toEqual({
        flagKey: testFlagKey,
        flagMetadata: {},
        value: true,
        reason: 'experiment',
        variant: 'treatment',
      });
    });

    it('includes experimentPhase and experimentSeed in flagMetadata when present', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: true,
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'test',
        experiment: {
          key: 'feature1',
          variations: [false, true],
          phase: '0',
          seed: 'aab6cb2c-5bdb-4081-9bf3-849b69e11025',
        },
        experimentResult: {
          value: true,
          variationId: 1,
          key: '1',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'user-123',
          featureId: testFlagKey,
        },
      }));

      const res = await ofClient.getBooleanDetails(testFlagKey, false);
      expect(res).toEqual({
        flagKey: testFlagKey,
        flagMetadata: {
          experimentPhase: '0',
          experimentSeed: 'aab6cb2c-5bdb-4081-9bf3-849b69e11025',
        },
        value: true,
        reason: 'experiment',
        variant: '1',
      });
    });

    it('does not include flagMetadata when experiment phase is missing', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: true,
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'test',
        experiment: {
          key: 'feature1',
          variations: [false, true],
          seed: 'aab6cb2c-5bdb-4081-9bf3-849b69e11025',
        },
        experimentResult: {
          value: true,
          variationId: 1,
          key: '1',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'user-123',
          featureId: testFlagKey,
        },
      }));

      const res = await ofClient.getBooleanDetails(testFlagKey, false);
      expect(res).toEqual({
        flagKey: testFlagKey,
        flagMetadata: {},
        value: true,
        reason: 'experiment',
        variant: '1',
      });
    });

    it('does not include flagMetadata when experiment seed is missing', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: true,
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'test',
        experiment: {
          key: 'feature1',
          variations: [false, true],
          phase: '0',
        },
        experimentResult: {
          value: true,
          variationId: 1,
          key: '1',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'user-123',
          featureId: testFlagKey,
        },
      }));

      const res = await ofClient.getBooleanDetails(testFlagKey, false);
      expect(res).toEqual({
        flagKey: testFlagKey,
        flagMetadata: {},
        value: true,
        reason: 'experiment',
        variant: '1',
      });
    });

    it('does not include flagMetadata when experiment is not present', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: true,
        source: 'defaultValue',
        on: true,
        off: false,
        ruleId: 'test',
      }));

      const res = await ofClient.getBooleanDetails(testFlagKey, false);
      expect(res).toEqual({
        flagKey: testFlagKey,
        flagMetadata: {},
        value: true,
        reason: 'defaultValue',
      });
    });
  });

  describe('resolveStringEvaluation', () => {
    it('handles correct return types for string variations', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: 'Experiment fearlessly, deliver confidently',
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'test',
        experimentResult: {
          value: 'Experiment fearlessly, deliver confidently',
          variationId: 1,
          key: 'treatment',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'abc',
          featureId: testFlagKey,
        },
      }));

      const res = await ofClient.getStringDetails(testFlagKey, '');
      expect(res).toEqual({
        flagKey: testFlagKey,
        flagMetadata: {},
        value: 'Experiment fearlessly, deliver confidently',
        reason: 'experiment',
        variant: 'treatment',
      });
    });

    it('includes experimentPhase and experimentSeed in flagMetadata for string variations', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: 'variant-a',
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'test',
        experiment: {
          key: 'string-experiment',
          variations: ['control', 'variant-a', 'variant-b'],
          phase: '1',
          seed: 'string-seed-uuid',
        },
        experimentResult: {
          value: 'variant-a',
          variationId: 1,
          key: '1',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'user-456',
          featureId: testFlagKey,
        },
      }));

      const res = await ofClient.getStringDetails(testFlagKey, 'control');
      expect(res).toEqual({
        flagKey: testFlagKey,
        flagMetadata: {
          experimentPhase: '1',
          experimentSeed: 'string-seed-uuid',
        },
        value: 'variant-a',
        reason: 'experiment',
        variant: '1',
      });
    });
  });

  describe('resolveNumberEvaluation', () => {
    it('handles correct return types for number variations', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: 12345,
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'test',
        experimentResult: {
          value: 12345,
          variationId: 1,
          key: 'treatment',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'abc',
          featureId: testFlagKey,
        },
      }));

      const res = await ofClient.getNumberDetails(testFlagKey, 1);
      expect(res).toEqual({
        flagKey: testFlagKey,
        flagMetadata: {},
        value: 12345,
        reason: 'experiment',
        variant: 'treatment',
      });
    });

    it('includes experimentPhase and experimentSeed in flagMetadata for number variations', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: 500,
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'test',
        experiment: {
          key: 'number-experiment',
          variations: [100, 500, 1000],
          phase: '2',
          seed: 'number-seed-uuid',
        },
        experimentResult: {
          value: 500,
          variationId: 1,
          key: '1',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'user-789',
          featureId: testFlagKey,
        },
      }));

      const res = await ofClient.getNumberDetails(testFlagKey, 100);
      expect(res).toEqual({
        flagKey: testFlagKey,
        flagMetadata: {
          experimentPhase: '2',
          experimentSeed: 'number-seed-uuid',
        },
        value: 500,
        reason: 'experiment',
        variant: '1',
      });
    });
  });

  describe('resolveObjectEvaluation', () => {
    it('handles correct return types for object variations', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: { test: true },
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'test',
        experimentResult: {
          value: { test: true },
          variationId: 1,
          key: 'treatment',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'abc',
          featureId: testFlagKey,
        },
      }));

      const res = await ofClient.getObjectDetails(testFlagKey, {});
      expect(res).toEqual({
        flagKey: testFlagKey,
        flagMetadata: {},
        value: { test: true },
        reason: 'experiment',
        variant: 'treatment',
      });
    });

    it('includes experimentPhase and experimentSeed in flagMetadata for object variations', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: { color: 'blue', size: 'large' },
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'test',
        experiment: {
          key: 'object-experiment',
          variations: [
            { color: 'red', size: 'small' },
            { color: 'blue', size: 'large' },
          ],
          phase: '0',
          seed: 'object-seed-uuid',
        },
        experimentResult: {
          value: { color: 'blue', size: 'large' },
          variationId: 1,
          key: '1',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'user-999',
          featureId: testFlagKey,
        },
      }));

      const res = await ofClient.getObjectDetails(testFlagKey, {});
      expect(res).toEqual({
        flagKey: testFlagKey,
        flagMetadata: {
          experimentPhase: '0',
          experimentSeed: 'object-seed-uuid',
        },
        value: { color: 'blue', size: 'large' },
        reason: 'experiment',
        variant: '1',
      });
    });
  });

  describe('real-world Growthbook payload scenarios', () => {
    it('handles A/B test with experiment phase and seed for analytics tracking', async () => {
      // Simulating a real Growthbook A/B test payload with experiment metadata
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: true,
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'exp-rule-1',
        experiment: {
          key: 'feature1',
          variations: [false, true],
          weights: [0.5, 0.5],
          phase: '0',
          seed: 'aab6cb2c-5bdb-4081-9bf3-849b69e11025',
          meta: [
            { key: 'control', name: 'Control' },
            { key: 'treatment', name: 'Treatment' },
          ],
        },
        experimentResult: {
          value: true,
          variationId: 1,
          key: '1',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'user-abc123',
          featureId: 'feature1',
          hashUsed: true,
          name: 'Treatment',
          bucket: 0.73,
          stickyBucketUsed: false,
        },
      }));

      const res = await ofClient.getBooleanDetails('feature1', false, { id: 'user-abc123' });

      // Verify the response matches expected format from PR description
      expect(res).toEqual({
        flagKey: 'feature1',
        flagMetadata: {
          experimentPhase: '0',
          experimentSeed: 'aab6cb2c-5bdb-4081-9bf3-849b69e11025',
        },
        value: true,
        reason: 'experiment',
        variant: '1',
      });
    });

    it('handles multi-variant experiment with reshuffle capability', async () => {
      // Simulating a Growthbook multi-variant experiment with reshuffle
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: 'blue',
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'exp-multivariant',
        experiment: {
          key: 'button-color-test',
          variations: ['red', 'blue', 'green'],
          weights: [0.33, 0.34, 0.33],
          phase: '1',
          seed: 'button-color-reshuffle-seed',
          coverage: 1.0,
        },
        experimentResult: {
          value: 'blue',
          variationId: 1,
          key: '1',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'user-xyz789',
          featureId: 'button-color-test',
          hashUsed: true,
          bucket: 0.52,
          stickyBucketUsed: false,
        },
      }));

      const res = await ofClient.getStringDetails('button-color-test', 'red', { id: 'user-xyz789' });

      expect(res).toEqual({
        flagKey: 'button-color-test',
        flagMetadata: {
          experimentPhase: '1',
          experimentSeed: 'button-color-reshuffle-seed',
        },
        value: 'blue',
        reason: 'experiment',
        variant: '1',
      });
    });

    it('handles feature flag without experiment (non-experiment scenario)', async () => {
      // Simulating a simple feature flag that is not part of an experiment
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: true,
        source: 'force',
        on: true,
        off: false,
        ruleId: 'force-rule',
      }));

      const res = await ofClient.getBooleanDetails('simple-flag', false);

      // No experiment metadata should be present
      expect(res).toEqual({
        flagKey: 'simple-flag',
        flagMetadata: {},
        value: true,
        reason: 'force',
      });
    });

    it('handles gradual rollout with experiment tracking', async () => {
      // Simulating a gradual rollout scenario with experiment tracking
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: { newFeature: true, version: 2 },
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'rollout-rule',
        experiment: {
          key: 'new-feature-rollout',
          variations: [
            { newFeature: false, version: 1 },
            { newFeature: true, version: 2 },
          ],
          weights: [0.1, 0.9],
          phase: '0',
          seed: 'rollout-phase-0-seed',
          coverage: 0.2,
        },
        experimentResult: {
          value: { newFeature: true, version: 2 },
          variationId: 1,
          key: '1',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: 'user-rollout-123',
          featureId: 'new-feature-rollout',
          hashUsed: true,
          bucket: 0.15,
          stickyBucketUsed: false,
        },
      }));

      const res = await ofClient.getObjectDetails(
        'new-feature-rollout',
        { newFeature: false, version: 1 },
        {
          id: 'user-rollout-123',
        },
      );

      expect(res).toEqual({
        flagKey: 'new-feature-rollout',
        flagMetadata: {
          experimentPhase: '0',
          experimentSeed: 'rollout-phase-0-seed',
        },
        value: { newFeature: true, version: 2 },
        reason: 'experiment',
        variant: '1',
      });
    });
  });
});
