import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-4 [&_label]:text-xs"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    className="h-8 border-shadow bg-caviar/60 text-xs md:text-xs"
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    message={errors.name}
                                    className="text-[11px]"
                                    role="alert"
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    className="h-8 border-shadow bg-caviar/60 text-xs md:text-xs"
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError
                                    message={errors.email}
                                    className="text-[11px]"
                                    role="alert"
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    className="h-8 border-shadow bg-caviar/60 text-xs md:text-xs"
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password}
                                    className="text-[11px]"
                                    role="alert"
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    className="h-8 border-shadow bg-caviar/60 text-xs md:text-xs"
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                    className="text-[11px]"
                                    role="alert"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-8 w-full bg-[#e7dfd6] text-xs text-[#211d1a] hover:bg-white"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-[11px] text-[#bdb6b1]">
                            Already have an account?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="text-[#e0d9d3] hover:text-white"
                            >
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
