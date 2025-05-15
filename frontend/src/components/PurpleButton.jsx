function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-purple-main text-gray-50 py-[0.3rem] px-4 outline-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-[1.5rem] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button