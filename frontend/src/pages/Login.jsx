import LoginForm from "../components/LoginForm.jsx";

export default function Login({ onAuth }) {
  return (
    <div>
      <div>
        <LoginForm onAuth={onAuth} />
      </div>
    </div>
  );
}