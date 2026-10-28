import { Gamepad2 } from 'lucide-react';
import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <Gamepad2 {...props} fill="none" strokeWidth={1.6} aria-hidden="true" />
    );
}
