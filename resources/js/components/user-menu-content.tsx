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

const menuItemClass =
    'min-h-7 gap-2 px-2 py-1 font-sans text-xs leading-4 [&_svg]:size-3.5';

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-sans font-normal">
                <div className="flex items-center gap-2 px-1 py-1 text-left text-xs">
                    <UserInfo user={user} showEmail compact />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild className={menuItemClass}>
                    <Link href={library()} onClick={cleanup}>
                        Library
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={menuItemClass}>
                    <Link href={diary()} onClick={cleanup}>
                        Diary
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={menuItemClass}>
                    <Link href={lists()} onClick={cleanup}>
                        Lists
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={menuItemClass}>
                    <Link href={statistics()} onClick={cleanup}>
                        Your statistics
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={menuItemClass}>
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
                <DropdownMenuItem asChild className={menuItemClass}>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="size-3.5" aria-hidden="true" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className={menuItemClass}>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="size-3.5" aria-hidden="true" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
