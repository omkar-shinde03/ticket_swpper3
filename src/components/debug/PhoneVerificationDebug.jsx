import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const PhoneVerificationDebug = () => (
  <Card>
    <CardHeader>
      <CardTitle>Phone Verification Debug Panel</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-red-600">Phone verification system is currently disabled.</p>
    </CardContent>
  </Card>
);

export default PhoneVerificationDebug;
