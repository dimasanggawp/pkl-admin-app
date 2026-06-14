import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toastEl) => {
    toastEl.addEventListener('mouseenter', Swal.stopTimer);
    toastEl.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export const showToast = (message, type = 'info') => {
  const icon = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
  Toast.fire({ icon, title: message });
};

export const showSuccess = (message) => showToast(message, 'success');
export const showError = (message) => showToast(message, 'error');
export const showInfo = (message) => showToast(message, 'info');

export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message || error?.message || 'Terjadi kesalahan yang tidak terduga'
  );
};

export const confirmAction = async ({
  title = 'Apakah Anda yakin?',
  text = '',
  confirmButtonText = 'Ya',
  cancelButtonText = 'Batal',
  icon = 'warning',
  danger = false,
} = {}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: danger ? '#dc2626' : undefined,
    reverseButtons: true,
  });

  return result.isConfirmed;
};
