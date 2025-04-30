import RegisterForm from "../components/RegisterForm"
export default function Register({onAuth}) {
    return (
        <div>
            <div>
                <h2 className="text-center text-2xl font-semibold mb-6">Register</h2>
                <RegisterForm onAuth={onAuth}/>
            </div>
        </div>
    )
  }