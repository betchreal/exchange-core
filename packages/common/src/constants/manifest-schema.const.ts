export const ManifestSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "version", "type", "timeouts", "net", "configSchema"],
  properties: {
    name: {
      type: "string",
      pattern: "^[a-z0-9][a-z0-9_-]*$",
      minLength: 1,
      maxLength: 32,
    },

    version: {
      type: "string",
      pattern: "^[a-z0-9][a-z0-9_.-]*$",
      minLength: 1,
      maxLength: 32,
    },

    type: {
      enum: ["payout", "merchant", "parser", "aml"],
    },

    timeouts: {
      type: "object",
      additionalProperties: false,
      required: ["callMs", "bootMs"],
      properties: {
        callMs: { type: "integer", minimum: 1000, maximum: 20000 },
        bootMs: { type: "integer", minimum: 1000, maximum: 30000 },
      },
    },

    net: {
      type: "object",
      additionalProperties: false,
      required: ["egressAllowList"],
      properties: {
        egressAllowList: {
          type: "array",
          minItems: 0,
          maxItems: 50, // підібрати число в залежності від к-сті доступних
          uniqueItems: true,
          items: {
            type: "string",
            format: "hostname",
            minLength: 1,
            maxLength: 255,
          },
        },
      },
    },

    allowCurrencyCodes: {
      type: "array",
      minItems: 0,
      maxItems: 50, // підібрати
      uniqueItems: true,
      items: {
        type: "string",
        pattern: "^[A-Z0-9]*$",
        minLength: 1,
        maxLength: 16,
      },
    },

    webhook: {
      type: "object",
      additionalProperties: false,
      required: ["supported"],
      properties: {
        supported: {
          type: "boolean",
        },
        signature: {
          enum: ["none" /*подумати, які можливі*/],
        },
      },
    },

    configSchema: {
      type: "object",
    },
  },

  // пер-типові гілки — зараз майже однакові, але легко розширити:
  allOf: [
    {
      if: { properties: { type: { const: "payout" } } },
      then: {
        required: ["allowCurrencyCodes", "webhook"],
      },
    },
    {
      if: { properties: { type: { const: "merchant" } } },
      then: {
        required: ["allowCurrencyCodes", "webhook"],
      },
    },
    {
      if: { properties: { type: { const: "parser" } } },
      then: {
        properties: {
          allowCurrencyCodes: false,
          webhook: false,
        },
      },
    },
    {
      if: { properties: { type: { const: "aml" } } },
      then: {
        properties: {
          allowCurrencyCodes: false,
          webhook: false,
        },
      },
    },
  ],
} as const;
