import RegisterForm from "../components/RegisterForm"
export default function Register({onAuth}) {
    return (
        <div>
            <div>
                <RegisterForm onAuth={onAuth}/>
            </div>
        </div>
    )
  }