import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PhoneVerification = () => (
  <Alert className="border-red-200 bg-red-50">
    <AlertDescription className="text-red-800">
      Phone verification is currently disabled.
    </AlertDescription>
  </Alert>
);

export default PhoneVerification;
