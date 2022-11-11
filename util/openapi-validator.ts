import { OpenAPIObject, ReferenceObject, SchemaObject } from "../deps.ts";
import { SchemaType } from "./openapi-type.ts";

type SchemasType = ReferenceObject | SchemaObject;

export class OpenAPIValidatorError extends Error {}

export class OpenAPIValidator<Base> {
  private openapi: OpenAPIObject;
  constructor(openapi: Base) {
    this.openapi = openapi as OpenAPIObject;
  }

  /** Schemaオブジェクトの$refを展開したオブジェクトを取得 */
  private spreadSchema(schema: SchemasType): SchemaObject {
    // console.log(schema);
    if ("$ref" in schema) {
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
    } else {
      if (schema.properties) {
        // console.log(schema.properties);
        for (const [key, value] of Object.entries(schema.properties)) {
          schema.properties[key] = this.spreadSchema(value);
        }
      }
      const oneOf = schema.oneOf?.map((value) => this.spreadSchema(value));
      schema.oneOf = oneOf;
      return schema;
    }
  }

  validateSchema(data: unknown, schemaName: string) {
    const schema = this.openapi.components?.schemas?.[schemaName];
    if (schema === undefined) {
      throw new OpenAPIValidatorError("Invalid schemaName: " + schemaName);
    }

    const schemaData = this.spreadSchema(schema);
    // console.log(schemaData);

    this.validate(data, schemaData);
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
              if ("$ref" in value) continue; // ReferenceObjectは無視
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
          if (items && !("$ref" in items)) {
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
    return true;
  }
}
