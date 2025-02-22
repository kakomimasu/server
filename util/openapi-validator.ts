import {
  OpenAPIObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
} from "openapi3-ts/oas31";
import {
  InferReferenceType,
  Methods,
  Paths,
  RequestBodyType,
  ResponseContentType,
  ResponseType,
  ResposeStatusCode,
  SchemaType,
} from "./openapi-type.ts";

export class OpenAPIValidatorError extends Error {}

export class OpenAPIValidator<Base> {
  private openapi: OpenAPIObject;
  constructor(openapi: Base) {
    this.openapi = openapi as OpenAPIObject;
  }

  /** Schemaオブジェクトの$refを展開したオブジェクトを取得 */
  private spreadSchema(schema: ReferenceObject | SchemaObject): SchemaObject {
    // console.log(schema);
    if (!("$ref" in schema)) return schema;
    if (!schema.$ref.startsWith("#")) {
      throw new OpenAPIValidatorError("Invalid $ref: " + schema.$ref);
    }
    const path = schema.$ref.slice(2).split("/");
    // deno-lint-ignore no-explicit-any
    let newSchema: any = this.openapi;
    for (const key of path) {
      if (key in newSchema) {
        newSchema = newSchema[key];
      }
    }
    return this.spreadSchema(newSchema);
  }

  private spreadResponse(
    schema: ReferenceObject | ResponseObject,
  ): ResponseObject {
    if (!("$ref" in schema)) return schema;
    const path = schema.$ref.split("/");
    if (
      path[0] !== "#" || path[1] !== "components" || path[2] !== "responses"
    ) {
      throw new OpenAPIValidatorError("Invalid $ref: " + schema.$ref);
    }
    const newSchema = this.openapi.components?.responses?.[path[3]];
    if (!newSchema) {
      throw new OpenAPIValidatorError("Invalid $ref: " + schema.$ref);
    }
    return this.spreadResponse(newSchema);
  }

  private spreadRequestBody(
    schema: ReferenceObject | RequestBodyObject,
  ): RequestBodyObject {
    if (!("$ref" in schema)) return schema;
    const path = schema.$ref.split("/");
    if (
      path[0] !== "#" || path[1] !== "components" || path[2] !== "requestBodies"
    ) {
      throw new OpenAPIValidatorError("Invalid $ref: " + schema.$ref);
    }
    const newSchema = this.openapi.components?.requestBodies?.[path[3]];
    if (!newSchema) {
      throw new OpenAPIValidatorError("Invalid $ref: " + schema.$ref);
    }
    return this.spreadRequestBody(newSchema);
  }

  /** Responseのバリデーション。 */
  validateResponse<
    Path extends Paths<Base>,
    Method extends Methods<Path, Base>,
    StatusCode extends ResposeStatusCode<Path, Method, Base>,
    ContentType extends ResponseContentType<Path, Method, StatusCode, Base>,
  >(
    data: unknown,
    path: Path,
    method: Method,
    statusCode: StatusCode,
    contentType: ContentType,
  ): data is ResponseType<Path, Method, StatusCode, ContentType, Base> {
    const rawSchema = this.spreadResponse(
      this.openapi.paths[path][method]
        .responses[String(statusCode)],
    ).content?.[contentType].schema;

    if (!rawSchema) {
      throw new OpenAPIValidatorError(
        `Invalid response schema : ${method} ${path} ${statusCode} ${contentType}`,
      );
    }
    const schema = this.spreadSchema(rawSchema);
    return this.validate(data, schema);
  }

  /** Request Bodyのバリデーション。 */
  validateRequestBody<
    Path extends Paths<Base>,
    Method extends Methods<Path, Base>,
    ContentType extends (Base extends {
      paths: {
        [_ in Path]: {
          [_ in Method]: {
            requestBody: infer U;
          };
        };
      };
      // $refに対応
    } ? (U extends { $ref: `#/${infer V}` } ? InferReferenceType<V, Base> : U)
      : never) extends { content: infer ContentType } ? keyof ContentType
      : never,
  >(
    data: unknown,
    path: Path,
    method: Method,
    contentType: ContentType,
  ): data is RequestBodyType<Path, Method, ContentType, Base> {
    const rawSchema = this.spreadRequestBody(
      this.openapi.paths[path][method]
        .requestBody,
    ).content?.[contentType].schema;

    if (!rawSchema) {
      throw new OpenAPIValidatorError(
        `Invalid response schema : ${method} ${path} ${contentType}`,
      );
    }
    const schema = this.spreadSchema(rawSchema);
    try {
      return this.validate(data, schema);
    } catch (_e) {
      // console.error(e);
      return false;
    }
  }

  validate<U extends (ReferenceObject | SchemaObject)>(
    data: unknown,
    schema_: U,
  ): data is SchemaType<U, Base> {
    const schema = this.spreadSchema(schema_);
    // console.log(data, schema);
    // console.log(JSON.stringify(schema, null, 2));

    // console.log("validate", typeof schema.type);
    if (typeof schema.type === "string") {
      // console.log(schema);
      switch (schema.type) {
        case "integer":
        case "number":
          if (typeof data !== "number") {
            throw new OpenAPIValidatorError(
              "Invalid(number|integer) type: " + data,
            );
          }
          break;
        case "string":
          if (typeof data !== "string") {
            throw new OpenAPIValidatorError("Invalid(string) type: " + data);
          }
          if (schema.enum && !schema.enum.includes(data)) {
            throw new OpenAPIValidatorError("Invalid(string) enum: " + data);
          }
          if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(data)) {
              throw new OpenAPIValidatorError(
                `Invalid(string) pattern(${schema.pattern}): ` + data,
              );
            }
          }
          break;
        case "boolean":
          if (typeof data !== "boolean") {
            throw new OpenAPIValidatorError("Invalid(boolean) type: " + data);
          }
          if (schema.enum && !schema.enum.includes(data)) {
            throw new OpenAPIValidatorError(
              `Invalid(boolean) enum(${schema.enum}): ` + data,
            );
          }
          break;
        case "object": {
          if (data === null || typeof data !== "object") {
            throw new OpenAPIValidatorError("Invalid(object) type: " + data);
          }

          // requiredのチェック
          if (schema.required) {
            for (const key of schema.required) {
              if (!(key in data)) {
                throw new OpenAPIValidatorError(
                  "Invalid(object) required field[" + key + "]: " +
                    JSON.stringify(data),
                );
              }
            }
          }

          // propertiesのチェック
          if (schema.properties) {
            const data2 = data as Record<string, unknown>; // 型変換のためのキャスト
            for (const [key, value] of Object.entries(schema.properties)) {
              if (!(key in data2)) continue; // dataにないキーは無視
              // console.log("data2[key]", key, data2[key]);
              this.validate(data2[key], value);
            }
          }
          break;
        }
        case "array": {
          if (!Array.isArray(data)) {
            throw new OpenAPIValidatorError("Invalid(array) type: " + data);
          }
          const items = schema.items;
          if (items) {
            for (const value of data) {
              this.validate(value, items);
            }
          }
          break;
        }
        case "null":
          if (data !== null) {
            throw new OpenAPIValidatorError("Invalid(null) type: " + data);
          }
          break;
        default: {
          const _: never = schema.type;
          return _;
        }
      }
    }

    if (schema.oneOf) {
      const isValid = schema.oneOf.some((value) => {
        try {
          return this.validate(data, value);
        } catch {
          return false;
        }
      });
      if (isValid !== true) {
        throw new OpenAPIValidatorError("Invalid(oneOf) type: " + data);
      }
    }
    this.validateAllOf(data, schema);
    return true;
  }
  private validateAllOf(data: unknown, schema: SchemaObject) {
    if (schema.allOf) {
      for (const value of schema.allOf) {
        this.validate(data, value);
      }
    }
  }
}
