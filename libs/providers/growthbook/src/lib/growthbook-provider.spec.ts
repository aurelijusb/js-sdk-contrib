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
        flagMetadata: {
          ruleId: 'test',
          source: 'experiment',
          experimentResultHashValue: 'abc',
        },
        value: true,
        reason: 'experiment',
        variant: 'treatment',
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
        flagMetadata: {
          ruleId: 'test',
          source: 'experiment',
          experimentResultHashValue: 'abc',
        },
        value: 'Experiment fearlessly, deliver confidently',
        reason: 'experiment',
        variant: 'treatment',
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
        flagMetadata: {
          ruleId: 'test',
          source: 'experiment',
          experimentResultHashValue: 'abc',
        },
        value: 12345,
        reason: 'experiment',
        variant: 'treatment',
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
        flagMetadata: {
          ruleId: 'test',
          source: 'experiment',
          experimentResultHashValue: 'abc',
        },
        value: { test: true },
        reason: 'experiment',
        variant: 'treatment',
      });
    });
  });

  describe('details resolvers', () => {
    it('should include advanced experiment metadata', async () => {
      jest.spyOn(GrowthBookClient.prototype, 'evalFeature').mockImplementation(() => ({
        value: true,
        source: 'experiment',
        on: true,
        off: false,
        ruleId: 'fr_a4obdoommrzcapr',
        experiment: {
          key: 'tracking-key',
          variations: [false, true],
          name: 'Experiment1',
          phase: '0',
          seed: 'e29f8131-b6ba-4a39-b9cd-e34d4bb74b33',
        },
        experimentResult: {
          value: true,
          variationId: 1,
          key: 'id1',
          name: 'Variation 1',
          inExperiment: true,
          hashAttribute: 'id',
          hashValue: '1',
          featureId: 'feature1',
        },
      }));

      const res = await ofClient.getBooleanDetails('feature1', false);

      expect(res).toEqual({
        flagKey: 'feature1',
        flagMetadata: {
          ruleId: 'fr_a4obdoommrzcapr', // To debug which rule triggered the logic
          source: 'experiment', // E.g. was logic from experiment, forced or default value
          experimentName: 'Experiment1', 
          experimentKey: 'tracking-key',
          experimentPhase: '0', // Increases when re-randomize experiment traffic
          experimentSeed: 'e29f8131-b6ba-4a39-b9cd-e34d4bb74b33', // Useful to have same traffic bucketing but different experiments
          experimentResultName: 'Variation 1', // Variation Name in Growthbook Experiment
          experimentResultHashValue: '1',
        },
        value: true,
        reason: 'experiment',
        variant: 'id1',
      });
    });
  })
});
