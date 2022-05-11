export type PartiallyPartial<T, K extends keyof T> =
  & Omit<T, K>
  & Partial<Pick<T, K>>;

export const nowUnixTime = () => {
  return Math.floor(new Date().getTime() / 1000);
};

export const randomUUID = () => crypto.randomUUID();
