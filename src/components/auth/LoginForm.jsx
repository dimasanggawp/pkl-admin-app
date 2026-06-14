import { useState } from 'react';

function LoginForm({ onSubmit, error, loading }) {
  const [nisnNiy, setNisnNiy] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({ nisn_niy: nisnNiy, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      <div>
        <label className="field-label" htmlFor="nisn_niy">
          NIY
        </label>
        <input
          id="nisn_niy"
          type="text"
          value={nisnNiy}
          onChange={(e) => setNisnNiy(e.target.value)}
          className="field-input"
          placeholder="Masukkan NIY"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="field-label" htmlFor="password">
          Kata Sandi
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-1 py-3">
        {loading ? (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            Memproses...
          </>
        ) : (
          <>
            Masuk
            <span aria-hidden="true">&rarr;</span>
          </>
        )}
      </button>
    </form>
  );
}

export default LoginForm;
