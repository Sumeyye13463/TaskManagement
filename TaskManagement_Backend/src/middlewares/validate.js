// src/middlewares/validate.js
const { ZodError } = require("zod");

module.exports = (schema) => (req, res, next) => {
  try {
    const data = {
      body: req.body,
      query: req.query,
      params: req.params,
    };
    schema.parse(data);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: err.errors.map(e => ({
          path: e.path.join("."),
          message: e.message
        }))
      });
    }
    next(err);
  }
};
