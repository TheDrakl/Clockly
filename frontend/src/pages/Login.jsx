import LoginForm from "../components/LoginForm";

export default function Login({ onAuth }) {
  return (
    <div>
      <div>
        <h2 className="text-center text-2xl font-semibold mb-6">Login</h2>
        <LoginForm onAuth={onAuth} />
      </div>
    </div>
  );
}