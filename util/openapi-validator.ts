import {
  OpenAPIObject,
  ReferenceObject,
  ResponseObject,
  SchemaObject,
} from "../deps.ts";
import { SchemaType } from "./openapi-type.ts";

type SchemasType = ReferenceObject | SchemaObject;

export class OpenAPIValidatorError extends Error {}

type ValidateResponseSchema = {
  path: string;
  method: "get" | "post";
  contentType: string;
  statusCode: number;
};

export class OpenAPIValidator<Base> {
  private openapi: OpenAPIObject;
  constructor(openapi: Base) {
    this.openapi = openapi as OpenAPIObject;
  }

  /** Schemaオブジェクトの$refを展開したオブジェクトを取得 */
  private spreadSchema(schema: SchemasType): SchemaObject {
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

  validateResponse(data: unknown, resType: ValidateResponseSchema) {
    const rawSchema = this.spreadResponse(
      this.openapi.paths[resType.path][resType.method]
        .responses[String(resType.statusCode)],
    ).content?.[resType.contentType]
      .schema;
    if (!rawSchema) {
      throw new OpenAPIValidatorError(
        `Invalid response schema : ${resType.method} ${resType.path} ${resType.statusCode} ${resType.contentType}`,
      );
    }
    const schema = this.spreadSchema(rawSchema);
    return this.validate(data, schema);
  }

  validate<U>(data: unknown, schema_: U): data is SchemaType<U, Base> {
    const schema = this.spreadSchema(schema_ as SchemasType);
    // console.log(data, schema);
    // console.log(JSON.stringify(schema, null, 2));
    if (schema.nullable && data === null) return true;

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
