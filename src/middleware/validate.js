const { err } = require('../utils/response');

/**
 * validate(schema) — Joi schema validation middleware
 * Usage: router.post('/route', validate(myJoiSchema), handler)
 */
module.exports = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return err(res, 'Validation failed', 400, errors);
  }
  next();
};
