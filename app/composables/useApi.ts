export function useApi() {
  async function api<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await $fetch<T>(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    } as Parameters<typeof $fetch>[1]);
    return res;
  }

  return { api };
}
