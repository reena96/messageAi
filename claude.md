# Claude Implementation Notes

- When generating or updating Firebase Cloud Functions, always read the region from the shared config (`functions/src/config.ts`). Do not embed literal region strings in generated code so that deployments can switch regions centrally.
