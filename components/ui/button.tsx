import * as React from "react"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
        const variants = {
            default: "bg-slate-900 text-white hover:bg-slate-900/90",
            outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-900",
        }

        return (
            <button
                className={`${baseStyles} ${variants[variant]} ${className || ""}`}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
