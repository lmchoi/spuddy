// On web, we're always on the client, so we can return the client value directly.
export function useClientOnlyValue<S, C>(_server: S, client: C): S | C {
  return client;
}
