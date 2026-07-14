import { Loader2 } from 'lucide-react';

function Spinner({ className = '', ...props }) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={`size-4 animate-spin ${className}`}
      {...props}
    />
  );
}

export default Spinner;
