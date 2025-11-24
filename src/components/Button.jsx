const Button = ({ children, variant = 'primary', icon, className = '', ...props }) => (
  <button className={`or-button or-button--${variant} ${className}`.trim()} {...props}>
    {icon ? <span className="or-button__icon">{icon}</span> : null}
    <span>{children}</span>
  </button>
)

export default Button
