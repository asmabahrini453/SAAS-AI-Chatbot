import { useAuthContextHook } from '@/context/use-auth-context';
import React, { useState } from 'react';
import { useFormContext, UseFormRegister, FieldErrors, FieldValues } from 'react-hook-form';
import TypeSelectionForm from './type-selection-form';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/spinner';

//dynamic loading on the client side only: this improves performance so we only call them when we need them
const DetailForm = dynamic<{ errors: FieldErrors<FieldValues>; register: UseFormRegister<FieldValues> }>(
  () => import('@/components/forms/sign-up/account-details-form'), 
  {
    ssr: false,
    loading: () => <Spinner noPadding={true} />,
  }
);

const OTPForm = dynamic(() => import('@/components/forms/sign-up/otp-form'), {
    ssr: false,
    loading: () => <Spinner noPadding={true} />,
  });
  


type props = {};

const RegisterationFormStep: React.FC<props> = (props) => {
  // register for input registration, errors for validation errors, setValue for setting form field values.
  const { register,formState: { errors },setValue,} = useFormContext();
  const { currentStep } = useAuthContextHook(); //retrieve current step
  const [onOTP, setOnOTP] = useState<string>('');//local state for managing OTP 
  const [onUserType, setOnUserType] = useState<'owner' | 'student'>('owner');//local state for managing user type selection

  setValue('otp', onOTP);

  switch (currentStep) {
    case 1:
      return (
        <TypeSelectionForm
          register={register}
          userType={onUserType}
          setUserType={setOnUserType}
        />
      );
    case 2:
      return (
        // entering account details;
        //  it receives register and errors for validation.
        <DetailForm
          errors={errors}
          register={register}
        />
      );
    case 3:
      // return the otp form
      return (
        <OTPForm
          onOTP={onOTP}
          setOTP={setOnOTP}
        />
      )
  }

  return <div>registeration-step</div>;
};

export default RegisterationFormStep;
