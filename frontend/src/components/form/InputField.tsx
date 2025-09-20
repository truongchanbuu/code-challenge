import { forwardRef, useId } from "react";

export const InputField = forwardRef<HTMLInputElement, any>(
  (
    {
      id,
      name,
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      required,
      disabled,
      readOnly,
      placeholder,
      className,
      containerClassName,
      labelClassName,
      inputClassName,
      type = "text",
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? `${name ?? "input"}-${autoId}`;
    const descId = `${inputId}-desc`;
    const errId = `${inputId}-err`;
    const describedBy = error ? errId : hint ? descId : undefined;

    return (
      <div className={`form-control ${containerClassName ?? ""}`}>
        {label && (
          <label htmlFor={inputId} className={`label ${labelClassName ?? ""}`}>
            <span className="label-text">
              {label}{" "}
              {required ? (
                <span className="text-error" aria-hidden="true">
                  *
                </span>
              ) : null}
            </span>
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span
              className="text-base-content/60 pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            name={name}
            ref={ref}
            type={type}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={[
              "input input-bordered w-full rounded-lg p-7",
              "bg-base-100 border-base-300 text-base-content placeholder:text-base-content/50",
              "focus:border-primary focus:outline-none",
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
              inputClassName ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          />

          {rightIcon && (
            <span
              className="text-base-content/60 pointer-events-none absolute inset-y-0 right-3 z-10 flex items-center"
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <div id={errId} role="alert" className="text-error mt-2 flex text-sm">
            {error}
          </div>
        ) : hint ? (
          <div id={descId} className="text-base-content/60 mt-3 text-xs">
            {hint}
          </div>
        ) : null}
      </div>
    );
  },
);

InputField.displayName = "InputField";
