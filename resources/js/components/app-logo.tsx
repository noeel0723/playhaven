import AppLogoIcon from '@/components/app-logo-icon';
import AppWordmark from '@/components/app-wordmark';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center">
                <AppLogoIcon className="h-6 w-8" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <AppWordmark className="mb-0.5 truncate text-lg" />
            </div>
        </>
    );
}
