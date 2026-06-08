export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  return { releaseId: config.public.releaseId };
});
