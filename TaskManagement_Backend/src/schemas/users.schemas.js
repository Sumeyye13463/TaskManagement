const { z } = require('zod');

const updateUserTitleSchema = z.object({
  title: z.string().trim().min(2).max(120),
});

// validate middleware’in zod destekliyorsa export bu şekilde kalsın;
// değilse Joi’ye geç veya validate middleware’ini zod’a uyumlu yap.
module.exports = { updateUserTitleSchema };