// Prediction Service Index
// Re-exports all prediction sub-modules.

export { extractFeatures, featuresToVector, getFeatureNames } from './featureExtractor';
export type { ContentInput, ExtractedFeatures } from './featureExtractor';
export { predictVirality } from './viralityModel';
export { runInference } from './inferenceWrapper';
