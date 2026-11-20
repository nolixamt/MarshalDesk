// Where browsers open sockets (the PartyServer Worker). Public by design: tokens guard the rooms.
export const REALTIME_HOST =
  process.env.NEXT_PUBLIC_REALTIME_HOST ?? "localhost:8787";
