import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import { index as library } from '@/routes/library';
import { index as diary } from '@/routes/diary';
import { index as lists } from '@/routes/lists';
import { me as playerProfile } from '@/routes/players';
import { index as statistics } from '@/routes/stats';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link href={library()} onClick={cleanup}>
                        Your library
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={diary()} onClick={cleanup}>
                        Diary
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={lists()} onClick={cleanup}>
                        Your lists
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={statistics()} onClick={cleanup}>
                        Your statistics
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        href={playerProfile()}
                        onClick={cleanup}
                        aria-current={
                            isCurrentOrParentUrl(playerProfile())
                                ? 'page'
                                : undefined
                        }
                        className="aria-[current=page]:bg-rein aria-[current=page]:font-medium"
                    >
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
