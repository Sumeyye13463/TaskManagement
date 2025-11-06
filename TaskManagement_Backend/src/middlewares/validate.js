// src/middlewares/validate.js
const { ZodError } = require("zod");

// src/middlewares/validate.js
// src/middlewares/validate.js
module.exports = (schema) => async (req, res, next) => {
  try {
    if (!schema) return next();

    // Zod (sync)
    if (typeof schema.safeParse === "function") {
      const result = schema.safeParse(req.body);
      if (result.success) {
        req.body = result.data;  // strip/transform edilmiş veri
        return next();
      }
      const details = result.error.issues.map(i => i.message);
      return res.status(400).json({ message: "Doğrulama hatası", details });
    }

    // Zod (async)
    if (typeof schema.safeParseAsync === "function") {
      const result = await schema.safeParseAsync(req.body);
      if (result.success) {
        req.body = result.data;
        return next();
      }
      const details = result.error.issues.map(i => i.message);
      return res.status(400).json({ message: "Doğrulama hatası", details });
    }

    // Joi desteği (varsa projede)
    if (typeof schema.validateAsync === "function") {
      req.body = await schema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });
      return next();
    }

    // Tanınmıyorsa doğrudan geç
    return next();
  } catch (err) {
    const details =
      err?.issues?.map?.(i => i.message) ||  // Zod error
      err?.details?.map?.(d => d.message) || // Joi error
      [String(err)];
    return res.status(400).json({ message: "Doğrulama hatası", details });
  }
};
