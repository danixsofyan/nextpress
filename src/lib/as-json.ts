export type Json<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Json<U>[]
    : T extends object
      ? { [K in keyof T]: Json<T[K]> }
      : T

export const asJson = <T>(value: T) => JSON.parse(JSON.stringify(value)) as Json<T>
