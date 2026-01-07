import { TypeMismatchError } from '@openfeature/core';
import translateResult from './translate-result';

describe('translateResult', () => {
  it('does populate the errorCode correctly when there is an error', () => {
    const translated = translateResult<boolean>(
      {
        value: true,
        source: 'unknownFeature',
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
          featureId: 'testFlagKey',
        },
      },
      false,
    );
    expect(translated.errorCode).toEqual('FLAG_NOT_FOUND');
  });

  it('does not populate the errorCode when there is not an error', () => {
    const translated = translateResult<boolean>(
      {
        value: true,
        source: 'defaultValue',
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
          featureId: 'testFlagKey',
        },
      },
      false,
    );
    expect(translated.errorCode).toBeUndefined();
  });

  it('throws an error when result type differs from defaultValue type', () => {
    expect(() =>
      translateResult<boolean>(
        {
          value: 'test',
          source: 'defaultValue',
          on: true,
          off: false,
          ruleId: 'test',
          experimentResult: {
            value: 'test',
            variationId: 1,
            key: 'treatment',
            inExperiment: true,
            hashAttribute: 'id',
            hashValue: 'abc',
            featureId: 'testFlagKey',
          },
        },
        false,
      ),
    ).toThrow(TypeMismatchError);
  });

  describe('experimentPhase and experimentSeed', () => {
    it('includes both experimentPhase and experimentSeed in flagMetadata when both are present', () => {
      const translated = translateResult<boolean>(
        {
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
            featureId: 'feature1',
          },
        },
        false,
      );

      expect(translated.flagMetadata).toEqual({
        experimentPhase: '0',
        experimentSeed: 'aab6cb2c-5bdb-4081-9bf3-849b69e11025',
      });
    });

    it('does not include flagMetadata when experiment is missing', () => {
      const translated = translateResult<boolean>(
        {
          value: true,
          source: 'defaultValue',
          on: true,
          off: false,
          ruleId: 'test',
        },
        false,
      );

      expect(translated.flagMetadata).toBeUndefined();
    });

    it('does not include flagMetadata when experimentPhase is missing', () => {
      const translated = translateResult<boolean>(
        {
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
            featureId: 'feature1',
          },
        },
        false,
      );

      expect(translated.flagMetadata).toBeUndefined();
    });

    it('does not include flagMetadata when experimentSeed is missing', () => {
      const translated = translateResult<boolean>(
        {
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
            featureId: 'feature1',
          },
        },
        false,
      );

      expect(translated.flagMetadata).toBeUndefined();
    });

    it('handles numeric phase values correctly', () => {
      const translated = translateResult<boolean>(
        {
          value: true,
          source: 'experiment',
          on: true,
          off: false,
          ruleId: 'test',
          experiment: {
            key: 'feature1',
            variations: [false, true],
            phase: '2',
            seed: 'test-seed-uuid',
          },
          experimentResult: {
            value: true,
            variationId: 1,
            key: '1',
            inExperiment: true,
            hashAttribute: 'id',
            hashValue: 'user-456',
            featureId: 'feature1',
          },
        },
        false,
      );

      expect(translated.flagMetadata).toEqual({
        experimentPhase: '2',
        experimentSeed: 'test-seed-uuid',
      });
    });

    it('handles different seed formats correctly', () => {
      const translated = translateResult<string>(
        {
          value: 'variant-b',
          source: 'experiment',
          on: true,
          off: false,
          ruleId: 'test',
          experiment: {
            key: 'feature2',
            variations: ['variant-a', 'variant-b'],
            phase: '1',
            seed: 'custom-seed-string',
          },
          experimentResult: {
            value: 'variant-b',
            variationId: 1,
            key: '1',
            inExperiment: true,
            hashAttribute: 'id',
            hashValue: 'user-789',
            featureId: 'feature2',
          },
        },
        'variant-a',
      );

      expect(translated.flagMetadata).toEqual({
        experimentPhase: '1',
        experimentSeed: 'custom-seed-string',
      });
    });
  });
});
