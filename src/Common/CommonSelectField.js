'use client';
import React from "react";
import { Select } from "antd";
import "./commonstyles.css";

export default function CommonSelectField({
  label,
  name,
  placeholder,
  mandatory,
  onChange,
  options = [],
  value,
  error,
  errorMessage,
  disabled,
  showSearch,
  optionFilterProp = "children",
  prefix,
  className = "premium-input",
  ...rest
}) {
  return (
    <div className="commonselectfield">
      {label && (
        <div className="input-label-row">
          <p className="input-label">
            {mandatory && <span className="required-mark">*</span>}
            {label}
          </p>
        </div>
      )}
      <div className="select-input-wrapper" style={{ position: "relative" }}>
        {prefix && (
          <div className="select-prefix-icon" style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            color: "#a0aec0",
            fontSize: "18px"
          }}>
            {prefix}
          </div>
        )}
        <Select
          showSearch={showSearch}
          placeholder={placeholder}
          optionFilterProp={optionFilterProp}
          className={`${className} ${prefix ? "with-prefix" : ""}`}
          onChange={onChange}
          value={value || undefined}
          disabled={disabled}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={(() => {
            const mapped = (options || []).map((item) => ({
              label: item.label || item.name || String(item.value ?? item.id ?? ""),
              value: item.value ?? item.isoCode ?? item.id ?? item.name,
            }));
            if (
              value !== undefined &&
              value !== null &&
              value !== "" &&
              !mapped.some(
                (opt) =>
                  String(opt.value) === String(value) ||
                  String(opt.label).trim().toLowerCase() === String(value).trim().toLowerCase()
              )
            ) {
              mapped.unshift({ label: String(value), value: value });
            }
            return mapped;
          })()}
          {...rest}
        />
      </div>

      <div className={error ? "show-premium-input-error" : "hide-premium-input-error"}>
        {error && <p className="premium-error-text">{error}</p>}
      </div>
    </div>
  );
}
