type InferString<T> = T extends { readonly enum: readonly [...infer U] }
  ? U[number]
  : string;

type InferObjectRequired<T, Base = T> = T extends
  { readonly properties: infer V; readonly required?: readonly [...infer U] }
  ? { [K in Extract<keyof V, U[number]>]: SchemaType<V[K], Base> }
  : never;
type InferObjectNonRequired<T, Base = T> = T extends
  { readonly properties: infer V; readonly required?: readonly [...infer U] }
  ? { [K in Exclude<keyof V, U[number]>]?: SchemaType<V[K], Base> }
  : never;

type InferObject<T, Base = T> = Merge<
  InferObjectRequired<T, Base> & InferObjectNonRequired<T, Base>
>;

type InferArray<T, Base = T> = T extends { readonly items: infer U }
  ? SchemaType<U, Base>[]
  : never;

type InferNullable<T, Other = never> = T extends { readonly nullable: true }
  ? null | Other
  : Other;
type InferType<T, Base = T> = T extends { readonly type: "integer" } ? number
  : T extends { readonly type: "number" } ? number
  : T extends { readonly type: "string" } ? InferString<T>
  : T extends { readonly type: "boolean" } ? boolean
  : T extends { readonly type: "object" } ? InferObject<T, Base>
  : T extends { readonly type: "array" } ? InferArray<T, Base>
  : T extends { readonly type: "null" } ? null
  : never;

type MapForOneOfType<T, Base = T> = T extends [infer U, ...infer U2]
  ? SchemaType<U, Base> | MapForOneOfType<U2, Base>
  : never;

type InferOneOfType<T, Base = T> = T extends
  { readonly oneOf: readonly [...infer U] } ? MapForOneOfType<U, Base>
  : never;

type InferSchemaType<T, Base = T> = InferNullable<
  T,
  InferType<T, Base> | InferOneOfType<T, Base>
>;

type InferReferenceType<T extends string, Base, Now = Base> = T extends
  `${infer U}/${infer V}`
  ? (Now extends { [_ in U]: infer W } ? InferReferenceType<V, Base, W>
    : "never")
  : (Now extends { [_ in T]: infer W } ? InferSchemaType<W, Base> : never);

export type SchemaType<T, Base = T> = T extends
  { readonly $ref: `#/${infer U}` } ? InferReferenceType<U, Base>
  : InferSchemaType<T, Base>;

type Merge<T> = {
  [K in keyof T]: T[K];
};
