import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeClientPassword } from '../api';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await changeClientPassword({ oldPassword, newPassword });
      setMessage('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => navigate('/'), 800);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '密码修改失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <p className="section-heading__eyebrow">Security</p>
          <h1>修改密码</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="publish-field">
            <label htmlFor="old-password">原密码</label>
            <input id="old-password" type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} />
          </div>

          <div className="publish-field">
            <label htmlFor="new-password">新密码</label>
            <input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </div>

          {error ? <p className="auth-form__error">{error}</p> : null}
          {message ? <p className="auth-form__success">{message}</p> : null}

          <button className="auth-form__submit" type="submit" disabled={submitting}>
            {submitting ? '提交中...' : '确认修改'}
          </button>
        </form>
      </div>
    </section>
  );
}
