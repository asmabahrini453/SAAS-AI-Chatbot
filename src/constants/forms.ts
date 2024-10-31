type UserRegistrationProps = {
    id: string
    type: 'email' | 'text' | 'password'
    inputType: 'select' | 'input'
    options?: { value: string; label: string; id: string }[]
    label?: string
    placeholder: string
    name: string
  }
  //USER_REGISTRATION_FORM & USER_LOGIN_FORM are arrays of objects defining form fields for registration and login
  //we specify the properties we want then we pass them to FormGenrator to genrate the appropriate input fields
  
  export const USER_REGISTRATION_FORM: UserRegistrationProps[] = [
    {
      id: '1',
      inputType: 'input',
      placeholder: 'Full name',
      name: 'fullname',
      type: 'text',
    },
    {
      id: '2',
      inputType: 'input',
      placeholder: 'Email',
      name: 'email',
      type: 'email',
    },
    {
      id: '3',
      inputType: 'input',
      placeholder: 'Confirm Email',
      name: 'confirmEmail',
      type: 'email',
    },
    {
      id: '4',
      inputType: 'input',
      placeholder: 'Password',
      name: 'password',
      type: 'password',
    },
    {
      id: '5',
      inputType: 'input',
      placeholder: 'Confrim Password',
      name: 'confirmPassword',
      type: 'password',
    },
  ]
  
  export const USER_LOGIN_FORM: UserRegistrationProps[] = [
    {
      id: '1',
      inputType: 'input',
      placeholder: 'Enter your email',
      name: 'email',
      type: 'email',
    },
    {
      id: '2',
      inputType: 'input',
      placeholder: 'Password',
      name: 'password',
      type: 'password',
    },
  ]