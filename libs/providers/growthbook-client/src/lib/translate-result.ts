import type { FeatureResult } from '@growthbook/growthbook';
import type { FlagMetadata, ResolutionDetails } from '@openfeature/web-sdk';
import { ErrorCode, TypeMismatchError } from '@openfeature/web-sdk';

const FEATURE_RESULT_ERRORS = ['unknownFeature', 'cyclicPrerequisite'];

function buildFlagMetadata(result: FeatureResult): FlagMetadata {
  return {
    ruleId: result.ruleId,
    source: result.source,
    ...(result.experiment?.name !== undefined && { experimentName: result.experiment.name }),
    ...(result.experiment?.key !== undefined && { experimentKey: result.experiment.key }),
    ...(result.experiment?.phase !== undefined && { experimentPhase: result.experiment.phase }),
    ...(result.experiment?.seed !== undefined && { experimentSeed: result.experiment.seed }),
    ...(result.experimentResult?.name !== undefined && { experimentResultName: result.experimentResult.name }),
    ...(result.experimentResult?.hashValue !== undefined && { experimentResultHashValue: result.experimentResult.hashValue }),
  };
}

function translateError(errorKind?: string): ErrorCode {
  switch (errorKind) {
    case 'unknownFeature':
      return ErrorCode.FLAG_NOT_FOUND;
    case 'cyclicPrerequisite':
      return ErrorCode.PARSE_ERROR;
    default:
      return ErrorCode.GENERAL;
  }
}

export default function translateResult<T>(result: FeatureResult, defaultValue: T): ResolutionDetails<T> {
  if (result.value !== null && typeof result.value !== typeof defaultValue) {
    throw new TypeMismatchError(`Expected flag type ${typeof defaultValue} but got ${typeof result.value}`);
  }

  const resolution: ResolutionDetails<T> = {
    value: result.value === null ? defaultValue : result.value,
    reason: result.source,
    variant: result.experimentResult?.key,
    flagMetadata: buildFlagMetadata(result),
  };

  if (FEATURE_RESULT_ERRORS.includes(result.source)) {
    resolution.errorCode = translateError(result.source);
  }

  return resolution;
}
