import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Phone } from 'lucide-react';
import { 
  validateAndFormatForFirebase, 
  getDisplayFormat,
  hasValidMobilePrefix 
} from '@/utils/indianPhoneValidation';

const IndianPhoneInput = ({ 
  value, 
  onChange, 
  onValidationChange, 
  placeholder = "Enter your mobile number",
  label = "Mobile Number",
  required = false,
  disabled = false,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  useEffect(() => {
    onValidationChange?.(isValid, inputValue);
  }, [isValid, inputValue, onValidationChange]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    
    // Only allow digits, spaces, +, (, ), and -
    const cleaned = newValue.replace(/[^\d\s+\-()]/g, '');
    
    setInputValue(cleaned);
    onChange?.(cleaned);
    
    // Validate as user types
    if (cleaned.length > 0) {
      validatePhoneNumber(cleaned);
    } else {
      setIsValid(false);
      setValidationMessage('');
      setShowValidation(false);
    }
  };

  const validatePhoneNumber = (phoneNumber) => {
    const validation = validateAndFormatForFirebase(phoneNumber);
    
    setIsValid(validation.isValid);
    setValidationMessage(validation.error || '');
    setShowValidation(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (inputValue.length > 0) {
      setShowValidation(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue.length > 0) {
      setShowValidation(true);
    }
  };

  const getInputStatus = () => {
    if (!inputValue) return 'default';
    if (isValid) return 'valid';
    if (showValidation && !isValid) return 'error';
    return 'default';
  };

  const getStatusIcon = () => {
    const status = getInputStatus();
    
    if (status === 'valid') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (status === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    return <Phone className="h-4 w-4 text-gray-400" />;
  };

  const getInputClassName = () => {
    const baseClasses = "transition-colors duration-200";
    const status = getInputStatus();
    
    if (status === 'valid') {
      return `${baseClasses} border-green-500 focus:border-green-600 focus:ring-green-500`;
    }
    if (status === 'error') {
      return `${baseClasses} border-red-500 focus:border-red-600 focus:ring-red-500`;
    }
    return baseClasses;
  };

  const getHelperText = () => {
    if (!inputValue) {
      return "Enter your 10-digit mobile number (e.g., 98765 43210)";
    }
    
    if (isValid) {
      const formatted = getDisplayFormat(inputValue);
      return `Valid number: ${formatted}`;
    }
    
    if (validationMessage) {
      return validationMessage;
    }
    
    return "Enter a valid Indian mobile number";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="indian-phone" className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          +91
        </div>
        
        <Input
          id="indian-phone"
          type="tel"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={`pl-12 pr-10 ${getInputClassName()}`}
          autoComplete="tel"
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Helper text */}
      <div className="text-sm text-gray-600">
        {getHelperText()}
      </div>

      {/* Validation alert */}
      {showValidation && validationMessage && !isValid && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {validationMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Success alert */}
      {showValidation && isValid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Valid Indian mobile number
          </AlertDescription>
        </Alert>
      )}

      {/* Format examples */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Accepted formats:</div>
        <div>• 98765 43210</div>
        <div>• 098765 43210</div>
        <div>• +91 98765 43210</div>
        <div>• 91 98765 43210</div>
      </div>
    </div>
  );
};

export default IndianPhoneInput;
