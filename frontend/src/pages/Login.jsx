import LoginForm from "../components/LoginForm";

export default function Login({ onAuth }) {
  return (
    <div>
      <div>
        <LoginForm onAuth={onAuth} />
      </div>
    </div>
  );
}