// src/middlewares/error.js
module.exports = (err, req, res, next) => {
  console.error('🔥 Hata:', err);

  const status = err.status || 500;
  const message =
    err.message ||
    (status === 404
      ? 'Kaynak bulunamadı'
      : 'Sunucuda beklenmeyen bir hata oluştu');

  // Hata detaylarını sadece development ortamında göster
  const response = {
    ok: false,
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = err.stack || err;
  }

  res.status(status).json(response);
};
