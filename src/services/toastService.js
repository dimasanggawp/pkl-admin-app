export const showToast = (message, type = 'info') => {
  const event = new CustomEvent('toast', {
    detail: { message, type, id: Date.now() },
  });
  window.dispatchEvent(event);
};

export const showSuccess = (message) => showToast(message, 'success');
export const showError = (message) => showToast(message, 'error');
export const showInfo = (message) => showToast(message, 'info');

export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message || error?.message || 'Terjadi kesalahan yang tidak terduga'
  );
};
